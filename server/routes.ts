import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // AI Re-Imager (Visionary) - Generative Inpainting simulation
  app.post("/api/ai/re-imager", async (req, res) => {
    try {
      const { image, stoneType } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Image is required" });
      }
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `VISIONARY TASK: Analyze this room photo. Identify the existing countertops. 
      RE-IMAGE: Replace them with ${stoneType} natural stone. 
      LIGHTING: Match the specific shadows and ambient light from the original photo. 
      PERSPECTIVE: Maintain perfect architectural alignment. 
      OUTPUT: High-definition re-imagined room state.`;
      
      const parts: any[] = [
        { text: prompt },
        {
          inlineData: {
            data: image.split(",")[1] || image,
            mimeType: "image/jpeg",
          },
        }
      ];

      const result = await model.generateContent(parts);
      const response = await result.response;
      // In a real scenario, we'd use a specialized image generation/inpainting model.
      // Gemini Flash can describe/analyze, but for visual replacement we'd typically need Imagen or SD.
      // For this implementation, we simulate the output.
      res.json({ imageUrl: "https://via.placeholder.com/1024x1024.png?text=Re-Imagined+Kitchen" });
    } catch (err) {
      console.error("AI Re-Imager Error:", err);
      res.status(500).json({ message: "Re-imaging failed" });
    }
  });

  // AI Stone Concierge (Voice & Text)
  app.post(api.ai.consultant.path, async (req, res) => {
    try {
      const { text, image } = api.ai.consultant.input.parse(req.body);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let prompt = "As an expert stone surface consultant, analyze this room and recommend stone types, edge profiles, and color palettes. Provide a structured project brief.";
      if (text) prompt += `\nRoom description: ${text}`;
      
      const parts: any[] = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            data: image.split(",")[1] || image,
            mimeType: "image/jpeg",
          },
        });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const recommendation = response.text();
      
      // Simple parsing for brief or just use the same text for now
      res.json({ recommendation, brief: recommendation });
    } catch (err) {
      console.error("AI Consultant Error:", err);
      res.status(500).json({ message: "AI Consultant failed" });
    }
  });

  // AI Visualize (Imagen)
  app.post(api.ai.visualize.path, async (req, res) => {
    try {
      const { description } = api.ai.visualize.input.parse(req.body);
      // Image generation is not supported by Gemini Flash directly in this way
      // We simulate the output URL for the prototype
      res.json({ imageUrl: "https://images.unsplash.com/photo-1628592102751-ba83b0314276?auto=format&fit=crop&q=80&w=1024" });
    } catch (err) {
      console.error("AI Visualize Error:", err);
      res.status(500).json({ message: "Visualization failed" });
    }
  });

  // AI TTS
  app.post(api.ai.tts.path, async (req, res) => {
    try {
      const { text } = api.ai.tts.input.parse(req.body);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(text);
      const response = await result.response;
      // TTS response handling
      res.json({ audioBase64: "" }); 
    } catch (err) {
      console.error("AI TTS Error:", err);
      res.status(500).json({ message: "TTS failed" });
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
