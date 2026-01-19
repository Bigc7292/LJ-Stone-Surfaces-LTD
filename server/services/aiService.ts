import { GoogleGenAI } from "@google/genai";

// ============================================================================
// 1. ERROR HANDLING & CONFIGURATION
// ============================================================================
export class ArchitecturalEngineError extends Error {
    constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN', message: string) {
        super(message);
        this.name = 'ArchitecturalEngineError';
    }
}

// Resilient Fetcher (Retries if Google is busy)
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isRetryable = error.message?.includes("429") || error.message?.includes("503");
        if (retries > 0 && isRetryable) {
            console.log(`[AI Engine] Busy. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// Initialize Google Client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) console.error("FATAL: Google API Key is missing! Add GEMINI_API_KEY to Secrets.");

const ai = new GoogleGenAI({ apiKey: apiKey || "missing-key" });

// ============================================================================
// 2. AI SERVICE (THE BRAIN)
// ============================================================================
export class AIService {
    static generateRecommendation(fullPrompt: string, image: string | undefined) {
        throw new Error("Method not implemented.");
    }
    static generateImage(description: string) {
        throw new Error("Method not implemented.");
    }

    /**
     * FEATURE 1: SMART SURFACE DETECTION
     * Asks Gemini to identify and list all surfaces of a specific type (e.g., "walls").
     * Returns a list of coordinates/descriptions for the Frontend to auto-place markers.
     */
    static async detectSurfaces(imagePath: string, objectPrompt: string = "walls, countertops, island") {
        try {
            console.log(`[AI Service] Detecting surfaces: ${objectPrompt}`);
            const base64Data = imagePath.replace(/^data:image\/\w+;base64,/, "");

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                        {
                            text: `
              Analyze this interior image. 
              Identify ALL instances of: "${objectPrompt}".
              Return a JSON list of bounding boxes [ymin, xmin, ymax, xmax] and labels for each detected item.
              OUTPUT FORMAT: JSON Only.
              `
                        },
                    ],
                },
                config: { responseMimeType: "application/json" }
            });

            // Returns structured JSON data of where the walls/counters are
            return response.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        } catch (e: any) {
            console.error("[AI Service] Detection Failed:", e);
            return null;
        }
    }

    /**
     * FEATURE 2: INTELLIGENT MATERIAL MATCHER
     * Analyzes the current stone and suggests contrasting options.
     * (Logic helper - normally connected to your DB)
     */
    static suggestComplementaryMaterials(currentTone: string, allStones: any[]) {
        // Basic logic: If Dark, suggest Light. If Light, suggest Dark.
        const targetTone = currentTone === 'Dark' ? 'Light' : currentTone === 'Light' ? 'Dark' : 'Warm';
        return allStones.filter(s => s.tone === targetTone).slice(0, 3);
    }

    /**
     * MAIN FEATURE: ADVANCED VISUALIZER (Inpainting)
     * Includes: Depth Awareness, Magic Eraser, and Similar Surface Recognition
     */
    static async performInpainting({
        imagePath,        // Angle 1 (Main)
        imagePath2,       // Angle 2 (Perspective)
        stoneSlabPath,    // The Actual Stone Slab Reference
        stoneType,
        stoneDescription,
        finishType,
        color,
        prompt: userPrompt,
        markers,
        declutter = false,
        autoDetectSimilar = true
    }: any) {

        // Clean Base64 data for all three inputs
        const base64Data1 = imagePath.replace(/^data:image\/\w+;base64,/, "");
        const base64Data2 = imagePath2 ? imagePath2.replace(/^data:image\/\w+;base64,/, "") : base64Data1;
        const base64Slab = stoneSlabPath ? stoneSlabPath.replace(/^data:image\/\w+;base64,/, "") : null;

        // A. Finish Logic (Preserved)
        let finishInstruction = '';
        switch (finishType) {
            case 'Polished': finishInstruction = `FINISH: POLISHED. High gloss, sharp specular highlights, mirror-like reflectivity.`; break;
            case 'Matte': finishInstruction = `FINISH: MATTE. Soft diffusion, zero gloss, dry stone look.`; break;
            case 'Leathered': finishInstruction = `FINISH: LEATHERED. Textured, tactile depth, complex micro-shadowing.`; break;
            default: finishInstruction = `FINISH: POLISHED.`;
        }

        // B. Smart Targeting Logic (Preserved)
        let targetInstruction = "Detect the main surface.";
        if (markers && markers.length > 0) {
            targetInstruction = markers.map((m: any, i: number) =>
                `Target ${i + 1}: "${m.customLabel || m.label}" at [X:${m.x.toFixed(1)}%, Y:${m.y.toFixed(1)}%]`
            ).join("\n");

            if (autoDetectSimilar) {
                targetInstruction += "\nINTELLIGENT EXPANSION: Identify and include ALL surfaces that are structurally identical.";
            }
        }

        // C. The "Mega-Prompt" (Updated for Spatial Consistency)
        const fullPrompt = `
      ROLE: Expert 3D Architectural Visualizer & Retoucher.
      TASK: Replace the identified countertops in both room images with the texture from the stone slab image.

      --- 1. SPATIAL REASONING ---
      - Cross-reference Image 1 and Image 2 to understand the 3D volume of the surfaces.
      - Ensure the stone veining flows naturally across corners and joins.
      - MATCH LIGHTING: The stone must inherit the exact highlights and shadows of the room.

      --- 2. SURFACE DATA ---
      TARGETS: ${targetInstruction}
      MATERIAL: ${stoneType} (${stoneDescription})
      ${finishInstruction}
      ${declutter ? "MAGIC ERASER: Remove clutter from surfaces first." : ""}

      OUTPUT: Return ONLY the final photorealistic render of the first room image.
    `;

        // D. Call Google Gemini with Multi-Part Payload
        return fetchWithRetry(async () => {
            console.log(`[AI Service] Multi-Perspective Rendering Start...`);

            const parts: any[] = [
                { inlineData: { data: base64Data1, mimeType: 'image/jpeg' } }, // View 1
                { inlineData: { data: base64Data2, mimeType: 'image/jpeg' } }, // View 2
            ];

            if (base64Slab) {
                parts.push({ inlineData: { data: base64Slab, mimeType: 'image/jpeg' } }); // The Stone
            }

            parts.push({ text: fullPrompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash', // Optimized for image-to-image spatial tasks
                contents: [
                    {
                        parts: parts,
                    }
                ],
                config: {
                    responseModalities: ["IMAGE"],
                }
            });

            const candidate = response.candidates?.[0];
            if (!candidate?.content?.parts) throw new ArchitecturalEngineError('UNKNOWN', "Empty response.");

            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
            throw new ArchitecturalEngineError('REFUSAL', "Model refused to render.");
        });
    }

    // Helper for Chat Interface
    static async chat(message: string, history: any[]) {
        // You can hook this up to a text model if you want conversational design advice
        return "I am ready to visualize your design.";
    }
}