import { GoogleGenAI, Modality } from "@google/genai";
import "dotenv/config";

async function testReImager() {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!apiKey) return;

    const ai = new GoogleGenAI({
        apiKey: apiKey,
    });

    try {
        console.log("Testing gemini-2.5-flash-image...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ role: "user", parts: [{ text: "Generative test" }] }],
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find(
            (part: any) => part.inlineData
        );

        if (imagePart?.inlineData?.data) {
            console.log("SUCCESS: gemini-2.5-flash-image is working and returned image data.");
        } else {
            console.log("Response text:", candidate?.content?.parts?.[0]?.text);
            console.log("No image data returned, but model responded.");
        }
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}

testReImager();
