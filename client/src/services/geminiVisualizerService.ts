import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Marker } from '@/types/visualizer';

// Get API key from Vite environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-exp';

export class ArchitecturalEngineError extends Error {
    constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN', message: string) {
        super(message);
        this.name = 'ArchitecturalEngineError';
    }
}

/**
 * Helper function for retrying API calls
 */
const fetchWithRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
            const isLastAttempt = attempt === maxRetries - 1;

            if (isLastAttempt || !isRateLimit) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Rate limited, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max retries exceeded');
};

/**
 * Generate a material swatch image
 * Note: Using static swatches instead - this is kept for potential future use
 */
export const generateMaterialSwatch = async (materialName: string, texture: string): Promise<string> => {
    // We're using static swatches defined in visualizerConstants.ts instead
    throw new ArchitecturalEngineError('REFUSAL', 'Using static swatches instead of AI generation');
};

/**
 * Visualize stone replacement using Gemini API
 */
export const visualizeStone = async (
    originalImageBase64: string,
    markers: Marker[],
    material: string,
    color: string
): Promise<string> => {
    if (!API_KEY) {
        throw new ArchitecturalEngineError('NETWORK', 'Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const base64Data = originalImageBase64.split(',')[1] || originalImageBase64;
    const mimeType = originalImageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';

    const prompt = `
    ACT AS: Elite Architectural Digital Retoucher.
    TASK: High-fidelity stone resurfacing on the provided image.
    MATERIAL: ${material} in ${color} tone.
    
    ARCHITECTURAL RULES (MASTER QUALITY):
    1. CONTINUITY: Clad all continuous vertical wall planes and fixtures (bathtub, sink) with seamless stone slabs. Even if markers are sparse, use architectural logic to finish the room's design.
    2. LIGHTING: Preserve all ambient LED glows, warm backlighting, and natural window light. The new ${material} must have realistic ray-traced reflections and soft shadows.
    3. PRESERVATION: 
       - DO NOT touch horizontal floor tiles.
       - DO NOT remove sunlight or glares on the floor.
       - Preserve all metal taps and hardware.
    4. PRECISION: Sharp crisp transitions where stone meets the floor.
    
    MARKERS (surfaces to transform):
    ${markers.map((m, i) => `- Site ${i + 1} (${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%): ${m.customLabel || m.label}`).join('\n')}

    FINAL OUTPUT: High-resolution photorealistic image with the stone applied.
    IMPORTANT: Return ONLY the transformed image, no text explanation.
  `;

    // 1. Log start (captures input before generation)
    const logId = await startGenerationLog(originalImageBase64, material, prompt, markers);

    try {
        const result = await fetchWithRetry(async () => {
            return await model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        mimeType,
                        data: base64Data,
                    },
                },
            ]);
        });

        const response = result.response;
        const candidates = response.candidates;

        if (!candidates || candidates.length === 0) {
            throw new ArchitecturalEngineError('REFUSAL', 'No response from AI model.');
        }

        const parts = candidates[0].content?.parts;
        if (!parts || parts.length === 0) {
            throw new ArchitecturalEngineError('REFUSAL', 'Empty response from AI model.');
        }

        // Look for image data in the response
        for (const part of parts) {
            if (part.inlineData?.data) {
                const imgMime = part.inlineData.mimeType || 'image/png';
                const resultUrl = `data:${imgMime};base64,${part.inlineData.data}`;

                // 2. Log completion (updates with output)
                if (logId) {
                    await updateGenerationLog(logId, resultUrl);
                }

                return resultUrl;
            }
        }

        // If no image, check for text (might be a refusal or error)
        const textPart = parts.find(p => p.text);
        if (textPart?.text) {
            throw new ArchitecturalEngineError('REFUSAL', `AI returned text instead of image: ${textPart.text.slice(0, 200)}`);
        }

        throw new ArchitecturalEngineError('UNKNOWN', 'Unexpected response format from AI model.');

    } catch (error: any) {
        if (error instanceof ArchitecturalEngineError) throw error;

        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate')) {
            throw new ArchitecturalEngineError('QUOTA', 'API rate limit reached. Please try again later or use a different API key.');
        }

        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            throw new ArchitecturalEngineError('NETWORK', `Network error: ${error.message}`);
        }

        throw new ArchitecturalEngineError('UNKNOWN', `AI service error: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Start logging generation (captures inputs)
 */
const startGenerationLog = async (
    originalImage: string,
    material: string,
    prompt: string,
    markers: Marker[]
): Promise<number | null> => {
    try {
        const response = await fetch('/api/ai/log-generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalImageUrl: originalImage,
                stoneSelected: material,
                promptUsed: prompt,
                markers: markers.map(m => ({
                    x: m.x,
                    y: m.y,
                    label: m.label,
                    customLabel: m.customLabel
                }))
            }),
        });
        const data = await response.json();
        return data.id || null;
    } catch (err) {
        console.warn('Failed to start generation log:', err);
        return null;
    }
};

/**
 * Complete logging generation (captures output)
 */
const updateGenerationLog = async (
    id: number,
    generatedImage: string
) => {
    try {
        await fetch('/api/ai/update-generation', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                generatedImageUrl: generatedImage,
            }),
        });
    } catch (err) {
        console.warn('Failed to update generation log:', err);
    }
};

/**
 * Test the Gemini API connection
 */
export const testGeminiConnection = async (): Promise<string> => {
    // ... existing test code ...
    if (!API_KEY) {
        throw new ArchitecturalEngineError('NETWORK', 'API key not configured');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    try {
        const result = await model.generateContent('Say hello in one word');
        return result.response.text() || 'Connected';
    } catch (error: any) {
        if (error.message?.includes('429')) {
            throw new ArchitecturalEngineError('QUOTA', 'Rate limited - quota will reset soon');
        }
        throw new ArchitecturalEngineError('NETWORK', `Connection test failed: ${error.message}`);
    }
};
