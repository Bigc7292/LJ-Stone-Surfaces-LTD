import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import axios from "axios";
import FormData from "form-data";
import fs from "fs/promises";
import path from "path";

// --- Utility Functions ---
function log(message: string, source = "ai-service") {
    const formattedTime = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    console.log(`${formattedTime} [${source}] ${message}`);
}

// --- API Clients ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Interfaces ---
export interface Marker {
    id: number;
    x: number;
    y: number;
    label?: string;
}

export class AIService {
    // --- KNOWLEDGE & PROMPTS ---
    private static knowledgeBase: string | null = null;
    private static async getKnowledgeBase(): Promise<string> {
        if (this.knowledgeBase) return this.knowledgeBase;

        const possiblePaths = [
            path.join(process.cwd(), "server", "services", "knowledge_base.md"),
            path.join(process.cwd(), "knowledge_base.md"),
        ];

        for (const p of possiblePaths) {
            try {
                this.knowledgeBase = await fs.readFile(p, "utf-8");
                log(`Knowledge base loaded from: ${p}`, "ai-service-kb");
                return this.knowledgeBase;
            } catch (e) {
                // Continue
            }
        }
        log("Warning: Knowledge base file not found. Using default.", "ai-service-kb");
        return "LJ Stone Surfaces - Premium stone countertops and surfaces.";
    }

    private static getArchitecturalPrompt(stoneType: string, markers: Marker[]): string {
        return `
    ACT AS: Elite Architectural Digital Retoucher.
    TASK: High-fidelity stone resurfacing on the provided image.
    MATERIAL: ${stoneType}.

    ARCHITECTURAL RULES (MASTER QUALITY):
    1. CONTINUITY: Clad all continuous vertical wall planes and fixtures (bathtub, sink) with seamless stone slabs.
    2. LIGHTING: Preserve all ambient LED glows, warm backlighting, and natural window light.
    3. PRESERVATION: 
       - DO NOT touch horizontal floor tiles.
       - DO NOT remove sunlight or glares on the floor.
       - Preserve all metal taps and hardware.
    4. PRECISION: Sharp crisp transitions where stone meets the floor.

    MARKERS (surfaces to transform):
    ${markers.map((m, i) => `- Site ${i + 1} (${(m.x * 100).toFixed(1)}%, ${(m.y * 100).toFixed(1)}%): ${m.label || 'Surface area'}`).join("\n")}

    FINAL OUTPUT: High-resolution photorealistic image with the stone applied.
    IMPORTANT: Return ONLY the transformed image, no text explanation.
        `;
    }

    // --- PRIMARY IMAGE GENERATION ---
    static async generateGeminiImage(params: {
        imageWithMime: string;
        stoneType: string;
        markers: Marker[];
        prompt?: string;
    }): Promise<string> {
        const { imageWithMime, stoneType, markers, prompt } = params;
        const finalPrompt = prompt || this.getArchitecturalPrompt(stoneType, markers);

        try {
            // --- ATTEMPT 1: Standard Google AI Key ---
            log("Attempting image generation with standard Gemini 1.5 Flash key...", "gemini-image");
            return await this.runGeminiImageGeneration(
                process.env.GEMINI_API_KEY,
                finalPrompt,
                imageWithMime,
                "gemini-1.5-flash-latest"
            );
        } catch (error: any) {
            log(`Standard Gemini key failed: ${error.message}`, "gemini-image");
            
            // --- ATTEMPT 2: Replit AI Integration Fallback ---
            if (error.message.includes("quota") || error.message.includes("limit")) {
                log("Switching to Replit AI Integration fallback...", "gemini-image-fallback");
                
                const replitKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
                const replitUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

                if (!replitKey || !replitUrl) {
                    throw new Error("Replit AI Integration credentials not configured.");
                }

                // The Replit proxy uses a different model name convention
                const replitModelName = "gemini-1.5-flash-image"; 

                return await this.runGeminiImageGeneration(
                    replitKey,
                    finalPrompt,
                    imageWithMime,
                    replitModelName,
                    replitUrl
                );
            }
            // Re-throw if it wasn't a quota error
            throw error;
        }
    }

    private static async runGeminiImageGeneration(
        apiKey: string | undefined,
        prompt: string,
        imageWithMime: string,
        modelName: string,
        baseUrl?: string
    ): Promise<string> {
        if (!apiKey) {
            throw new Error(`API key for model ${modelName} is not configured.`);
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName }, baseUrl ? { baseUrl } : undefined);

        const base64Data = imageWithMime.split(",")[1] || imageWithMime;
        const mimeType = imageWithMime.includes("image/png") ? "image/png" : "image/jpeg";

        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
        ]);

        const response = result.response;
        const candidates = response.candidates;

        if (!candidates || candidates.length === 0) throw new Error("No response from AI model.");
        
        const part = candidates[0].content?.parts[0];
        if (part && part.inlineData?.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }

        const textPart = parts.find(p => p.text);
        if (textPart?.text) {
             throw new Error(`AI returned text instead of image: ${textPart.text.slice(0, 200)}`);
        }

        throw new Error("Unexpected response format from AI model.");
    }


    // --- CHAT & RECOMMENDATION ---
    static async chat(message: string, history: any[] = []): Promise<string> {
        try {
            // --- ATTEMPT 1: Gemini Pro ---
            log("Attempting chat with Gemini Pro...", "gemini-chat");
            return await this.runGeminiChat(message, history);
        } catch (error: any) {
            log(`Gemini Pro chat failed: ${error.message}`, "gemini-chat");
            
            // --- ATTEMPT 2: Groq Fallback ---
            log("Switching to Groq fallback for chat...", "groq-chat-fallback");
            return this.runGroqChat(message, history);
        }
    }

    private static async runGeminiChat(message: string, history: any[]): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key not configured.");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const knowledgeBase = await this.getKnowledgeBase();
        const systemPrompt = `You are the LJ Stone Surfaces AI Assistant, a professional interior designer. Your knowledge base is below.\n\n---\n${knowledgeBase}\n---`;
        
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am the LJ Stone Surfaces AI Assistant. How can I help you design your space?" }] },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.content }],
                })),
            ],
        });

        const result = await chat.sendMessage(message);
        return result.response.text();
    }

    private static async runGroqChat(message: string, history: any[]): Promise<string> {
        if (!process.env.GROQ_API_KEY) throw new Error("Groq API key not configured.");
        
        const knowledgeBase = await this.getKnowledgeBase();
        const systemPrompt = `You are the LJ Stone Surfaces AI Assistant, a professional interior designer. Use the knowledge base below to answer questions.\n\n---\n${knowledgeBase}\n---`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: "llama3-8b-8192", // A fast and capable model
        });

        return chatCompletion.choices[0]?.message?.content || "I am sorry, but I am unable to respond at this moment.";
    }
}