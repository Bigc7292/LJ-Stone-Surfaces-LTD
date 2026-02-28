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
// NOTE: the xAI API prefix changed in early 2026 – video endpoints live under
// `/v1/videos` rather than `/v1/video`. using the wrong path returns 404.


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

// generic shape for the v1/videos endpoints.  
// POST /videos/generations returns only { request_id }
// GET /videos/:id returns { status: "pending"|"done"|"failed", video?: {url,duration}, error?, model }
interface GrokVideoResponse {
    request_id?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'done';
    video_url?: string;
    video?: {
        url: string;
        duration: number;
    };
    error?: string;
    model?: string;
}

// ============================================================================
// GROK SERVICE
// ============================================================================

export class GrokService {

    /**
     * Edit a room image using Grok's image generation API for image-guided editing
     * Uses /v1/images/generations endpoint (not /edits). Includes stone texture reference for accurate material matching.
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

        // CRITICAL: Surgical/inpainting prompt - room structure MUST remain identical
        // This is IMAGE EDITING, not image generation. Only stone surfaces are replaced.
        const hasTexture = !!stoneTextureBase64;
        const prompt = hasTexture
            ? `INPAINT ONLY: You must edit this image, not generate a new one. Replace ONLY the countertop stone surfaces with the exact ${sName} material shown in the reference swatch. 
CRITICAL INSTRUCTIONS:
- Match the reference swatch exactly: same veining, color tones, reflectivity, ${sFinish.toLowerCase()} finish
- Keep every other pixel IDENTICAL to the original image - this is material replacement only
- Do NOT change: room walls, cabinets, appliances, island base, floor, ceiling, lighting, shadows, reflections, or any objects
- Do NOT regenerate the room, reposition furniture, or alter any spatial layout
- Only the stone surface texture changes on the existing countertop geometry
Photorealistic. Match original lighting and shadows exactly.`
            : `INPAINT ONLY: You must edit this image, not generate a new one. Replace ONLY the countertop stone surfaces with ${sName} (${sDescription}). 
CRITICAL INSTRUCTIONS:
- Replicate the specific veining patterns, color, and ${sFinish.toLowerCase()} finish of ${sName} exactly
- Keep every other pixel IDENTICAL to the original image - this is material replacement only
- Do NOT change: room walls, cabinets, appliances, island base, floor, ceiling, lighting, shadows, reflections, or any objects
- Do NOT regenerate the room, reposition furniture, or alter layout
- Only the stone surface texture changes on the existing countertop geometry  
Photorealistic. Match original image lighting and shadows perfectly.`;

        const model = 'grok-imagine-image';

        return fetchWithRetry(async () => {
            const roomDataUri = roomImageBase64.startsWith('data:')
                ? roomImageBase64
                : `data:image/jpeg;base64,${roomImageBase64}`;

            // Build payload with or without texture reference
            // xAI's /v1/images/generations supports multiple images via 'content' array
            const payload: any = {
                model: model,
                prompt: prompt,
                image: {
                    url: roomDataUri
                }
            };

            // If we have a stone texture swatch, add it as an additional image reference
            if (stoneTextureBase64) {
                const textureDataUri = stoneTextureBase64.startsWith('data:')
                    ? stoneTextureBase64
                    : `data:image/jpeg;base64,${stoneTextureBase64}`;
                // Some image APIs support 'images' array or 'texture' field; fallback to inline prompt if not
                payload.texture_reference = { url: textureDataUri };
                console.log('[Grok Service] Including stone texture reference for exact matching');
            }

            console.log(`[Grok Service] Sending stone visualization request to: ${XAI_BASE_URL}/images/generations`);

            const response = await fetch(`${XAI_BASE_URL}/images/generations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${XAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Grok Service] xAI API ERROR (GENERATIONS):', JSON.stringify(errorData));
                fileLog(`xAI API ERROR (GENERATIONS) (${response.status}): ${JSON.stringify(errorData)}`);
                throw new GrokServiceError('GENERATION_FAILED', errorData.error?.message || `GENERATION FAILED with status ${response.status}`);
            }

            const data: any = await response.json();
            // Images endpoint returns data array with url or b64_json
            if (data.data?.[0]?.b64_json) {
                return `data:image/png;base64,${data.data[0].b64_json}`;
            } else if (data.data?.[0]?.url) {
                return data.data[0].url;
            }

            throw new GrokServiceError('GENERATION_FAILED', 'No image data in response from generations endpoint');
        });
    }

    /**
     * Generate a walkthrough video from the transformed image
     * NOTE: xAI's /v1/videos/generations only accepts: model, prompt, image, duration
     * Do NOT send fps, motion_bucket_id, or resolution - causes 422 errors
     */
    static async generateWalkthroughVideo(params: GenerateVideoParams): Promise<{ requestId: string }> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        const { transformedImageBase64, duration = 10 } = params;

        console.log(`[Grok Service] Starting video generation (${duration}s)`);

        const videoModel = 'grok-imagine-video';
        const videoPrompt = AI_PROMPTS?.prompts?.walkAroundVideo?.template || `Generate a smooth walk-around video at human eye level of this room, slowly orbiting around the central island. Preserve all details.`;

        const dataUri = transformedImageBase64.startsWith('data:')
            ? transformedImageBase64
            : `data:image/jpeg;base64,${transformedImageBase64}`;

        // IMPORTANT: Only send supported fields. fps, motion_bucket_id, resolution are NOT supported and cause 422
        const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: videoModel,
                prompt: videoPrompt,
                image: { url: dataUri },
                duration: duration
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video generation request failed:', JSON.stringify(errorData));
            fileLog(`Video generation ERROR (${response.status}): ${JSON.stringify(errorData)}`);
            throw new GrokServiceError('GENERATION_FAILED', errorData.error?.message || `FAILED status ${response.status}`);
        }

        const data: { request_id: string } = await response.json();
        // the generation endpoint only returns a request_id, status checks come later
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

        const response = await fetch(`${XAI_BASE_URL}/videos/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video status check failed:', JSON.stringify(errorData));
            fileLog(`Video status ERROR (${response.status}): ${JSON.stringify(errorData)}`);
            throw new GrokServiceError('NETWORK', errorData.error?.message || `FAILED status ${response.status}`);
        }

        // the status endpoint returns { status: "pending"|"done"|"failed", video?: { url, duration }, error?, model }
        const data: any = await response.json();
        let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
        if (data.status === 'done') {
            status = 'completed';
        } else if (data.status === 'pending' || data.status === 'processing') {
            status = data.status;
        } else if (data.status === 'failed') {
            status = 'failed';
        }
        return {
            status,
            videoUrl: data.video?.url,
            error: data.error || (data.status === 'failed' ? 'generation failed' : undefined)
        };
    }
}

export default GrokService;
