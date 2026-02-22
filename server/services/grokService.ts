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
        public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'GENERATION_FAILED' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN',
        message: string
    ) {
        super(message);
        this.name = 'GrokServiceError';
    }
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple persistent logger for background processes
const fileLog = (msg: string) => {
    const logPath = path.join(process.cwd(), "server-debug.log");
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${timestamp}] [GrokService] ${msg}\n`);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
};

// Load AI Prompts Configuration
const configPath = path.join(__dirname, '../data/aiPrompts.json');
let AI_PROMPTS: any = null;
try {
    AI_PROMPTS = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log("[Grok Service] AI Prompts configuration loaded.");
} catch (err) {
    console.error("[Grok Service] Error loading AI prompts mapping:", err);
}

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';

if (!XAI_API_KEY) {
    console.error("[Grok Service] FATAL: XAI_API_KEY is missing! Add it to your .env file.");
} else {
    console.log("[Grok Service] Initialized with xAI API key.");
}

/**
 * Resilient Fetcher with Retries
 */
async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        if (retries > 1) {
            console.log(`[Grok Service] Request failed, retrying in ${delay}ms... (${retries - 1} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(fn, retries - 1, delay * 1.5);
        }
        throw err;
    }
}

// ============================================================================
// TYPES
// ============================================================================

export interface GenerateImageParams {
    roomImageBase64: string;
    stoneTexturePath?: string;
    stoneTextureBase64?: string;
    stoneName: string;
    stoneCategory: string;
    stoneDescription?: string;
    finishType: 'Polished' | 'Honed' | 'Leathered';
    ambience: string;
}

export interface GenerateVideoParams {
    transformedImageBase64: string;
    duration?: number;
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
     * Edit a room image using Grok's image generation API for image-guided editing
     * Uses /v1/images/generations endpoint with the 'images' payload
     */
    static async generateStoneVisualization({
        roomImageBase64,
        stoneTextureBase64,
        stoneName,
        stoneCategory,
        stoneDescription,
        finishType,
        ambience
    }: GenerateImageParams): Promise<string> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        const sanitize = (str: string) => str.replace(/[{}]/g, '').trim();
        const sName = sanitize(stoneName);
        const sFinish = sanitize(finishType);
        const sCategory = sanitize(stoneCategory);
        const sDescription = stoneDescription ? sanitize(stoneDescription) : `${sCategory} with ${sFinish.toLowerCase()}`;

        // Strictly surgical prompt. PRIORITIZE material fidelity and texture matching.
        const prompt = `Surgical edit: ONLY replace the countertops and visible stone surfaces with ${sName} (${sDescription}). 
STRICT MATERIAL FIDELITY: The new stone surface must perfectly match the visual characteristics of ${sName}. 
Replicate the specific veining patterns, base color tint, and ${sFinish.toLowerCase()} finish exactly. 
Keep EVERYTHING ELSE EXACTLY IDENTICAL: Room layout, cabinets, appliances, lighting, shadows, reflections, and even floor objects (boxes/tape) MUST remain unchanged. 
Photorealistic 8k, match original image structure 100%.`;

        const model = 'grok-imagine-image';

        return fetchWithRetry(async () => {
            const dataUri = roomImageBase64.startsWith('data:')
                ? roomImageBase64
                : `data:image/jpeg;base64,${roomImageBase64}`;

            // Payload structure for /v1/images/edits
            // xAI requires a nested 'image' object with a 'url' property for the input image.
            const payload: any = {
                model: model,
                prompt: prompt,
                image: {
                    url: dataUri
                },
                response_format: "b64_json"
            };

            console.log(`[Grok Service] Sending surgical edit request to: ${XAI_BASE_URL}/images/edits`);

            const response = await fetch(`${XAI_BASE_URL}/images/edits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${XAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Grok Service] xAI API ERROR (EDITS):', JSON.stringify(errorData));
                fileLog(`xAI API ERROR (EDITS) (${response.status}): ${JSON.stringify(errorData)}`);
                throw new GrokServiceError('GENERATION_FAILED', errorData.error?.message || `EDITS FAILED with status ${response.status}`);
            }

            const data: any = await response.json();
            // Edits endpoint typically returns the same structure as generations
            if (data.data?.[0]?.b64_json) {
                return `data:image/png;base64,${data.data[0].b64_json}`;
            } else if (data.data?.[0]?.url) {
                return data.data[0].url;
            }

            throw new GrokServiceError('GENERATION_FAILED', 'No image data in response from edits endpoint');
        });
    }

    /**
     * Generate a walkthrough video from the transformed image
     */
    static async generateWalkthroughVideo(params: GenerateVideoParams): Promise<{ requestId: string }> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        const { transformedImageBase64, duration = 10, resolution = '720p' } = params;

        console.log(`[Grok Service] Starting video generation (${duration}s, ${resolution})`);

        const videoModel = 'grok-imagine-video';
        const motionBucketId = AI_PROMPTS?.grokConfig?.videoConfig?.motionBucketId || 127;
        const videoPrompt = AI_PROMPTS?.prompts?.walkAroundVideo?.template || `Generate a smooth walk-around video at human eye level of this room, slowly orbiting around the central island. Preserve all details.`;

        const dataUri = transformedImageBase64.startsWith('data:')
            ? transformedImageBase64
            : `data:image/jpeg;base64,${transformedImageBase64}`;

        const response = await fetch(`${XAI_BASE_URL}/video/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: videoModel,
                prompt: videoPrompt,
                image: { url: dataUri },
                duration: duration,
                fps: 24,
                motion_bucket_id: motionBucketId,
                resolution: resolution === '1080p' ? '1920x1080' : '1280x720'
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video generation request failed:', JSON.stringify(errorData));
            fileLog(`Video generation ERROR (${response.status}): ${JSON.stringify(errorData)}`);
            throw new GrokServiceError('GENERATION_FAILED', errorData.error?.message || `FAILED status ${response.status}`);
        }

        const data: GrokVideoResponse = await response.json();
        return { requestId: data.request_id };
    }

    /**
     * Check the status of a video generation job
     */
    static async checkVideoStatus(requestId: string): Promise<{
        status: 'pending' | 'processing' | 'completed' | 'failed';
        videoUrl?: string;
        error?: string;
    }> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        const response = await fetch(`${XAI_BASE_URL}/video/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video status check failed:', JSON.stringify(errorData));
            fileLog(`Video status ERROR (${response.status}): ${JSON.stringify(errorData)}`);
            throw new GrokServiceError('NETWORK', errorData.error?.message || `FAILED status ${response.status}`);
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
