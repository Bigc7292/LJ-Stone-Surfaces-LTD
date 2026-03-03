/**
 * Gemini Video Service - Google Veo Integration
 * Handles image-to-video generation for kitchen walkthroughs.
 */
import { uploadVideoFromUrl } from './cloudinaryService.ts';

export class GeminiVideoServiceError extends Error {
    constructor(
        public code: 'API_KEY_MISSING' | 'PROJECT_ID_MISSING' | 'GENERATION_FAILED' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN',
        message: string
    ) {
        super(message);
        this.name = 'GeminiVideoServiceError';
    }
}

export interface VideoGenerationResult {
    clockwiseVideoUrl: string;
    counterClockwiseVideoUrl: string;
}

export class GeminiVideoService {
    private static get credentials() {
        return {
            apiKey: process.env.GOOGLE_API_KEY,
            projectId: process.env.GOOGLE_PROJECT_ID,
            location: process.env.GOOGLE_LOCATION || "us-central1"
        };
    }

    /**
     * Resilient Fetcher with Retries
     */
    private static async fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000): Promise<Response> {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) return res;
                const errBody = await res.text();
                console.warn(`[Gemini Video Service] Attempt ${i + 1} failed: ${errBody}`);
                if (i === retries - 1) throw new Error(errBody);
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(s => setTimeout(s, Math.pow(2, i) * delay));
            }
        }
        throw new Error("Maximum retries reached for API call.");
    }

    /**
     * Generates two cinematic walkthrough videos based on the static edited image.
     * Target duration: 11 seconds.
     */
    async generateKitchenWalkVideos(editedImageUrl: string, stoneName: string): Promise<VideoGenerationResult> {
        const basePrompt = `Generate an 11-second photorealistic video walkthrough using the generate_video tool based on the reference image. The video must simulate a slow, smooth, natural human walking pace at an eye level of approximately 5 feet 8 inches. Focus on observing the new ${stoneName} countertops from multiple angles using gentle left and right panning. The style must be serene and photorealistic, with no people or text, and no changes to the room's original layout, objects, or lighting. The video must preserve every detail of the static image (same layout, same objects, same lighting).`;

        const clockwisePrompt = `${basePrompt} Movement: Slowly moving clockwise around the kitchen island.`;
        const counterClockwisePrompt = `${basePrompt} Movement: Slowly moving counter-clockwise around the kitchen island.`;

        console.log(`[Gemini Video Service] Starting parallel video generation for stone: ${stoneName}...`);

        try {
            // Generate both videos in parallel using the Veo endpoint
            const [video1, video2] = await Promise.all([
                this.callVeoAPI(clockwisePrompt, editedImageUrl),
                this.callVeoAPI(counterClockwisePrompt, editedImageUrl)
            ]);

            console.log(`[Gemini Video Service] Videos generated, uploading to Cloudinary...`);

            // Upload the generated video files to Cloudinary
            const [v1Cloudinary, v2Cloudinary] = await Promise.all([
                uploadVideoFromUrl(video1),
                uploadVideoFromUrl(video2)
            ]);

            return {
                clockwiseVideoUrl: v1Cloudinary,
                counterClockwiseVideoUrl: v2Cloudinary
            };
        } catch (error: any) {
            console.error("[Gemini Video Service] Failed to generate videos:", error);
            throw new GeminiVideoServiceError('GENERATION_FAILED', error.message || "Video generation failed");
        }
    }

    private async callVeoAPI(prompt: string, inputImageUrl: string): Promise<string> {
        const { apiKey, projectId, location } = GeminiVideoService.credentials;

        if (!apiKey) throw new GeminiVideoServiceError('API_KEY_MISSING', 'Google API key is not configured');
        if (!projectId) throw new GeminiVideoServiceError('PROJECT_ID_MISSING', 'Google Project ID is not configured');

        // Vertex AI Endpoint for Veo
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/veo:predict`;

        const response = await GeminiVideoService.fetchWithRetry(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: prompt,
                        image: { imageUri: inputImageUrl }
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    durationSeconds: 11,
                    aspectRatio: "16:9"
                }
            })
        });

        const data = await response.json();

        // Google Veo returns a temporary signed URL or cloud storage URI
        if (data.predictions && data.predictions[0].videoUri) {
            return data.predictions[0].videoUri;
        }

        throw new Error(`Veo API Error: ${JSON.stringify(data)}`);
    }
}

export default GeminiVideoService;
