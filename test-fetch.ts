import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function testFetch() {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];

    for (const m of models) {
        try {
            console.log(`Testing model: ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            console.log(`Model ${m} SUCCESS:`, result.response.text().substring(0, 20));
            return m; // Stop at first working model
        } catch (err: any) {
            console.log(`Model ${m} FAILED: ${err.message}`);
        }
    }
}

testFetch();
