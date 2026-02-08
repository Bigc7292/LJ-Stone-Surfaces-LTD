/**
 * Grok AI Service - xAI Integration
 * Handles image editing and video walkthrough creation
 * Based on official xAI API docs: https://docs.x.ai
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// ERROR HANDLING & CONFIGURATION
// ============================================================================
export class GrokServiceError extends Error {
    constructor(
        public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'GENERATION_FAILED' | 'NETWORK' | 'UNKNOWN',
        message: string
    ) {
        super(message);
        this.name = 'GrokServiceError';
    }
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load AI Prompts Configuration
const configPath = path.join(__dirname, '../data/aiPrompts.json');
let AI_PROMPTS: any = null;
try {
    AI_PROMPTS = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log("[Grok Service] Loaded AI prompts config");
} catch (e) {
    console.warn("[Grok Service] Could not load aiPrompts.json, using defaults");
}

// xAI API Configuration
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';

if (!XAI_API_KEY) {
    console.error("[Grok Service] FATAL: XAI_API_KEY is missing! Add it to your .env file.");
} else {
    console.log("[Grok Service] Initialized with xAI API key.");
}

// Resilient Fetcher with Retries
const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const isRetryable = error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("overloaded");
        if (retries > 0 && isRetryable) {
            console.log(`[Grok Service] Rate limited. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
};

// ============================================================================
// TYPES
// ============================================================================
interface GenerateImageParams {
    roomImageBase64: string;
    stoneTexturePath?: string;
    stoneName: string;
    stoneCategory: string;
    finishType: 'Polished' | 'Honed' | 'Leathered';
    ambience: string;
}

interface GenerateVideoParams {
    transformedImageBase64: string;
    duration?: number; // 6-15 seconds
    resolution?: '720p' | '1080p';
}

interface GrokImageResponse {
    data: Array<{
        url?: string;
        b64_json?: string;
    }>;
}

interface GrokVideoResponse {
    request_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    error?: string;
}

// ============================================================================
// GROK SERVICE
// ============================================================================
export class GrokService {

    /**
     * Edit a room image using Grok's image editing API
     * Uses /v1/images/edits endpoint for image-to-image transformation
     * Automatically detects and replaces stone surfaces
     */
    static async generateStoneVisualization({
        roomImageBase64,
        stoneTexturePath,
        stoneName,
        stoneCategory,
        finishType,
        ambience
    }: GenerateImageParams): Promise<string> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        console.log(`[Grok Service] Editing image with: ${stoneName} (${stoneCategory})`);

        // Build consistency-focused prompt per xAI best practices
        const finishDescription = finishType === 'Polished'
            ? 'polished mirror-like reflective surface'
            : finishType === 'Honed'
                ? 'smooth matte honed surface'
                : 'textured leathered natural surface';

        // Prompt optimized for consistent, photorealistic results
        const prompt = `Edit this kitchen/room image: Replace all countertop surfaces and the backsplash with ${stoneName} ${stoneCategory} featuring a ${finishDescription}. Use a seamless, continuous slab style for the backsplash (no visible tile grout lines). Keep everything else exactly the same—cabinets, appliances, sink, window, walls, floor, lighting, and perspective. Photorealistic, high detail, matching original lighting and perspective. ${ambience} lighting tone.`;

        return fetchWithRetry(async () => {
            // Extract base64 data
            let imageBase64 = roomImageBase64;
            if (imageBase64.startsWith('data:')) {
                imageBase64 = imageBase64.split(',')[1];
            }

            // Use /v1/images/edits for proper image editing
            const requestBody = {
                model: 'grok-2-image-1212',
                prompt: prompt,
                image: imageBase64,
                n: 1,
                response_format: 'b64_json',
                // Consistency parameters
                strength: 0.6 // Medium strength to retain base structure
            };

            const response = await fetch(`${XAI_BASE_URL}/images/edits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${XAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Grok Service] Image edit failed:', errorData);

                if (response.status === 429) {
                    throw new GrokServiceError('RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
                }

                const errorMsg = errorData.error?.message || JSON.stringify(errorData) || `Image edit failed with status ${response.status}`;

                throw new GrokServiceError(
                    'GENERATION_FAILED',
                    errorMsg
                );
            }

            const data: GrokImageResponse = await response.json();

            if (!data.data || data.data.length === 0) {
                throw new GrokServiceError('GENERATION_FAILED', 'No image returned from Grok API');
            }

            const imageData = data.data[0];

            if (imageData.b64_json) {
                console.log('[Grok Service] Image edit successful (base64)');
                return `data:image/png;base64,${imageData.b64_json}`;
            } else if (imageData.url) {
                console.log('[Grok Service] Image edit successful (URL)');
                // Fetch and convert URL to base64 for consistency
                const imgResponse = await fetch(imageData.url);
                const imgBuffer = await imgResponse.arrayBuffer();
                const base64 = Buffer.from(imgBuffer).toString('base64');
                return `data:image/png;base64,${base64}`;
            }

            throw new GrokServiceError('GENERATION_FAILED', 'Invalid response format from Grok API');
        });
    }

    /**
     * Generate a walkthrough video from the transformed image
     * Uses /v1/videos/generations endpoint
     * Creates a human eye-level perspective animation
     */
    static async generateWalkthroughVideo({
        transformedImageBase64,
        duration = 10,
        resolution = '720p'
    }: GenerateVideoParams): Promise<{ requestId: string }> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        console.log(`[Grok Service] Starting video generation (${duration}s, ${resolution})`);

        // Optimized video prompt for walk-around at human eye level
        const videoPrompt = `Generate a smooth walk-around video at human eye level (about 5.5 feet) of this room, slowly orbiting around the central island to show the stone countertops and backsplash from all angles. Maintain photorealistic details, preserve all original room elements including cabinets, appliances, window, and lighting. Natural lighting, no distortions. Smooth camera motion, no text or HUD.`;

        // Extract base64 data
        let imageBase64 = transformedImageBase64;
        if (imageBase64.startsWith('data:')) {
            imageBase64 = imageBase64.split(',')[1];
        }

        // Use /v1/videos/generations endpoint per xAI docs
        const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-imagine-video',
                prompt: videoPrompt,
                image: imageBase64,
                duration: duration,
                resolution: resolution
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video generation request failed:', errorData);

            throw new GrokServiceError(
                'GENERATION_FAILED',
                errorData.error?.message || `Video generation failed with status ${response.status}`
            );
        }

        const data: GrokVideoResponse = await response.json();
        console.log(`[Grok Service] Video job started: ${data.request_id}`);

        return { requestId: data.request_id };
    }

    /**
     * Check the status of a video generation job
     * Uses /v1/videos/{request_id} endpoint
     */
    static async checkVideoStatus(requestId: string): Promise<{
        status: 'pending' | 'processing' | 'completed' | 'failed';
        videoUrl?: string;
        error?: string;
    }> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        // Use /v1/videos/{request_id} for status polling
        const response = await fetch(`${XAI_BASE_URL}/videos/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video status check failed:', errorData);

            throw new GrokServiceError(
                'NETWORK',
                errorData.error?.message || `Status check failed with status ${response.status}`
            );
        }

        const data: GrokVideoResponse = await response.json();

        return {
            status: data.status,
            videoUrl: data.video_url,
            error: data.error
        };
    }
}

export default GrokService;
