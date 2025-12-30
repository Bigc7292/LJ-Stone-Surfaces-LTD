import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import FormData from "form-data";
// Local log function for serverless compatibility
function log(message: string, source = "ai-service") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

// __dirname and __filename are not safe in bundled environments
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Marker interface for user-selected surfaces
export interface Marker {
    id: number;
    x: number; // 0-1 relative position
    y: number; // 0-1 relative position
}

export interface InpaintingParams {
    imagePath: string; // base64 or URL
    maskPath?: string;
    prompt: string;
    stoneType: string;
    markers?: Marker[]; // User-defined surface markers
}

// Replicate API configuration
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export class AIService {
    private static currentKeyIndex = 0;

    private static getNextKey(): string | null {
        const keys = [
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY_2,
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY_3
        ].filter(Boolean);

        if (keys.length === 0) return null;
        return keys[this.currentKeyIndex % keys.length] as string;
    }

    private static rotateKey() {
        const keysCount = [
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY_2,
            process.env.AI_INTEGRATIONS_GEMINI_API_KEY_3
        ].filter(Boolean).length;

        if (keysCount > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % keysCount;
            log(`Rotated to Gemini API Key #${this.currentKeyIndex + 1}`, "ai-service");
        }
    }

    /**
     * Upload image to a temporary hosting service and get public URL
     * Replicate needs a publicly accessible URL for the image
     */
    private static async uploadToCloudinary(imageBase64: string): Promise<string> {
        log("Uploading image to Cloudinary for Replicate access...", "ai-service");

        try {
            const result = await cloudinary.uploader.upload(imageBase64, {
                folder: "lj-stone-inpainting",
                resource_type: "image",
            });
            log(`Uploaded to Cloudinary: ${result.secure_url}`, "ai-service");
            return result.secure_url;
        } catch (error: any) {
            log(`Cloudinary upload failed: ${error.message}`, "ai-service");
            throw error;
        }
    }

    /**
     * Step 1: Use SAM (Segment Anything Model) to generate a mask from marker points
     * This turns user clicks into a precise surface mask
     */
    private static async generateMaskWithSAM(
        imageUrl: string,
        markers: Marker[],
        imageWidth: number,
        imageHeight: number
    ): Promise<string> {
        if (!REPLICATE_API_TOKEN) {
            throw new Error("Replicate API token not configured");
        }

        log(`Calling SAM to generate mask from ${markers.length} points...`, "ai-service");
        console.log("=== SAM SEGMENTATION ===");

        // Convert relative markers to absolute pixel coordinates
        const pointCoords = markers.map(m => [
            Math.floor(m.x * imageWidth),
            Math.floor(m.y * imageHeight)
        ]);
        console.log("Point coordinates:", pointCoords);

        // Point labels: 1 = foreground (the surface we want to select)
        const pointLabels = markers.map(() => 1);

        try {
            // Create prediction using SAM model
            const createResponse = await axios.post(
                REPLICATE_API_URL,
                {
                    // SAM model version (segment-anything)
                    version: "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83",
                    input: {
                        image: imageUrl,
                        // SAM-2 expects points as a string in format "x1,y1;x2,y2"
                        point_coords: pointCoords.map(p => `${p[0]},${p[1]}`).join(";"),
                        // Labels as comma-separated: 1=foreground, 0=background
                        point_labels: pointLabels.join(","),
                        use_m2m: true, // Multi-mask mode
                        output_format: "png",
                    }
                },
                {
                    headers: {
                        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            const predictionId = createResponse.data.id;
            log(`SAM prediction created: ${predictionId}`, "ai-service");

            // Poll for result
            let prediction = createResponse.data;
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const pollResponse = await axios.get(
                    `${REPLICATE_API_URL}/${predictionId}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
                        }
                    }
                );
                prediction = pollResponse.data;
                console.log(`SAM status: ${prediction.status}`);
            }

            if (prediction.status === "failed") {
                throw new Error(`SAM failed: ${prediction.error}`);
            }

            // SAM returns the mask image URL
            const maskUrl = prediction.output;
            log(`SAM mask generated: ${maskUrl}`, "ai-service");
            return maskUrl;
        } catch (error: any) {
            log(`SAM error: ${error.message}`, "ai-service");
            console.error("SAM full error:", error.response?.data || error);
            throw error;
        }
    }

    /**
     * Step 2: Use SDXL Inpainting to replace the masked area with stone texture
     */
    private static async inpaintWithSDXL(
        imageUrl: string,
        maskUrl: string,
        stoneType: string
    ): Promise<string> {
        if (!REPLICATE_API_TOKEN) {
            throw new Error("Replicate API token not configured");
        }

        log(`Calling SDXL Inpainting for ${stoneType}...`, "ai-service");
        console.log("=== SDXL INPAINTING ===");

        // Create detailed prompt for stone texture
        const stoneDescriptions: Record<string, string> = {
            "Calacatta Marble": "luxurious Calacatta marble countertop with bold golden veining on creamy white background, polished smooth surface",
            "Taj Mahal Quartzite": "elegant Taj Mahal quartzite countertop with warm honey gold tones and subtle beige veining, polished surface",
            "Blue Roma Quartzite": "stunning Blue Roma quartzite countertop with deep ocean blue swirls and grey undertones, polished finish",
            "Belvedere Granite": "sophisticated Belvedere granite countertop with dark charcoal base and silver crystalline flecks, polished",
            "Classic White": "pristine white Thassos marble countertop with clean minimal grey veining, highly polished surface",
            "Smoke Gray": "dramatic Pietra Grey marble countertop with bold white lightning veins on dark grey, polished finish",
            "Midnight Black": "luxurious Nero Marquina black marble countertop with crisp white veining patterns, polished surface",
            "Honey Gold": "warm Honey Onyx countertop with translucent amber glow and caramel swirl patterns, polished",
            "Ocean Blue": "exotic Azul Bahia granite countertop with vibrant blue crystals and golden flecks, polished surface",
        };

        const stoneDesc = stoneDescriptions[stoneType] ||
            `premium ${stoneType} natural stone countertop with elegant veining, polished smooth surface`;

        const prompt = `${stoneDesc}, photorealistic, 8k resolution, interior design photography, natural lighting`;
        const negativePrompt = "blurry, distorted, low quality, cartoon, painting, abstract, text, watermark";

        console.log("Prompt:", prompt.substring(0, 100) + "...");

        try {
            // Create prediction using SDXL Inpainting model
            const createResponse = await axios.post(
                REPLICATE_API_URL,
                {
                    // SDXL Inpainting model
                    version: "c11bac58203367db93a3c552bd49a25a5418458ddffb7e90dae55780765e26d6",
                    input: {
                        image: imageUrl,
                        mask: maskUrl,
                        prompt: prompt,
                        negative_prompt: negativePrompt,
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        strength: 0.99, // High strength to fully replace the area
                    }
                },
                {
                    headers: {
                        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    }
                }
            );

            const predictionId = createResponse.data.id;
            log(`SDXL Inpainting prediction created: ${predictionId}`, "ai-service");

            // Poll for result
            let prediction = createResponse.data;
            while (prediction.status !== "succeeded" && prediction.status !== "failed") {
                await new Promise(resolve => setTimeout(resolve, 3000));

                const pollResponse = await axios.get(
                    `${REPLICATE_API_URL}/${predictionId}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
                        }
                    }
                );
                prediction = pollResponse.data;
                console.log(`SDXL status: ${prediction.status}`);
            }

            if (prediction.status === "failed") {
                throw new Error(`SDXL Inpainting failed: ${prediction.error}`);
            }

            // SDXL returns the result image URL(s)
            const resultUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
            log(`SDXL Inpainting complete: ${resultUrl}`, "ai-service");

            // Download and convert to base64
            const response = await axios.get(resultUrl, { responseType: "arraybuffer" });
            const base64 = Buffer.from(response.data).toString("base64");

            return `data:image/png;base64,${base64}`;
        } catch (error: any) {
            log(`SDXL Inpainting error: ${error.message}`, "ai-service");
            console.error("SDXL full error:", error.response?.data || error);
            throw error;
        }
    }

    /**
     * MAIN METHOD: Professional AI-powered surface replacement
     * Uses SAM for segmentation + SDXL for inpainting
     */
    private static async performReplicateInpainting(
        imageBase64: string,
        markers: Marker[],
        stoneType: string
    ): Promise<string> {
        log(`Starting Replicate SAM+SDXL pipeline for ${stoneType}...`, "ai-service");
        console.log("=== REPLICATE INPAINTING PIPELINE ===");

        // Get image dimensions
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        const metadata = await sharp(imageBuffer).metadata();
        const width = metadata.width || 1024;
        const height = metadata.height || 1024;
        console.log(`Image dimensions: ${width}x${height}`);

        // Step 1: Upload image to Cloudinary for public URL
        const imageUrl = await this.uploadToCloudinary(imageBase64);

        // Step 2: Generate mask using SAM
        const maskUrl = await this.generateMaskWithSAM(imageUrl, markers, width, height);

        // Step 3: Inpaint using SDXL
        const result = await this.inpaintWithSDXL(imageUrl, maskUrl, stoneType);

        log("Replicate pipeline complete!", "ai-service");
        return result;
    }

    /**
     * Fallback: Simple ellipse-based texture compositing (local processing)
     */
    private static async performLocalComposite(
        imageBase64: string,
        markers: Marker[],
        stoneType: string
    ): Promise<string> {
        log(`Falling back to local texture compositing...`, "ai-service");

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const originalBuffer = Buffer.from(base64Data, "base64");
        const metadata = await sharp(originalBuffer).metadata();
        const width = metadata.width || 1024;
        const height = metadata.height || 1024;

        // Generate texture
        const textureBuffer = await this.generateStoneTexture(stoneType, width, height);

        // Generate simple ellipse mask
        const radius = Math.floor(Math.min(width, height) * 0.25);
        const maskData = Buffer.alloc(width * height * 4);

        for (let i = 0; i < width * height; i++) {
            maskData[i * 4 + 3] = 255;
        }

        for (const marker of markers) {
            const cx = Math.floor(marker.x * width);
            const cy = Math.floor(marker.y * height);

            for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y++) {
                for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x++) {
                    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    if (dist < radius) {
                        const alpha = dist > radius * 0.7
                            ? Math.floor(255 * (1 - (dist - radius * 0.7) / (radius * 0.3)))
                            : 255;
                        const idx = (y * width + x) * 4;
                        maskData[idx] = Math.max(maskData[idx], alpha);
                        maskData[idx + 1] = Math.max(maskData[idx + 1], alpha);
                        maskData[idx + 2] = Math.max(maskData[idx + 2], alpha);
                    }
                }
            }
        }

        const maskBuffer = await sharp(maskData, { raw: { width, height, channels: 4 } }).png().toBuffer();
        const maskRaw = await sharp(maskBuffer).grayscale().raw().toBuffer();
        const textureRaw = await sharp(textureBuffer).ensureAlpha().raw().toBuffer();

        const textureWithAlpha = Buffer.alloc(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            textureWithAlpha[i * 4] = textureRaw[i * 4];
            textureWithAlpha[i * 4 + 1] = textureRaw[i * 4 + 1];
            textureWithAlpha[i * 4 + 2] = textureRaw[i * 4 + 2];
            textureWithAlpha[i * 4 + 3] = maskRaw[i];
        }

        const maskedTexture = await sharp(textureWithAlpha, { raw: { width, height, channels: 4 } }).png().toBuffer();
        const result = await sharp(originalBuffer).ensureAlpha().composite([{ input: maskedTexture, blend: "over" }]).png().toBuffer();

        return `data:image/png;base64,${result.toString("base64")}`;
    }

    /**
     * Generate stone texture using Pollinations.ai
     */
    private static async generateStoneTexture(stoneType: string, width: number, height: number): Promise<Buffer> {
        const prompt = encodeURIComponent(`${stoneType} natural stone texture seamless pattern, polished surface, high resolution, top view`);
        const url = `https://image.pollinations.ai/prompt/${prompt}?model=flux&width=${width}&height=${height}&nologo=true`;

        const response = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 });
        return await sharp(response.data).resize(width, height, { fit: "cover" }).png().toBuffer();
    }

    /**
     * Generate image using Pollinations.ai
     */
    static async generateImage(prompt: string): Promise<string> {
        try {
            log(`Generating image via Pollinations.ai...`, "ai-service");
            const encodedPrompt = encodeURIComponent(prompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true`;

            const response = await axios.get(url, { responseType: "arraybuffer" });
            const base64 = Buffer.from(response.data as ArrayBuffer).toString("base64");
            return `data:image/jpeg;base64,${base64}`;
        } catch (error: any) {
            log(`Pollinations.ai Error: ${error.message}`, "ai-service");
            return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
        }
    }

    /**
     * Main inpainting method - uses Replicate SAM+SDXL if available, falls back to local
     */
    static async performInpainting(params: InpaintingParams): Promise<string> {
        const { imagePath, stoneType, markers } = params;

        if (markers && markers.length > 0) {
            // Try Replicate SAM+SDXL pipeline first
            if (REPLICATE_API_TOKEN) {
                try {
                    log(`Using Replicate SAM+SDXL pipeline`, "ai-service");
                    return await this.performReplicateInpainting(imagePath, markers, stoneType);
                } catch (error: any) {
                    log(`Replicate failed: ${error.message}, falling back...`, "ai-service");
                    console.error("=== REPLICATE ERROR ===");
                    console.error("Error:", error.message);
                    console.error("Response:", error.response?.data);
                    console.error("Full error:", error);
                }
            } else {
                console.log("REPLICATE_API_TOKEN not found in environment");
            }

            // Fallback to local compositing
            try {
                log(`Using local texture compositing`, "ai-service");
                return await this.performLocalComposite(imagePath, markers, stoneType);
            } catch (error: any) {
                log(`Local composite failed: ${error.message}`, "ai-service");
                console.error("=== LOCAL COMPOSITE ERROR ===");
                console.error("Error:", error.message);
                console.error("Stack:", error.stack);
            }
        }

        // Ultimate fallback: generate new image
        log(`Generating new image with Pollinations`, "ai-service");
        const prompt = `A ultra-realistic kitchen with stunning ${stoneType} countertops, professional photography, 8k`;
        return this.generateImage(prompt);
    }

    /**
     * Chat with AI assistant
     */
    static async chat(message: string, history: any[] = []): Promise<string> {
        // Robustly look for knowledge base in common locations (dev, prod, bundled)
        const possiblePaths = [
            path.join(process.cwd(), "server", "services", "knowledge_base.md"), // Local dev
            path.join(process.cwd(), "knowledge_base.md"), // Root deployment
            // Fallback for some bundle structures
            path.resolve("server/services/knowledge_base.md")
        ];

        let knowledgeBase = "LJ Stone Surfaces - Premium stone countertops and surfaces.";

        for (const p of possiblePaths) {
            try {
                const content = await fs.readFile(p, "utf-8");
                if (content) {
                    knowledgeBase = content;
                    break;
                }
            } catch (e) {
                // Continue searching
            }
        }

        const kbText = knowledgeBase.length > 4000 ? knowledgeBase.substring(0, 4000) : knowledgeBase;
        const systemPrompt = `You are the LJ Stone Surfaces AI Assistant.\n\nKnowledge Base:\n${kbText}`;
        const conversation = history.map(h => `${h.role === "user" ? "Client" : "Assistant"}: ${h.content}`).join("\n");
        const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversation}\n\nClient: ${message}\n\nAssistant:`;

        try {
            const encodedPrompt = encodeURIComponent(fullPrompt.substring(0, 3000));
            const url = `https://text.pollinations.ai/${encodedPrompt}?model=deepseek`;
            const response = await axios.get(url, { timeout: 20000 });
            return response.data;
        } catch (error) {
            return "Thank you for your interest in LJ Stone Surfaces! Please contact us at 0800-STONE.";
        }
    }

    static async generateRecommendation(prompt: string, image?: string): Promise<string> {
        return this.chat(prompt);
    }
}
