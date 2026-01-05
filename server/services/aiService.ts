import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
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

    // --- CORE ENGINE: Hyper-Realistic Material Simulation ---
    static async performInpainting(params: {
        imagePath: string;
        stoneType: string;
        prompt?: string;
        markers: Marker[];
        finishType?: FinishType;
        color?: string;
    }): Promise<string> {

        console.log(`[AI Service] Initializing PBR Render Protocol for: ${params.stoneType}`);

        // 1. Initialize SDK
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const base64Data = params.imagePath.split(',')[1] || params.imagePath;

        // 2. Physics-Based Finish Definitions (Suggestion #3)
        // We define specific Roughness and IOR (Index of Refraction) values for the AI
        const finishType = params.finishType || 'Polished';
        const color = params.color || 'Natural';

        let finishInstruction = '';
        switch (finishType) {
            case 'Polished':
                finishInstruction = `
                - ROUGHNESS: 0.05 (Near Mirror).
                - SPECULARITY: High. Sharp, distinct reflection of windows/lights.
                - FRESNEL: Strong glancing angle reflections.`;
                break;
            case 'Matte':
            case 'Honed':
                finishInstruction = `
                - ROUGHNESS: 0.6 (Satin).
                - SPECULARITY: Low. Soft, wide, diffused highlights only.
                - REFLECTION: Blurriness intensity > 80%.`;
                break;
            case 'Leathered':
            case 'Brushed':
                finishInstruction = `
                - TEXTURE MAP: High-frequency Normal Map.
                - SURFACE: Uneven, tactile depth with micro-shadowing in crevices.
                - LIGHTING: Anisotropic scattering (brushed look).`;
                break;
            default:
                finishInstruction = `
                - ROUGHNESS: 0.05 (Standard Polish).
                - SPECULARITY: Medium-High.`;
                break;
        }

        // 3. THE "MASTER" PROMPT
        // Synthesizing all 5 Google AI Studio suggestions into one strict protocol.
        const prompt = `
        ### ROLE
        Act as a Ray-Tracing Rendering Engine (Cycles/V-Ray). 
        Your task is to re-render specific surfaces with a new physical material.

        ### INPUT PARAMETERS
        - Material: ${params.stoneType}
        - Tone: ${color}
        - Physics Profile: ${finishInstruction}

        ### USER OVERRIDE (CRITICAL PRIORITY)
        "${params.prompt || 'Apply the material seamlessly.'}"

        ### RENDER PROTOCOL (Strict Execution Order):

        1. **GEOMETRY & SEGMENTATION**
           - Detect the exact organic boundaries of the objects at the markers.
           - *Anti-Rectangular Constraint:* Follow curves, bevels, and chamfers perfectly.

        2. **MATERIAL SYNTHESIS (Suggestion #1 & #2)**
           - *Micro-Texture:* Do not generate a flat color. Generate subtle surface imperfections, mineral pitting, and crystalline variance.
           - *Vein Scale Calibration:* Analyze the scale of the object. 
             - If "Wall": Veins must be large and sweeping.
             - If "Counter/Sink": Veins must be finer and detailed.

        3. **LIGHT TRANSPORT & INTEGRATION (Suggestion #3 & #5)**
           - *Ambient Occlusion (AO):* Deepen shadows in corners (contact shadows) where the stone meets walls/cabinets. The stone must look "heavy".
           - *Lighting Interaction:* Respect the scene's light sources. If the room is warm, the highlights on the stone must be warm.
           - *Caustics:* If the finish is Polished, render faint reflections of the surrounding environment on the stone surface.

        4. **COLOR FIDELITY (Critical)**
           - You must maintain the *Local Color* (${color}) of the stone.
           - Do not let the room's ambient yellow light wash out the stone's true hue.

        ### TARGET COORDINATES
        ${params.markers.map((m, i) => `- Render Target ${i + 1}: [${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%] (${m.customLabel || "Surface"})`).join("\n")}

        ### OUTPUT
        - Return ONLY the final rendered image.
        - High Resolution, Photorealistic, No Artifacts.
        `;

        try {
            // 4. Call Model with "BLOCK_NONE" Safety to prevent architectural refusals
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                config: {
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ]
                },
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                        { text: prompt },
                    ],
                },
            });

            // 5. Extraction
            const candidate = response.candidates?.[0];

            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData?.data) {
                        console.log("[AI Service] PBR Render Complete.");
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }

            console.warn("[AI Service] Refusal:", candidate?.finishReason);
            throw new Error(`Render Engine Status: ${candidate?.finishReason || 'Failed'}`);

        } catch (error: any) {
            console.error("[AI Service] Error:", error.message);
            if (error.message.includes("404")) {
                console.error("CRITICAL: Model version mismatch. Ensure API Key has access to 'gemini-2.5-flash-image'.");
            }
            throw error;
        }
    }

    // --- Placeholders ---
    static async generateRecommendation(prompt: string, image?: string): Promise<string> {
        return "Maintenance Mode.";
    }
    static async chat(message: string, history: any[]): Promise<string> {
        return "Maintenance Mode.";
    }
    static async generateImage(prompt: string): Promise<string> { return ""; }
}