import type { Marker } from '@/types/visualizer';

// Declare puter as a global (loaded via script tag in index.html)
declare const puter: {
    ai: {
        chat: (prompt: string | any[], options?: { model?: string; stream?: boolean }) => Promise<string | AsyncIterable<{ text?: string }>>;
    };
};

export class ArchitecturalEngineError extends Error {
    constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN', message: string) {
        super(message);
        this.name = 'ArchitecturalEngineError';
    }
}

/**
 * Check if Puter.js is available
 */
const waitForPuter = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof puter !== 'undefined') {
            resolve();
            return;
        }

        // Wait up to 5 seconds for Puter to load
        let attempts = 0;
        const check = setInterval(() => {
            attempts++;
            if (typeof puter !== 'undefined') {
                clearInterval(check);
                resolve();
            } else if (attempts > 50) {
                clearInterval(check);
                reject(new ArchitecturalEngineError('NETWORK', 'Puter.js failed to load'));
            }
        }, 100);
    });
};

/**
 * Generate a material swatch image using Puter.js (FREE Gemini access)
 * Note: This requires Gemini image generation which may not be available via Puter
 * For now, we'll use static images - this function is kept for potential future use
 */
export const generateMaterialSwatch = async (materialName: string, texture: string): Promise<string> => {
    // Note: Puter.js may not support image generation output yet
    // We're using static swatches defined in visualizerConstants.ts instead
    throw new ArchitecturalEngineError('REFUSAL', 'Using static swatches instead of AI generation');
};

/**
 * Visualize stone replacement using Puter.js FREE Gemini API
 */
export const visualizeStone = async (
    originalImageBase64: string,
    markers: Marker[],
    material: string,
    color: string
): Promise<string> => {
    await waitForPuter();

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

    try {
        // Use Puter.js with Gemini for image understanding + generation
        // We need to pass the image as a data URL
        const imageDataUrl = `data:${mimeType};base64,${base64Data}`;

        const response = await puter.ai.chat([
            { type: 'text', text: prompt },
            { type: 'image', url: imageDataUrl }
        ], {
            model: 'gemini-2.0-flash'  // Using gemini-2.0-flash for image understanding
        });

        // Check if response contains image data
        if (typeof response === 'string') {
            // If response is text and contains base64 image data
            const base64Match = response.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
            if (base64Match) {
                return base64Match[0];
            }

            // Puter may not support image output - throw informative error
            throw new ArchitecturalEngineError('REFUSAL',
                'Image generation not available. The AI analyzed your image but cannot generate modified images through Puter.js. ' +
                'Consider using a direct Gemini API key when your rate limits reset.');
        }

        throw new ArchitecturalEngineError('UNKNOWN', 'Unexpected response format from AI service.');

    } catch (error: any) {
        if (error instanceof ArchitecturalEngineError) throw error;

        if (error.message?.includes('rate') || error.message?.includes('limit')) {
            throw new ArchitecturalEngineError('QUOTA', 'Rate limit reached. Please try again later.');
        }

        throw new ArchitecturalEngineError('NETWORK', `AI service error: ${error.message || 'Unknown error'}`);
    }
};

/**
 * Simple text chat with Gemini via Puter.js (for testing)
 */
export const testPuterConnection = async (): Promise<string> => {
    await waitForPuter();

    try {
        const response = await puter.ai.chat('Say hello in one word', {
            model: 'gemini-2.0-flash'
        });

        return typeof response === 'string' ? response : 'Connected successfully';
    } catch (error: any) {
        throw new ArchitecturalEngineError('NETWORK', `Connection test failed: ${error.message}`);
    }
};
