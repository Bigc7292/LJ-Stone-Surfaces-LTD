import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from "fs/promises";
import path from "path";

// --- Configuration ---
// We use the model that supports image generation. 
// If 'gemini-2.5-flash-image' is not available in your tier, switch to 'gemini-1.5-pro-002'
const IMAGE_MODEL_NAME = "gemini-2.0-flash-exp";

// --- Interfaces ---
export interface Marker {
    id?: number;
    x: number;
    y: number;
    label?: string;
    customLabel?: string;
}

export type FinishType = 'Polished' | 'Matte' | 'Honed' | 'Leathered' | 'Brushed';

export class AIService {

    // --- UTILITY: Knowledge Base (Kept from your original code) ---
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
                return this.knowledgeBase;
            } catch (e) { /* continue */ }
        }
        return "LJ Stone Surfaces - Premium stone countertops and surfaces.";
    }

    // --- CORE VISUALIZER ENGINE (The "Brain Transplant") ---
    static async performInpainting(params: {
        imagePath: string;
        stoneType: string;
        prompt?: string;
        markers: Marker[];
        finishType?: FinishType; // Added parameter
        color?: string;          // Added parameter
    }): Promise<string> {

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: IMAGE_MODEL_NAME });

        // 1. Prepare Image Data
        const base64Data = params.imagePath.split(",")[1] || params.imagePath;
        const mimeType = params.imagePath.includes("image/png") ? "image/png" : "image/jpeg";

        // 2. Construct Finish Intelligence (From your working code)
        const finishType = params.finishType || 'Polished';
        const color = params.color || 'Natural';

        let finishInstruction = '';
        switch (finishType) {
            case 'Polished':
                finishInstruction = `- FINISH TYPE: POLISHED. Increase surface reflectivity significantly. Add sharp, distinct specular highlights. The stone MUST show faint, distorted reflections of surrounding environment. Emphasize extreme smoothness and high gloss.`;
                break;
            case 'Matte':
            case 'Honed':
                finishInstruction = `- FINISH TYPE: MATTE/HONED. Set surface to very low reflectivity. Light should diffuse softly across the surface with no sharp reflections. Surface should appear smooth but not glossy.`;
                break;
            case 'Leathered':
            case 'Brushed':
                finishInstruction = `- FINISH TYPE: LEATHERED/BRUSHED. Simulate a textured, non-smooth surface. Add subtle micro-shadows and tactile depth. Reflectivity should be minimal and diffused.`;
                break;
        }

        // 3. The "High Fidelity" Prompt (Your working logic)
        const systemPrompt = `
        ROLE: You are an expert Interior Design Image Editor specializing in photorealistic 3D volumetric stone surfacing.
        
        OBJECTIVE: Apply "${params.stoneType}" (Color: ${color}) to the specific object(s) identified by the user's markers.
        
        OPERATIONAL PROTOCOL:
        1. ZERO RECTANGULAR PATCHES: ABSOLUTELY AVOID creating simple rectangular boxes. You MUST perform intelligent, full-object semantic segmentation.
        2. MARKER AS POINTER: The markers provided are POINTERS. 
           - If a marker is on a "Wall", retexture the ENTIRE continuous wall plane.
           - If a marker is on a "Sink", retexture the ENTIRE sink volume (rim, basin, front).
           - If a marker is on a "Countertop", retexture the whole surface edge-to-edge.
        3. FINISH & PHYSICS: 
           ${finishInstruction}
        4. REALISM:
           - Preserve all original lighting, shadows, and occlusions.
           - The stone must look "sunken" into the room, not floating on top.
           - Maintain sharp edges where stone meets other materials (faucets, floor, glass).
        
        MARKERS PROVIDED:
        ${params.markers.map((m, i) => `- Marker ${i + 1} at [X:${m.x.toFixed(1)}%, Y:${m.y.toFixed(1)}%] labeled "${m.customLabel || m.label || 'Surface'}"`).join("\n")}
        
        USER INSTRUCTION: "${params.prompt || 'Apply this stone surface seamlessly.'}"
        
        OUTPUT: Return ONLY the modified image.
        `;

        try {
            console.log(" [AI Service] Sending request to Gemini...");

            const result = await model.generateContent([
                { text: systemPrompt },
                { inlineData: { mimeType, data: base64Data } }
            ]);

            const response = result.response;

            // 4. Extract Image (Robust extraction)
            // Some models return candidates[0].content.parts[0] as the image
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) throw new Error("No response from AI.");

            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    console.log(" [AI Service] Image generation successful.");
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }

            // If we get here, the model might have returned text refusal or failed
            console.warn(" [AI Service] Model returned text instead of image:", candidates[0].content.parts[0].text);
            throw new Error("Model refused to render visual output. Please try a different angle or marker.");

        } catch (error: any) {
            console.error(" [AI Service] Generation Error:", error.message);
            // In production, we throw so the UI knows it failed, rather than silently returning original
            throw error;
        }
    }

    // --- CHAT SERVICES (Preserved from your code) ---
    static async chat(message: string, history: any[] = []): Promise<string> {
        try {
            return await this.runGeminiChat(message, history);
        } catch (error: any) {
            console.log("Switching to Groq fallback...");
            return this.runGroqChat(message, history);
        }
    }

    static async generateRecommendation(prompt: string, image?: string): Promise<string> {
        return this.chat(prompt, []);
    }

    // Placeholder for simple generation
    static async generateImage(prompt: string): Promise<string> {
        return "";
    }

    // --- PRIVATE CHAT IMPLEMENTATIONS ---
    private static async runGeminiChat(message: string, history: any[]): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key not configured.");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const knowledgeBase = await this.getKnowledgeBase();
        const systemPrompt = `You are the LJ Stone Surfaces AI Assistant. Knowledge Base:\n${knowledgeBase}`;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. How can I help?" }] },
                ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
            ],
        });
        const result = await chat.sendMessage(message);
        return result.response.text();
    }

    private static async runGroqChat(message: string, history: any[]): Promise<string> {
        if (!process.env.GROQ_API_KEY) throw new Error("Groq API key not configured.");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const knowledgeBase = await this.getKnowledgeBase();
        const messages = [
            { role: "system", content: `You are LJ Stone Assistant.\n${knowledgeBase}` },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
        ];
        const chatCompletion = await groq.chat.completions.create({
            messages: messages as any,
            model: "llama3-8b-8192",
        });
        return chatCompletion.choices[0]?.message?.content || "Unavailable.";
    }
}