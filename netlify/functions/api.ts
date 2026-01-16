import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { storage } from "../../server/storage";
import { api } from "../../shared/routes";
import { AIService } from "../../server/services/aiService";
import { z } from "zod";

const app = express();

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: false }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============ AI Routes ============

// AI Re-Imager (Visionary) - Generative Inpainting with Markers
app.post("/api/ai/re-imager", async (req, res) => {
    try {
        const { image, stoneType, markers } = req.body;
        if (!image) {
            return res.status(400).json({ message: "Image is required" });
        }

        if (markers && markers.length > 0) {
            console.log(`Re-Imager: Processing ${markers.length} marked surfaces`);
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("CRITICAL: GEMINI_API_KEY is missing/undefined in Netlify environment.");
            throw new Error("Server Misconfiguration: API Key missing.");
        }

        const imageUrl = await AIService.performInpainting({
            imagePath: image,
            stoneType: stoneType || "Premium Marble",
            prompt: `Replace existing surfaces with ${stoneType}`,
            markers: markers || []
        });

        res.json({ imageUrl });
    } catch (err: any) {
        console.error("AI Re-Imager Error:", err);
        // Return 'details' to match client's expectation
        res.status(500).json({
            message: "Re-imaging failed",
            details: err.message || JSON.stringify(err)
        });
    }
});

// AI Stone Concierge (Voice & Text)
app.post(api.ai.consultant.path, async (req, res) => {
    try {
        const { text, image } = api.ai.consultant.input.parse(req.body);
        const prompt = "As an expert stone surface consultant, analyze this room and recommend stone types, edge profiles, and color palettes. Provide a structured project brief.";
        const fullPrompt = text ? `${prompt}\nRoom description: ${text}` : prompt;

        const recommendation = await AIService.generateRecommendation(fullPrompt, image);
        res.json({ recommendation, brief: recommendation });
    } catch (err: any) {
        console.error("AI Consultant Error:", err);
        res.status(500).json({ message: "AI Consultant failed", error: err.message });
    }
});

// AI Visualize (Imagen)
app.post(api.ai.visualize.path, async (req, res) => {
    try {
        const { description } = api.ai.visualize.input.parse(req.body);
        const imageUrl = await AIService.generateImage(description);
        res.json({ imageUrl });
    } catch (err: any) {
        console.error("AI Visualize Error:", err);
        res.status(500).json({ message: "Visualization failed", error: err.message });
    }
});

// AI TTS
app.post(api.ai.tts.path, async (req, res) => {
    try {
        const { text } = api.ai.tts.input.parse(req.body);
        await AIService.generateRecommendation(text);
        res.json({ audioBase64: "" });
    } catch (err: any) {
        console.error("AI TTS Error:", err);
        res.status(500).json({ message: "TTS failed", error: err.message });
    }
});

// AI Chat Bot
app.post("/api/ai/chat", async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const response = await AIService.chat(message, history || []);

        // Log the conversation to the database
        const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;

        await storage.createChatLog({
            sessionId,
            userMessage: message,
            aiResponse: response,
        }).catch(err => console.error("Failed to log chat:", err));

        res.json({ response });
    } catch (err: any) {
        console.error("AI Chat Error:", err);
        res.status(500).json({ message: "Chat failed", error: err.message });
    }
});

// AI Visualizer Data Logging (New)
app.post(api.ai.logGeneration.path, async (req, res) => {
    try {
        const input = api.ai.logGeneration.input.parse(req.body);
        const newGen = await storage.createVisualizerGeneration(input);
        res.json({ success: true, id: newGen.id });
    } catch (err: any) {
        console.error("Failed to log visualizer generation:", err);
        res.status(500).json({ success: false });
    }
});

app.patch(api.ai.updateGeneration.path, async (req, res) => {
    try {
        const { id, generatedImageUrl } = api.ai.updateGeneration.input.parse(req.body);
        await storage.updateVisualizerGeneration(id, generatedImageUrl);
        res.json({ success: true });
    } catch (err: any) {
        console.error("Failed to update visualizer generation:", err);
        res.status(500).json({ success: false });
    }
});


// Secure Backend Generation Endpoint
app.post(api.ai.generateImage.path, async (req, res) => {
    try {
        const input = api.ai.generateImage.input.parse(req.body);

        // 1. Log Start
        const logEntry = await storage.createVisualizerGeneration({
            originalImageUrl: input.originalImageUrl,
            stoneSelected: input.stoneSelected,
            promptUsed: input.promptUsed || "Auto-generated on server",
            markers: input.markers
        });

        // 2. Generate Image via Backend Service
        const generatedImageUrl = await AIService.generateGeminiImage({
            imageWithMime: input.originalImageUrl,
            stoneType: input.stoneSelected,
            markers: input.markers || [],
            prompt: input.promptUsed
        });

        // 3. Log Update
        await storage.updateVisualizerGeneration(logEntry.id, generatedImageUrl);

        res.json({ success: true, generatedImageUrl });

    } catch (err: any) {
        console.error("Backend Generation Failed:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Generation failed"
        });
    }
});


// ============ Product Routes ============

// Get all products
app.get(api.products.list.path, async (req, res) => {
    try {
        // Ensure data exists (Lazy seeding)
        await storage.seedProducts();

        const category = req.query.category as string | undefined;
        const products = await storage.getProducts(category);
        res.json(products);
    } catch (err: any) {
        console.error("Products Error:", err);
        res.status(500).json({ message: "Failed to get products", error: err.message });
    }
});

// Get single product
app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await storage.getProduct(Number(req.params.id));
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (err: any) {
        console.error("Product Error:", err);
        res.status(500).json({ message: "Failed to get product", error: err.message });
    }
});

// ============ Inquiry Routes ============

app.post(api.inquiries.create.path, async (req, res) => {
    try {
        const input = api.inquiries.create.input.parse(req.body);
        const inquiry = await storage.createInquiry(input);
        res.status(201).json(inquiry);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                message: err.errors[0].message,
                field: err.errors[0].path.join("."),
            });
        }
        console.error("Inquiry Error:", err);
        res.status(500).json({ message: "Failed to create inquiry", error: err.message });
    }
});

// Initialize products on cold start
let initialized = false;
app.use(async (req, res, next) => {
    if (!initialized) {
        try {
            await storage.seedProducts();
            initialized = true;
        } catch (e) {
            console.error("Seed error:", e);
        }
    }
    next();
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
});

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export handler for Netlify
export const handler = serverless(app);
