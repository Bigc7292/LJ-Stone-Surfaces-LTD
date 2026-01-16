
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from "path";

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in .env.local");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct listModels on the genAI instance in some SDK versions,
        // but usually it's avail via a ModelManager or similar.
        // However, the error message said "Call ListModels".
        // Using the raw API via a simple fetch might be safer if SDK types are tricky,
        // but let's try the SDK first if it has it (it often currently doesn't expose it easily in node).
        // Actually, looking at docs, it's often a separate call or not in the main class.
        // Let's rely on a basic fetch to the API endpoint which is standard.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Filtered Gemini Models:");
            data.models.filter((m: any) => m.name.includes("gemini")).forEach((m: any) => {
                console.log(`Model: ${m.name}`);
                console.log(`Methods: ${JSON.stringify(m.supportedGenerationMethods)}`);
                console.log("---");
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
