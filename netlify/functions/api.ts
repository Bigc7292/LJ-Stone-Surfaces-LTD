import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { storage } from "../../server/storage";
import { api } from "../../shared/routes";
import { GrokService } from "../../server/services/grokService";
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

// AI Re-Imager (Visionary) - Now uses Grok
app.post("/api/ai/re-imager", async (req, res) => {
    try {
        const { image, stoneType } = req.body;
        if (!image) {
            return res.status(400).json({ message: "Image is required" });
        }

        if (!process.env.XAI_API_KEY) {
            console.error("CRITICAL: XAI_API_KEY is missing in Netlify environment.");
            throw new Error("Server Misconfiguration: API Key missing.");
        }

        const imageUrl = await GrokService.generateStoneVisualization({
            roomImageBase64: image,
            stoneName: stoneType || "Premium Marble",
            stoneCategory: 'Stone',
            finishType: 'Polished',
            ambience: 'Natural'
        });

        res.json({ imageUrl });
    } catch (err: any) {
        console.error("AI Re-Imager Error:", err);
        res.status(500).json({
            message: "Re-imaging failed",
            details: err.message || JSON.stringify(err)
        });
    }
});

// AI Stone Concierge — Placeholder (Gemini removed)
app.post(api.ai.consultant.path, async (req, res) => {
    try {
        res.json({ recommendation: "Stone consultation coming soon via Grok.", brief: "Stone consultation coming soon via Grok." });
    } catch (err: any) {
        console.error("AI Consultant Error:", err);
        res.status(500).json({ message: "AI Consultant failed", error: err.message });
    }
});

// AI Visualize — Placeholder (Gemini removed)
app.post(api.ai.visualize.path, async (req, res) => {
    try {
        res.json({ imageUrl: null, message: "Use /api/grok/generate-image instead" });
    } catch (err: any) {
        console.error("AI Visualize Error:", err);
        res.status(500).json({ message: "Visualization failed", error: err.message });
    }
});

// AI TTS — Placeholder (Gemini removed)
app.post(api.ai.tts.path, async (req, res) => {
    try {
        res.json({ audioBase64: "" });
    } catch (err: any) {
        console.error("AI TTS Error:", err);
        res.status(500).json({ message: "TTS failed", error: err.message });
    }
});

// AI Chat Bot — Placeholder (Gemini removed)
app.post("/api/ai/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const response = "I'm the LJ Stone assistant. Chat powered by Grok coming soon!";

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


// Secure Backend Generation Endpoint (now uses Grok)
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

        // 2. Generate Image via Grok
        const generatedImageUrl = await GrokService.generateStoneVisualization({
            roomImageBase64: input.originalImageUrl,
            stoneName: input.stoneSelected,
            stoneCategory: 'Stone',
            finishType: 'Polished',
            ambience: 'Natural'
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
