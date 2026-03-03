/**
 * Gemini AI Service - Google Vertex AI Integration
 * Handles surgical image editing using Imagen 3.0
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export class GeminiServiceError extends Error {
    constructor(
        public code: 'API_KEY_MISSING' | 'PROJECT_ID_MISSING' | 'GENERATION_FAILED' | 'NETWORK' | 'TIMEOUT' | 'UNKNOWN',
        message: string
    ) {
        super(message);
        this.name = 'GeminiServiceError';
    }
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GeminiService {
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
        try {
            const response = await fetch(url, options);
            if (!response.ok && (response.status === 429 || response.status >= 500) && retries > 1) {
                console.log(`[Gemini Service] Request failed (${response.status}), retrying in ${delay}ms... (${retries - 1} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 1.5);
            }
            return response;
        } catch (err) {
            if (retries > 1) {
                console.log(`[Gemini Service] Network error, retrying in ${delay}ms... (${retries - 1} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 1.5);
            }
            throw err;
        }
    }

    /**
     * Surgical countertop edit using Imagen 3.0
     * Replaces only the stone surfaces while keeping everything else 100% identical.
     */
    static async generateStoneVisualization(userPrompt: string, inputImageBase64: string): Promise<string> {
        const { apiKey } = GeminiService.credentials;

        if (!apiKey) throw new GeminiServiceError('API_KEY_MISSING', 'Google API key is not configured');

        const stoneDesc = userPrompt || "black marble with dramatic gold veins like lightning cracks";

        // Surgical prompt from confirmed Opal workflow
        const prompt = `You are an expert image editor and visualiser. Generate a single, highly realistic, photograph-quality image based on the following descriptions.
Using the provided input photo as the base image, surgically replace all existing countertops and any other visible stone surfaces in the image with the material described as: ${stoneDesc}.

The output image must be a perfectly photorealistic representation, matching the lighting, shadows, reflections, perspective, and overall aesthetic of the original photograph as if it were taken at the same moment.

CRITICAL: Every other element of the original photo MUST remain 100% identical and unchanged. This includes, but is not limited to: all cabinets, appliances, windows, flooring, lighting conditions, shadows, reflections, perspective, and any objects present on countertops, floors, or elsewhere in the room (such as boxes, tape, or tools). Absolutely no elements may be added, removed, moved, or redesigned.

The appearance of the new stone countertops must perfectly match the detailed catalogue description provided, without any creative interpretation, random variation, or substitution. Focus on replicating the material type, base color, exact vein color and pattern, finish (polished, honed, leathered, etc.), and any other visual characteristics with absolute precision.`;

        const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

        // Strip data URI prefix if present
        const base64Image = inputImageBase64.replace(/^data:image\/\w+;base64,/, "");

        console.log(`[Gemini Service] Sending surgical edit request to Gemini 3.1 Flash Image...`);

        const response = await this.fetchWithRetry(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } },
                            { text: prompt }
                        ]
                    }
                ],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ],
                generationConfig: {
                    temperature: 0, // Set to 0 for maximum consistency
                    topP: 0.8,      // Tighten sampling
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Gemini Service] API ERROR:', JSON.stringify(errorData));
            throw new GeminiServiceError('GENERATION_FAILED', errorData.error?.message || `GENERATION FAILED with status ${response.status}`);
        }

        const data: any = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate || !candidate.content || !candidate.content.parts) {
            throw new GeminiServiceError('GENERATION_FAILED', "Gemini failed to return content. Check API credits and safety filters.");
        }

        // Find the image part in the response
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        throw new GeminiServiceError('GENERATION_FAILED', "No image data found in Gemini response candidate.");
    }
}

export default GeminiService;
