import type { Marker } from '@/types/visualizer';

export class ArchitecturalEngineError extends Error {
    constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN', message: string) {
        super(message);
        this.name = 'ArchitecturalEngineError';
    }
}

/**
 * Generate a material swatch image
 * Note: Using static swatches instead - this is kept for potential future use
 */
export const generateMaterialSwatch = async (materialName: string, texture: string): Promise<string> => {
    // We're using static swatches defined in visualizerConstants.ts instead
    throw new ArchitecturalEngineError('REFUSAL', 'Using static swatches instead of AI generation');
};

/**
 * Visualize stone replacement using Backend Secure API
 */
export const visualizeStone = async (
    originalImageBase64: string,
    markers: Marker[],
    material: string,
    color: string
): Promise<string> => {
    // Call backend secure endpoint
    try {
        const response = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalImageUrl: originalImageBase64,
                stoneSelected: `${material} (${color})`,
                markers: markers.map(m => ({
                    x: m.x,
                    y: m.y,
                    label: m.label,
                    customLabel: m.customLabel
                }))
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Generation failed');
        }

        const data = await response.json();
        return data.generatedImageUrl;

    } catch (error: any) {
        throw new ArchitecturalEngineError('NETWORK', error.message || 'Failed to communicate with AI server');
    }
};
