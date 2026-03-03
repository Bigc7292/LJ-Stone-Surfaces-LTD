
import { Marker } from "../types";

export class ArchitecturalEngineError extends Error {
  constructor(public code: 'QUOTA' | 'REFUSAL' | 'NETWORK' | 'UNKNOWN' | 'TIMEOUT', message: string) {
    super(message);
    this.name = 'ArchitecturalEngineError';
  }
}

/**
 * Polls a job status until completion or failure
 */
const pollJobStatus = async (jobId: string): Promise<any> => {
  const maxAttempts = 120; // 10 minutes
  const interval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/re-imager/status/${jobId}`);
    if (!response.ok) throw new ArchitecturalEngineError('NETWORK', 'Failed to check job status');

    const job = await response.json();

    if (job.status === 'completed') return job;
    if (job.status === 'failed') throw new ArchitecturalEngineError('UNKNOWN', job.error || 'Processing failed');

    await new Promise(r => setTimeout(r, interval));
  }

  throw new ArchitecturalEngineError('TIMEOUT', 'The visualization task is taking longer than expected. Please check back in a moment.');
};

/**
 * Client-side wrapper for the backend AI pipeline
 */
export const visualizeStone = async (
  originalImageBase64: string,
  markers: Marker[],
  material: string,
  color: string,
  description?: string
): Promise<{ imageUrl: string; clockwiseVideoUrl?: string; counterClockwiseVideoUrl?: string }> => {
  try {
    const response = await fetch("/api/ai/re-imager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: originalImageBase64,
        stoneType: material,
        stoneDescription: description,
        color: color,
        markers: markers
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new ArchitecturalEngineError('UNKNOWN', err.message || 'Failed to start visualization');
    }

    const { jobId } = await response.json();
    const result = await pollJobStatus(jobId);

    return {
      imageUrl: result.imageUrl,
      clockwiseVideoUrl: result.clockwiseVideoUrl,
      counterClockwiseVideoUrl: result.counterClockwiseVideoUrl
    };
  } catch (error: any) {
    if (error instanceof ArchitecturalEngineError) throw error;
    throw new ArchitecturalEngineError('NETWORK', error.message || 'Connection to LJ Stone servers failed');
  }
};

/**
 * Generate a swatch (Fallback tool or simplified)
 */
export const generateMaterialSwatch = async (materialName: string, texture: string): Promise<string> => {
  // Simple proxy to backend if needed, or keeping it as is for previewing
  // But for consistency, let's just use a simple placeholder if we don't have a backend swatch route
  return `https://via.placeholder.com/400?text=${encodeURIComponent(materialName)}`;
};
