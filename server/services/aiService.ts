import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";

// --- Types ---
export interface Marker {
    x: number;
    y: number;
    label?: string;
    customLabel?: string;
}

export type FinishType = 'Polished' | 'Matte' | 'Honed' | 'Leathered' | 'Brushed';

export class AIService {

    // --- 1. THE CRITICAL FIX: Image Generation Engine ---
    // This matches your working Google AI Studio logic exactly
    static async performInpainting(params: {
        imagePath: string;
        stoneType: string;
        prompt?: string;
        markers: Marker[];
        finishType?: FinishType;
        color?: string;
    }): Promise<string> {

        console.log(`[AI Service] Initializing Gemini 2.5 Flash Image for: ${params.stoneType}`);

        // Initialize the NEW SDK
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // 1. Prepare Image Data (Strip header if present)
        const base64Data = params.imagePath.split(',')[1] || params.imagePath;

        // 2. Build Finish Instruction
        const finishType = params.finishType || 'Polished';
        const color = params.color || 'Natural';

        let finishInstruction = '';
        switch (finishType) {
            case 'Polished': finishInstruction = `FINISH: POLISHED. High reflectivity, sharp specular highlights.`; break;
            case 'Matte': finishInstruction = `FINISH: MATTE. Low reflectivity, soft diffused light.`; break;
            case 'Leathered': finishInstruction = `FINISH: LEATHERED. Textured, micro-shadows, tactile depth.`; break;
            default: finishInstruction = `FINISH: POLISHED. High gloss.`; break;
        }

        // 3. Build The Prompt (Your Proven "Studio" Prompt)
        const prompt = `
        ROLE: Expert Interior Design Image Editor.
        TASK: Apply "Target Stone" to objects identified by markers.
        
        TARGET STONE: ${params.stoneType} in ${color} tone.
        ${finishInstruction}

        OPERATIONAL PROTOCOL:
        1. SEGMENTATION: Do NOT create rectangular patches. Segment the ENTIRE object (sink, wall, counter) identified by the marker.
        2. POINTERS: Markers are pointers. If labeled "Wall", retexture the entire wall plane.
        3. REALISM: Preserve lighting, shadows, and perspective. The stone must look built-in.

        MARKERS:
        ${params.markers.map((m, i) => `- Marker ${i + 1}: [${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%] (${m.customLabel || "Surface"})`).join("\n")}

        USER INSTRUCTION: "${params.prompt || 'Apply stone seamlessly.'}"
        
        OUTPUT: Return ONLY the modified photographic image.
        `;

        try {
            // 4. Call the Model
            // 'gemini-2.5-flash-image' is the model you used in Studio. 
            // If this specific string fails locally, try 'gemini-1.5-pro-002' or check your Studio settings.
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                        { text: prompt },
                    ],
                },
            });

            // 5. Extract Image
            const candidate = response.candidates?.[0];

            // Loop to find the image part
            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData?.data) {
                        console.log("[AI Service] Success! Image generated.");
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }

            throw new Error("Model refused to render an image (returned text only).");

        } catch (error: any) {
            console.error("[AI Service] Generation Failed:", error.message);
            // Fallback: Return original image so app doesn't crash, but log error
            if (error.message.includes("404") || error.message.includes("not found")) {
                console.error("CRITICAL: Model 'gemini-2.5-flash-image' not found. Check API access.");
            }
            throw error;
        }
    }

    // --- 2. Chat & Recommendation (Keep existing logic or update later) ---
    static async generateRecommendation(prompt: string, image?: string): Promise<string> {
        return "Chat functionality is temporarily disabled for maintenance.";
    }

    static async chat(message: string, history: any[]): Promise<string> {
        return "Chat functionality is temporarily disabled for maintenance.";
    }

    static async generateImage(prompt: string): Promise<string> { return ""; }
}