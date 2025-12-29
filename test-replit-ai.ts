import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function testReplitAI() {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

    console.log("Testing with @google/genai...");
    console.log("API Key length:", apiKey?.length);
    console.log("Base URL:", baseUrl);

    const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
            apiVersion: "",
            baseUrl: baseUrl,
        },
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: "Hello" }] }],
        });
        console.log("Response:", response.candidates?.[0]?.content?.parts?.[0]?.text);
        console.log("SUCCESS with @google/genai and gemini-1.5-flash");
    } catch (err: any) {
        console.error("ERROR with @google/genai (flash):", err.message);

        // Try the "image" model name I saw earlier
        try {
            console.log("Trying gemini-2.5-flash-image...");
            const response2 = await ai.models.generateContent({
                model: "gemini-2.5-flash-image",
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            console.log("Response (2.5):", response2.candidates?.[0]?.content?.parts?.[0]?.text);
            console.log("SUCCESS with gemini-2.5-flash-image");
        } catch (err2: any) {
            console.error("ERROR with @google/genai (2.5):", err2.message);
        }
    }
}

testReplitAI();
