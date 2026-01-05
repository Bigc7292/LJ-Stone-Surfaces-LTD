import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import fs from "fs/promises";
import path from "path";

// --- Types ---
export interface Marker {
    x: number;
    y: number;
    label?: string;
    customLabel?: string;
}

export type FinishType = 'Polished' | 'Matte' | 'Honed' | 'Leathered' | 'Brushed';

// --- FALLBACK KNOWLEDGE (The "Backup Brain") ---
// Critical: Used if knowledge_base.md cannot be read.
const FALLBACK_KNOWLEDGE = `
COMPANY: LJ Stone Surfaces LTD
LOCATION: Aberdare, Wales.
EXPERIENCE: 20 Years.
MATERIALS: Quartz, Granite, Dekton ONLY. (No Marble, No Porcelain).
SERVICES: Templating, Fabrication, Installation.
CONTACT: Request a quote via the form.
FAQ:
- Lead time approx 7-14 days.
- Based in Aberdare.
`;

export class AIService {

    // =================================================================
    // 1. IMAGE ENGINE (Visualizer)
    // =================================================================
    static async performInpainting(params: {
        imagePath: string;
        stoneType: string;
        prompt?: string;
        markers: Marker[];
        finishType?: FinishType;
        color?: string;
    }): Promise<string> {

        console.log(`[AI Service] Visualizing: ${params.stoneType} (${params.finishType})`);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const base64Data = params.imagePath.split(',')[1] || params.imagePath;

        const finishType = params.finishType || 'Polished';
        const color = params.color || 'Natural';

        let finishInstruction = '';
        switch (finishType) {
            case 'Polished': finishInstruction = `ROUGHNESS: 0.05 (Mirror). SPECULARITY: High.`; break;
            case 'Matte': finishInstruction = `ROUGHNESS: 0.6 (Satin). SPECULARITY: Low.`; break;
            case 'Leathered': finishInstruction = `TEXTURE: Normal Map High. SURFACE: Tactile depth.`; break;
            default: finishInstruction = `ROUGHNESS: 0.05. SPECULARITY: High.`; break;
        }

        const prompt = `
        TASK: Architectural Material Replacement.
        Material: ${params.stoneType} (${color}).
        Finish: ${finishInstruction}.
        User Note: "${params.prompt || 'Apply seamlessly.'}"
        
        RULES:
        1. Follow organic boundaries exactly.
        2. Preserve shadows and ambient occlusion.
        3. Vein scale must match object size.
        
        MARKERS:
        ${params.markers.map((m, i) => `- Target ${i + 1}: [${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%]`).join("\n")}

        OUTPUT: Return ONLY the rendered image.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                config: { safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE }] },
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                        { text: prompt },
                    ],
                },
            });

            const candidate = response.candidates?.[0];
            if (candidate?.content?.parts?.[0]?.inlineData?.data) {
                return `data:image/png;base64,${candidate.content.parts[0].inlineData.data}`;
            }
            throw new Error("Model refused generation.");

        } catch (error: any) {
            console.error("[AI Service] Image Gen Failed:", error.message);
            throw error;
        }
    }

    // =================================================================
    // 2. CHAT ENGINE (Global Chatbot)
    // =================================================================
    static async chat(message: string, history: any[]): Promise<string> {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

            // 1. Try to read the file, but use FALLBACK if it fails.
            let knowledgeBase = FALLBACK_KNOWLEDGE;
            try {
                const kbPath = path.join(process.cwd(), "server", "services", "knowledge_base.md");
                const fileContent = await fs.readFile(kbPath, "utf-8");
                if (fileContent.length > 10) knowledgeBase = fileContent;
            } catch (err) {
                console.warn("[AI Service] Knowledge Base file not found. Using Backup Brain.");
            }

            // 2. System Prompt
            const systemPrompt = `
            You are the Senior Sales Consultant for LJ Stone Surfaces LTD.
            
            CONTEXT:
            ${knowledgeBase}

            RULES:
            - Answer using ONLY the Context provided.
            - We ONLY sell Quartz, Granite, and Dekton. Do not mention Marble or Porcelain.
            - Be professional, concise, and helpful.
            - If asked about prices/quotes, direct them to the "Request Quote" tab.
            `;

            // 3. Generate Response
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: {
                    parts: [
                        { text: systemPrompt },
                        { text: `User: ${message}` }
                    ]
                }
            });

            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || "I am here to help, but I missed that. Could you rephrase?";

        } catch (error: any) {
            console.error("[AI Service] Chat Critical Failure:", error.message);
            return "Thank you for your message. I am currently connecting to the knowledge base. Please ask again in a moment, or fill out the quote form!";
        }
    }

    // --- Placeholders ---
    static async generateRecommendation(prompt: string, image?: string): Promise<string> {
        return this.chat(prompt, []);
    }

    static async generateImage(prompt: string): Promise<string> { return ""; }
}