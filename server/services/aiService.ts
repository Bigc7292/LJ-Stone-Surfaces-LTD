import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

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
        const isRetryable = error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("overloaded");
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

console.log(`[AI Engine] Initializing with Official SDK. Key: ${apiKey ? "PRESENT" : "MISSING"}`);
const genAI = new GoogleGenerativeAI(apiKey || "missing-key");

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

    static async performInpainting({
        imagePath,
        imagePath2,
        stoneSlabPath,
        stoneType,
        stoneDescription,
        finishType,
        color,
        prompt: userPrompt,
        markers,
        declutter = false,
        autoDetectSimilar = true
    }: any) {
        const TRACE_ID = "PRODUCTION_V1";
        console.log(`[AI Service] Starting Inpainting [${TRACE_ID}]`);

        const getBase64 = (input: string | undefined): any | null => {
            if (!input) return null;
            let base64 = "";
            let mimeType = "image/jpeg";

            if (input.startsWith('data:')) {
                const match = input.match(/^data:(image\/\w+);base64,(.+)$/);
                if (match) {
                    mimeType = match[1];
                    base64 = match[2];
                }
            } else {
                try {
                    const cleanInput = input.startsWith('/') ? input.substring(1) : input;
                    const possiblePaths = [
                        path.join(process.cwd(), 'client', 'public', cleanInput),
                        path.join(process.cwd(), 'public', cleanInput),
                        path.join(process.cwd(), cleanInput)
                    ];
                    for (const p of possiblePaths) {
                        if (fs.existsSync(p) && !fs.lstatSync(p).isDirectory()) {
                            base64 = fs.readFileSync(p).toString('base64');
                            mimeType = p.endsWith('.png') ? 'image/png' : 'image/jpeg';
                            console.log(`[AI Service] Loaded local file: ${p}`);
                            break;
                        }
                    }
                } catch (e) {
                    console.error(`[AI Service] Failed to load path: ${input}`, e);
                }
            }

            // Critical threshold: Only accept real image data (> 5KB)
            if (base64.length > 5000) {
                return { inlineData: { data: base64, mimeType } };
            }
            console.warn(`[AI Service] Rejected input (too small or not base64): ${input?.substring(0, 50)}...`);
            return null;
        };

        const part1 = getBase64(imagePath);
        const part2 = getBase64(imagePath2) || part1;
        const partSlab = getBase64(stoneSlabPath);

        if (!part1) throw new Error("Primary image missing or too small.");

        const finishInstruction = finishType === 'Polished' ? 'POLISHED mirror-like finish' :
            finishType === 'Matte' ? 'MATTE soft finish' : 'LEATHERED textured finish';

        const prompt = `
            ROLE: Expert 3D Architectural Visualizer.
            TASK: Replace the countertops/surfaces in the room images with the stone texture provided.
            
            SURFACE TARGETS: ${markers?.length ? JSON.stringify(markers) : "Detect automatically - kitchen counters"}
            STONE: ${stoneType || "Quartzite"} (${stoneDescription || "Natural exotic stone"})
            FINISH: ${finishInstruction}
            AMBIENCE: ${color || "Natural"}
            
            INSTRUCTIONS:
            1. Use Image 1 and Image 2 to understand the 3D space.
            2. Apply the stone texture from the third image to all countertop surfaces.
            3. Match lighting and shadows perfectly for photorealism.
            4. Return ONLY the final high-resolution render of the FIRST room view.
            
            ${userPrompt ? `USER OVERRIDE: ${userPrompt}` : ""}
        `;

        return fetchWithRetry(async () => {
            // Use the experimental model that supports image generation
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const parts: any[] = [part1, part2];
            if (partSlab) parts.push(partSlab);
            parts.push({ text: prompt });

            console.log(`[AI Service] Sending to Gemini 2.0 Flash Exp... Parts: ${parts.length}`);

            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    // @ts-ignore - Experimental image output modality
                    responseModalities: ["IMAGE", "TEXT"]
                }
            });

            const response = await result.response;
            const resParts = response.candidates?.[0]?.content?.parts;

            if (!resParts) throw new ArchitecturalEngineError('UNKNOWN', "Empty response from AI.");

            // Check for image data first
            for (const part of resParts) {
                if (part.inlineData) {
                    console.log(`[AI Service] SUCCESS! Got image response.`);
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }

            // If no image, check for text (description fallback)
            for (const part of resParts) {
                if (part.text) {
                    console.log(`[AI Service] Got text response instead of image: ${part.text.substring(0, 100)}`);
                    throw new ArchitecturalEngineError('REFUSAL', `Model returned text instead of image: ${part.text.substring(0, 200)}`);
                }
            }

            throw new ArchitecturalEngineError('REFUSAL', `Model did not return expected data.`);
        });
    }

    static async chat(message: string, history: any[]) {
        return "I am ready to visualize your design.";
    }
}


