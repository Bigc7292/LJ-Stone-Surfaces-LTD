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

    // ============================================================================
    // 3. SCENE DATA GENERATION (For 3D Visualization)
    // ============================================================================
    static async generateSceneData({ imagePath }: { imagePath: string }): Promise<{
        depthMap: string;
        countertopMask: string;
        metadata: { surfaceDetected: boolean }
    }> {
        console.log(`[AI Service] Generating Scene Data for 3D Visualization...`);

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
                            break;
                        }
                    }
                } catch (e) {
                    console.error(`[AI Service] Failed to load path: ${input}`, e);
                }
            }

            if (base64.length > 5000) {
                return { inlineData: { data: base64, mimeType } };
            }
            return null;
        };

        const imagePart = getBase64(imagePath);
        if (!imagePart) throw new Error("Primary image missing or too small for scene analysis.");

        // Generate depth map
        const depthMap = await fetchWithRetry(async () => {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        imagePart,
                        {
                            text: `TASK: Generate a DEPTH MAP of this room image.

OUTPUT: A single grayscale image where:
- WHITE (255) = Closest objects to camera
- BLACK (0) = Farthest objects from camera
- Gradients for intermediate depths

INSTRUCTIONS:
1. Analyze the 3D spatial layout of the room
2. Generate a depth map showing distance from the camera
3. Foreground objects (countertops, islands) should be lighter
4. Background (walls, windows) should be darker
5. Maintain sharp edges on object boundaries

Return ONLY the depth map image, no text.`
                        }
                    ]
                }],
                generationConfig: {
                    // @ts-ignore - Experimental image output modality
                    responseModalities: ["IMAGE", "TEXT"]
                }
            });

            const response = await result.response;
            const parts = response.candidates?.[0]?.content?.parts;

            for (const part of parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("Failed to generate depth map");
        });

        console.log(`[AI Service] Depth map generated. Length: ${depthMap.length}`);

        // Generate countertop mask
        const countertopMask = await fetchWithRetry(async () => {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        imagePart,
                        {
                            text: `TASK: Generate a BINARY MASK identifying all COUNTERTOP and SURFACE areas.

OUTPUT: A single black-and-white image where:
- WHITE (255) = Countertop/surface areas (kitchen counters, islands, vanities)
- BLACK (0) = Everything else (walls, floors, appliances, cabinets)

INSTRUCTIONS:
1. Identify all horizontal work surfaces in the image
2. Include: kitchen countertops, islands, bathroom vanities, tabletops
3. Exclude: floors, walls, cabinet faces, appliances, sinks, stovetops
4. Create sharp, accurate edges around the countertop boundaries
5. The mask should be high-resolution and precise

Return ONLY the mask image, no text.`
                        }
                    ]
                }],
                generationConfig: {
                    // @ts-ignore - Experimental image output modality
                    responseModalities: ["IMAGE", "TEXT"]
                }
            });

            const response = await result.response;
            const parts = response.candidates?.[0]?.content?.parts;

            for (const part of parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("Failed to generate countertop mask");
        });

        console.log(`[AI Service] Countertop mask generated. Length: ${countertopMask.length}`);

        return {
            depthMap,
            countertopMask,
            metadata: { surfaceDetected: true }
        };
    }
}
