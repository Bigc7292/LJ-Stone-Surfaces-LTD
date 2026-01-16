import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { AIService } from "./services/aiService";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

export async function registerRoutes(
    httpServer: Server,
    app: Express
): Promise<Server> {
    // AI Re-Imager (Visionary) - Generative Inpainting with Markers
    app.post("/api/ai/re-imager", async (req, res) => {
        res.json({ message: "DEBUG OK" });
    });

    // Products
    app.get(api.products.list.path, async (req, res) => {
        // Lazy seed for local dev
        // await storage.seedProducts();
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

    return httpServer;
}
