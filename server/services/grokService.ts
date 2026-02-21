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
    url?: string;
    b64_json?: string;
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
        stoneTextureBase64,
        stoneName,
        stoneCategory,
        finishType,
        ambience
    }: GenerateImageParams): Promise<string> {
        if (!XAI_API_KEY) {
            throw new GrokServiceError('API_KEY_MISSING', 'xAI API key is not configured');
        }

        const finishDescription = finishType.toLowerCase();
        const hasTextureRef = !!stoneTextureBase64;

        const textureRefInstruction = hasTextureRef
            ? 'The SECOND attached image is the exact stone sample you MUST reproduce. Clone its exact color palette, veining pattern, grain direction, and surface texture onto all replaced surfaces. Do NOT invent or guess the stone appearance — match the reference image precisely.'
            : '';

        let prompt: string;
        if (AI_PROMPTS?.prompts?.combinedReplacement) {
            const template = AI_PROMPTS.prompts.combinedReplacement.template;
            prompt = template
                .replace('{stoneName}', stoneName)
                .replace('{stoneDescription}', `${stoneCategory} with ${finishDescription}`)
                .replace('{textureReference}', textureRefInstruction);
            console.log('[Grok Service] Using prompt from config');
        } else {
            prompt = `SURGICAL EDIT: Replace ONLY all countertops and the backsplash with ${stoneName} ${stoneCategory}. ${textureRefInstruction} Ensure a photorealistic ${finishDescription} finish. Every other pixel in the room (cabinets, island, appliances, floor, walls, lighting) MUST remain identical to the original image. DO NOT REIMAGINE THE ROOM.`;
        }

        const model = AI_PROMPTS?.grokConfig?.imageModel || 'grok-imagine-image';
        const strength = AI_PROMPTS?.grokConfig?.consistency?.imageToImageStrength || 0.25;

        return fetchWithRetry(async () => {
            const dataUri = roomImageBase64.startsWith('data:')
                ? roomImageBase64
                : `data:image/jpeg;base64,${roomImageBase64}`;

            const requestBody: Record<string, any> = {
                model: model,
                prompt: prompt,
                n: 1,
                response_format: 'b64_json',
                strength: strength
            };

            // Multiplex image fields to be extremely robust for xAI REST API
            if (stoneTextureBase64) {
                const textureUri = stoneTextureBase64.startsWith('data:')
                    ? stoneTextureBase64
                    : `data:image/jpeg;base64,${stoneTextureBase64}`;

                console.log('[Grok Service] Using multi-image surgical format');
                fileLog(`Sending multi-image surgical request (strength: ${strength}). Prompt chars: ${prompt.length}`);

                // Standard modern vision API format: array of objects in 'image' field
                requestBody.image = [
                    { url: dataUri },
                    { url: textureUri }
                ];
            } else {
                console.log('[Grok Service] Using single-image surgical format');
                requestBody.image = { url: dataUri };
            }

            console.log(`[Grok Service] Sending request to xAI: ${XAI_BASE_URL}/images/edits`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            try {
                const response = await fetch(`${XAI_BASE_URL}/images/edits`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${XAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(`[Grok Service] xAI responded with status: ${response.status}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData: any;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: errorText };
                    }

                    console.error('[Grok Service] xAI API ERROR DETAILS:', JSON.stringify(errorData, null, 2));
                    fileLog(`xAI API ERROR (${response.status}): ${JSON.stringify(errorData)}`);

                    // CRITICAL FALLBACK: If multi-image failed, try text-only (using just the room image)
                    if (stoneTextureBase64 && response.status !== 401 && response.status !== 429) {
                        console.log('[Grok Service] Multi-image failed. Falling back to single-image mode...');
                        fileLog('Falling back to single-image mode after xAI error');
                        const fallbackBody = {
                            ...requestBody,
                            image: { url: dataUri }
                        };
                        delete (fallbackBody as any).image_urls;

                        const fallbackResponse = await fetch(`${XAI_BASE_URL}/images/edits`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${XAI_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(fallbackBody)
                        });

                        if (fallbackResponse.ok) {
                            const fallbackData = await fallbackResponse.json();
                            return `data:image/png;base64,${fallbackData.data[0].b64_json}`;
                        }
                    }

                    if (response.status === 429) {
                        throw new GrokServiceError('RATE_LIMIT', 'Rate limit exceeded. Please try again later.');
                    }

                    const errorMsg = errorData.error?.message || errorData.error || JSON.stringify(errorData) || `Image edit failed with status ${response.status}`;
                    throw new GrokServiceError('GENERATION_FAILED', errorMsg);
                }

                const data: GrokImageResponse = await response.json();
                if (!data.data || data.data.length === 0) {
                    throw new GrokServiceError('GENERATION_FAILED', 'No image returned from Grok API');
                }

                const imageData = data.data[0];
                if (imageData.b64_json) {
                    return `data:image/png;base64,${imageData.b64_json}`;
                } else if (imageData.url) {
                    const imgResponse = await fetch(imageData.url);
                    const imgBuffer = await imgResponse.arrayBuffer();
                    const base64 = Buffer.from(imgBuffer).toString('base64');
                    return `data:image/png;base64,${base64}`;
                }

                throw new GrokServiceError('GENERATION_FAILED', 'Invalid response format from Grok API');

            } catch (err: any) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    throw new GrokServiceError('TIMEOUT', 'Grok API request timed out');
                }
                throw err;
            }
        });
    }

    /**
     * Generate a walkthrough video from the transformed image
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

        const videoPrompt = `Generate a smooth walk-around video at human eye level of this room, slowly orbiting around the central island to show the stone countertops and backsplash from all angles. Maintain photorealistic details, preserve all original room elements. Smooth camera motion, no text.`;

        const dataUri = transformedImageBase64.startsWith('data:')
            ? transformedImageBase64
            : `data:image/jpeg;base64,${transformedImageBase64}`;

        const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-imagine-video',
                prompt: videoPrompt,
                image: { url: dataUri },
                duration: duration,
                resolution: resolution
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video generation request failed:', errorData);
            throw new GrokServiceError('GENERATION_FAILED', errorData.error?.message || `Video generation failed with status ${response.status}`);
        }

        const data: GrokVideoResponse = await response.json();
        console.log(`[Grok Service] Video job started: ${data.request_id}`);
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
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Grok Service] Video status check failed:', errorData);
            throw new GrokServiceError('NETWORK', errorData.error?.message || `Status check failed with status ${response.status}`);
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
