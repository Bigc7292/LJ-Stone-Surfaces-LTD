import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { AIService } from "./services/aiService";
import { z } from "zod";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Simple logger helper
  const fileLog = (msg: string) => {
    fs.appendFileSync("server-errors.txt", `[${new Date().toISOString()}] ${msg}\n`);
  };

  // AI Re-Imager (Visionary) - Generative Inpainting with Markers
  // UPDATED: Now supports "stoneDescription" for Smart Prompting
  app.post("/api/ai/re-imager", async (req, res) => {
    // 1. Extended Timeout for High-Res Rendering (120s)
    req.setTimeout(120000);

    try {
      // 2. Destructure inputs - ADDED "stoneDescription"
      const { image, imagePath2, stoneSlabPath, stoneType, markers, finishType, color, prompt, stoneDescription } = req.body;

      // Validation
      if (!image) return res.status(400).json({ message: "Image data is required" });
      if (!markers || markers.length === 0) return res.status(400).json({ message: "At least one marker is required" });

      console.log(`[API] Processing Re-Image: ${stoneType} | ${finishType} | Description Provided: ${!!stoneDescription}`);

      // 3. CONSTRUCT THE SMART PROMPT
      // Start with a strong base instruction
      let finalPrompt = `Apply the stone material "${stoneType}" to the marked areas.`;

      // If we have the scraped description, inject it!
      if (stoneDescription) {
        finalPrompt += `\n\nMATERIAL VISUAL DESCRIPTION:\n"${stoneDescription}"\n\n`;
        finalPrompt += `INSTRUCTIONS:\n- Strictly follow the visual description above for texture, vein pattern, and color.\n- Ensure high-resolution detail matching the description.\n- Render with a ${finishType || 'Polished'} finish.`;
      } else {
        // Fallback if no description exists (e.g. for generic stones)
        finalPrompt += ` Surface finish: ${finishType || 'Polished'}. Color tone: ${color || 'Natural'}.`;
      }

      // If the user typed something in the chat box, append it as high priority
      if (prompt) {
        finalPrompt += `\n\nUSER OVERRIDE:\n${prompt}`;
      }

      // 4. Call the Advanced AI Service
      const imageUrl = await AIService.performInpainting({
        imagePath: image,
        imagePath2: imagePath2,
        stoneSlabPath: stoneSlabPath,
        stoneType: stoneType || "Marble",
        // Send our new detailed prompt
        prompt: finalPrompt,
        markers: markers,
        finishType: finishType || 'Polished',
        color: color || 'Natural'
      });

      // 5. Success Response
      if (!res.headersSent) {
        res.json({ imageUrl });
      }

    } catch (err: any) {
      console.error("[API] Re-Imager Failed:", err.message);

      if (!res.headersSent) {
        res.status(500).json({
          message: "The AI Architect encountered an error.",
          details: err.message
        });
      }
    }
  });

  // AI Re-Imager (Visionary) - DEBUG
  app.get("/api/debug-diagnostics", (_req, res) => {
    try {
      const debugInfo = {
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
        distContent: fs.existsSync("dist") ? fs.readdirSync("dist") : "dist not found",
        publicContent: fs.existsSync("dist/public") ? fs.readdirSync("dist/public") : "dist/public not found",
        publicIndex: fs.existsSync("dist/public/index.html") ? "Exists" : "Missing"
      };
      res.json(debugInfo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      fileLog(`AI Consultant Error: ${err.message}\n${err.stack}`);
      res.status(500).json({ message: "AI Consultant failed", error: err.message });
    }
  });

  // AI Visualize (Imagen)
  app.post(api.ai.visualize.path, async (req, res) => {
    try {
      const { description } = api.ai.visualize.input.parse(req.body);
      const imageUrl = await AIService.generateImage(description);
      res.json({ imageUrl });
    } catch (err) {
      console.error("AI Visualize Error:", err);
      res.status(500).json({ message: "Visualization failed" });
    }
  });

  // AI TTS
  app.post(api.ai.tts.path, async (req, res) => {
    try {
      const { text } = api.ai.tts.input.parse(req.body);
      await AIService.generateRecommendation(text, undefined);
      res.json({ audioBase64: "" });
    } catch (err) {
      console.error("AI TTS Error:", err);
      res.status(500).json({ message: "TTS failed" });
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
      // Generate a simple session ID if not provided (could be improved with robust session handling)
      const sessionId = req.headers['x-session-id'] as string || `session_${Date.now()}`;

      await storage.createChatLog({
        sessionId,
        userMessage: message,
        aiResponse: response,
      }).catch(err => console.error("Failed to log chat:", err));

      res.json({ response });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      fileLog(`AI Chat Error: ${err.message}\n${err.stack}`);
      res.status(500).json({ message: "Chat failed", error: err.message });
    }
  });

  // AI Visualizer Data Logging (New)
  app.post(api.ai.logGeneration.path, async (req, res) => {
    try {
      const input = api.ai.logGeneration.input.parse(req.body);
      const newGen = await storage.createVisualizerGeneration(input);
      res.json({ success: true, id: newGen.id });
    } catch (err) {
      console.error("Failed to log visualizer generation:", err);
      // Don't block the UI if logging fails
      res.status(500).json({ success: false });
    }
  });

  app.patch(api.ai.updateGeneration.path, async (req, res) => {
    try {
      const { id, generatedImageUrl } = api.ai.updateGeneration.input.parse(req.body);
      await storage.updateVisualizerGeneration(id, generatedImageUrl);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update visualizer generation:", err);
      res.status(500).json({ success: false });
    }
  });

  // Secure Backend Generation Endpoint
  app.post(api.ai.generateImage.path, async (req, res) => {
    // 90s timeout for generation
    req.setTimeout(90000);

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
      const generatedImageUrl = await AIService.performInpainting({
        imagePath: input.originalImageUrl,
        imagePath2: undefined,
        stoneSlabPath: undefined,
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

  // Products
  app.get(api.products.list.path, async (req, res) => {
    // Lazy seed for local dev
    await storage.seedProducts();
    const category = req.query.category as string | undefined;
    const products = await storage.getProducts(category);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  // Inquiries
  app.post(api.inquiries.create.path, async (req, res) => {
    try {
      // Allow extra fields like 'source' to pass through if the schema is open, 
      // or explicitly parse it if updated.
      // We updated insertInquirySchema in schema.ts to include 'source'.
      const input = api.inquiries.create.input.parse(req.body);
      const inquiry = await storage.createInquiry(input);
      res.status(201).json(inquiry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Seed data on startup
  await storage.seedProducts();

  return httpServer;
}