
import { GoogleGenAI } from "@google/genai";
import { Marker } from "../types";

export class ArchitecturalEngineError extends Error {
  constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN', message: string) {
    super(message);
    this.name = 'ArchitecturalEngineError';
  }
}

/**
 * Exponential backoff helper for resilient API calls
 */
const fetchWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable =
      error.message?.includes("429") ||
      error.message?.includes("RESOURCE_EXHAUSTED") ||
      error.message?.includes("500") ||
      error.message?.includes("xhr error") ||
      error.message?.includes("ProxyUnaryCall");

    if (retries > 0 && isRetryable) {
      console.warn(`Architectural Engine busy. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const generateMaterialSwatch = async (materialName: string, texture: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY });

  const prompt = `
    A high-end 3D architectural sample swatch of the stone material: ${materialName}.
    Texture: ${texture}.
    Square stone slab, 3/4 perspective, professional studio lighting, realistic depth and mineral veins.
    Clean neutral background.
    OUTPUT: Photographic Image.
  `;

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: prompt }] },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) throw new ArchitecturalEngineError('UNKNOWN', "Empty engine response.");

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new ArchitecturalEngineError('REFUSAL', "Model refused to render swatch.");
  }).catch((error: any) => {
    if (error instanceof ArchitecturalEngineError) throw error;
    if (error.message?.includes("429")) throw new ArchitecturalEngineError('QUOTA', "Global rate limit reached. Please wait 60s.");
    throw new ArchitecturalEngineError('NETWORK', "Cloud connection failed.");
  });
};

export const visualizeStone = async (
  originalImageBase64: string,
  markers: Marker[],
  material: string,
  color: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY });
  const base64Data = originalImageBase64.split(',')[1] || originalImageBase64;

  const prompt = `
    ACT AS: Elite Architectural Digital Retoucher.
    TASK: High-fidelity stone resurfacing.
    MATERIAL: ${material} in ${color} tone.
    
    ARCHITECTURAL RULES (MASTER QUALITY):
    1. CONTINUITY: Clad all continuous vertical wall planes and fixtures (bathtub, sink) with seamless stone slabs. Even if markers are sparse, use architectural logic to finish the room's design.
    2. LIGHTING: Preserve all ambient LED glows, warm backlighting, and natural window light. The new ${material} must have realistic ray-traced reflections and soft shadows.
    3. PRESERVATION: 
       - DO NOT touch the horizontal light beige floor tiles.
       - DO NOT remove sunlight glares on the floor.
       - Preserve all gold/brass taps and hardware.
    4. PRECISION: Sharp crisp transitions where stone meets the floor.
    
    MARKERS:
    ${markers.map((m, i) => `- Site ${i + 1} (${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%): ${m.customLabel}`).join('\n')}

    FINAL OUTPUT: Photorealistic High-Resolution Image.
  `;

  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) throw new ArchitecturalEngineError('UNKNOWN', "Render failed.");

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new ArchitecturalEngineError('REFUSAL', "Model refused to render the scene.");
  }).catch((error: any) => {
    if (error instanceof ArchitecturalEngineError) throw error;
    if (error.message?.includes("429")) throw new ArchitecturalEngineError('QUOTA', "Render capacity full. Please wait 60s.");
    throw new ArchitecturalEngineError('NETWORK', "Connection to rendering cloud lost.");
  });
};
