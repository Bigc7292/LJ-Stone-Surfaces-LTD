import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { GrokService } from "./services/grokService";
import { z } from "zod";
import fs from "fs";
import path from "path";


// Simple persistent logger for background processes
const fileLog = (msg: string) => {
  const logPath = path.join(process.cwd(), "server-debug.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
  } catch (err) {
    console.error(`[fileLog Error] Could not write to ${logPath}:`, err);
  }
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

// Grok video job queue for async video generation
const grokVideoJobQueue = new Map<string, {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  grokRequestId?: string;
  videoUrl?: string;
  error?: string;
  createdAt: number;
}>();

// Cleanup old Grok video jobs every hour
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [jobId, job] of grokVideoJobQueue.entries()) {
    if (now - job.createdAt > ONE_HOUR) {
      grokVideoJobQueue.delete(jobId);
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

      // Run Grok AI service in background
      (async () => {
        try {
          console.log(`[API] Starting Grok image generation for ${jobId}...`);
          const imageUrl = await GrokService.generateStoneVisualization({
            roomImageBase64: finalImage,
            stoneTexturePath: finalSlab,
            stoneName: stoneType || "Marble",
            stoneCategory: stoneDescription || 'Stone',
            finishType: (finishType || 'Polished') as 'Polished' | 'Honed' | 'Leathered',
            ambience: color || 'Natural'
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


  // AI Stone Concierge (Voice & Text) — Placeholder (Gemini removed)
  app.post(api.ai.consultant.path, async (req, res) => {
    try {
      const { text } = api.ai.consultant.input.parse(req.body);
      res.json({ recommendation: "Stone consultation coming soon via Grok.", brief: "Stone consultation coming soon via Grok." });
    } catch (err: any) {
      console.error("AI Consultant Error:", err);
      res.status(500).json({ message: "AI Consultant failed", error: err.message });
    }
  });

  // AI Visualize — Placeholder (Gemini removed)
  app.post(api.ai.visualize.path, async (req, res) => {
    try {
      const { description } = api.ai.visualize.input.parse(req.body);
      res.json({ imageUrl: null, message: "Use /api/grok/generate-image instead" });
    } catch (err) {
      console.error("AI Visualize Error:", err);
      res.status(500).json({ message: "Visualization failed" });
    }
  });

  // AI TTS — Placeholder (Gemini removed)
  app.post(api.ai.tts.path, async (req, res) => {
    try {
      const { text } = api.ai.tts.input.parse(req.body);
      res.json({ audioBase64: "" });
    } catch (err) {
      console.error("AI TTS Error:", err);
      res.status(500).json({ message: "TTS failed" });
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

  // Secure Backend Generation Endpoint (now uses Grok)
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

  // ============================================================================
  // GROK AI ENDPOINTS
  // ============================================================================

  // Grok Image Generation - Automatic Surface Detection
  app.post("/api/grok/generate-image", async (req, res) => {
    try {
      const {
        roomImage,
        stoneName,
        stoneCategory,
        stoneTexture,
        stoneTextureBase64,
        finishType = 'Polished',
        ambience = 'Natural'
      } = req.body;

      if (!roomImage) {
        return res.status(400).json({ message: "Room image is required" });
      }

      if (!stoneName) {
        return res.status(400).json({ message: "Stone name is required" });
      }

      console.log(`[Grok API] Generating image: ${stoneName} (${stoneCategory}), has texture ref: ${!!stoneTextureBase64}`);

      const imageUrl = await GrokService.generateStoneVisualization({
        roomImageBase64: roomImage,
        stoneTexturePath: stoneTexture,
        stoneTextureBase64,
        stoneName,
        stoneCategory: stoneCategory || 'Stone',
        finishType,
        ambience
      });

      res.json({
        success: true,
        imageUrl,
        message: "Image generated successfully"
      });

    } catch (err: any) {
      console.error("[Grok API] Image generation failed:", err.message);
      fileLog(`Grok Image Error: ${err.message}\n${err.stack}`);
      res.status(500).json({
        success: false,
        message: err.message || "Failed to generate image"
      });
    }
  });

  // Grok Video Generation - Walkthrough Animation (Async)
  app.post("/api/grok/generate-video", async (req, res) => {
    try {
      const {
        transformedImage,
        duration = 10,
        resolution = '720p'
      } = req.body;

      if (!transformedImage) {
        return res.status(400).json({ message: "Transformed image is required" });
      }

      const jobId = `grok_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize job in queue
      grokVideoJobQueue.set(jobId, {
        status: 'processing',
        createdAt: Date.now()
      });

      console.log(`[Grok API] Starting video generation: ${jobId}`);

      // Respond immediately with job ID
      res.status(202).json({
        jobId,
        message: "Video generation started. Poll for status."
      });

      // Process in background
      (async () => {
        try {
          const { requestId } = await GrokService.generateWalkthroughVideo({
            transformedImageBase64: transformedImage,
            duration,
            resolution
          });

          grokVideoJobQueue.set(jobId, {
            ...grokVideoJobQueue.get(jobId)!,
            grokRequestId: requestId
          });

          // Poll Grok API for completion
          const pollInterval = 5000; // 5 seconds
          const maxAttempts = 120; // 10 minutes max (extended from 5 mins)
          let attempts = 0;

          const pollGrok = async () => {
            try {
              const status = await GrokService.checkVideoStatus(requestId);

              if (status.status === 'completed' && status.videoUrl) {
                grokVideoJobQueue.set(jobId, {
                  ...grokVideoJobQueue.get(jobId)!,
                  status: 'completed',
                  videoUrl: status.videoUrl
                });
                console.log(`[Grok API] Video completed: ${jobId}`);
              } else if (status.status === 'failed') {
                grokVideoJobQueue.set(jobId, {
                  ...grokVideoJobQueue.get(jobId)!,
                  status: 'failed',
                  error: status.error || 'Video generation failed'
                });
                console.error(`[Grok API] Video failed: ${jobId}`);
              } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(pollGrok, pollInterval);
              } else {
                grokVideoJobQueue.set(jobId, {
                  ...grokVideoJobQueue.get(jobId)!,
                  status: 'failed',
                  error: 'Video generation timeout'
                });
              }
            } catch (pollErr: any) {
              console.error(`[Grok API] Poll error: ${pollErr.message}`);
              grokVideoJobQueue.set(jobId, {
                ...grokVideoJobQueue.get(jobId)!,
                status: 'failed',
                error: pollErr.message
              });
            }
          };

          // Start polling
          setTimeout(pollGrok, pollInterval);

        } catch (err: any) {
          console.error(`[Grok API] Video job ${jobId} failed:`, err.message);
          fileLog(`Grok Video Error: ${err.message}\n${err.stack}`);
          grokVideoJobQueue.set(jobId, {
            ...grokVideoJobQueue.get(jobId)!,
            status: 'failed',
            error: err.message
          });
        }
      })();

    } catch (err: any) {
      console.error("[Grok API] Video initialization failed:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to start video generation"
        });
      }
    }
  });

  // Grok Video Status Polling
  app.get("/api/grok/video-status/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = grokVideoJobQueue.get(jobId);

    if (!job) {
      return res.status(404).json({ message: "Video job not found" });
    }

    res.json({
      status: job.status,
      videoUrl: job.videoUrl,
      error: job.error
    });
  });

  return httpServer;

}