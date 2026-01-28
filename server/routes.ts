import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { AIService } from "./services/aiService";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Simple persistent logger for background processes
const fileLog = (msg: string) => {
  const logPath = path.join(process.cwd(), "server-debug.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

fileLog("Server routes initialized.");

// In-memory job queue for asynchronous AI tasks
const aiJobQueue = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
  createdAt: number;
}>();

// Cleanup old jobs every hour
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [jobId, job] of aiJobQueue.entries()) {
    if (now - job.createdAt > ONE_HOUR) {
      aiJobQueue.delete(jobId);
    }
  }
}, 60 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // AI Re-Imager (Visionary) - Generative Inpainting with Markers
  // UPDATED: Now supports Asynchronous Polling with Job IDs
  app.post("/api/ai/re-imager", async (req, res) => {
    try {
      const {
        image, primary_room,
        imagePath2, offset_room,
        stoneSlabPath, stone_texture,
        stoneType, markers, finishType, color, prompt, stoneDescription
      } = req.body;

      // Normalize inputs
      const finalImage = image || primary_room;
      const finalImagePath2 = imagePath2 || offset_room;
      const finalSlab = stoneSlabPath || stone_texture;

      // Validation
      if (!finalImage) return res.status(400).json({ message: "Image data is required" });

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize job in queue
      aiJobQueue.set(jobId, {
        status: 'processing',
        createdAt: Date.now()
      });

      console.log(`[API] Processing Re-Image (Asynchronous): ${jobId} | ${stoneType}`);

      // Respond immediately with 202 Accepted
      res.status(202).json({ jobId, message: "Image processing started" });

      // Run AI service in background
      (async () => {
        try {
          // 3. CONSTRUCT THE SMART PROMPT
          let finalPrompt = `Apply the stone material "${stoneType}" to the marked areas.`;
          if (stoneDescription) {
            finalPrompt += `\n\nMATERIAL VISUAL DESCRIPTION:\n"${stoneDescription}"\n\n`;
            finalPrompt += `INSTRUCTIONS:\n- Strictly follow the visual description above for texture, vein pattern, and color.\n- Ensure high-resolution detail matching the description.\n- Render with a ${finishType || 'Polished'} finish.`;
          } else {
            finalPrompt += ` Surface finish: ${finishType || 'Polished'}. Color tone: ${color || 'Natural'}.`;
          }
          if (prompt) {
            finalPrompt += `\n\nUSER OVERRIDE:\n${prompt}`;
          }

          console.log(`[API] Starting background inpainting for ${jobId}...`);
          const imageUrl = await AIService.performInpainting({
            imagePath: finalImage,
            imagePath2: finalImagePath2,
            stoneSlabPath: finalSlab,
            stoneType: stoneType || "Marble",
            prompt: finalPrompt,
            markers: markers || [],
            finishType: finishType || 'Polished',
            color: color || 'Natural'
          });

          aiJobQueue.set(jobId, {
            ...aiJobQueue.get(jobId)!,
            status: 'completed',
            imageUrl
          });
          console.log(`[API] Job Completed: ${jobId}`);
        } catch (err: any) {
          console.error(`[API] Job Failed: ${jobId}`, err.message);
          fileLog(`Job ${jobId} Failed: ${err.message}\n${err.stack}`);
          aiJobQueue.set(jobId, {
            ...aiJobQueue.get(jobId)!,
            status: 'failed',
            error: err.message
          });
        }
      })();

    } catch (err: any) {
      console.error("[API] Re-Imager Initialization Failed:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to initialize AI process", details: err.message });
      }
    }
  });

  // GET Job Status
  app.get("/api/re-imager/status/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = aiJobQueue.get(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
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

  return httpServer;
}