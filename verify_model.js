
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

// Load .env.local manually if needed
import fs from 'fs';
import path from 'path';
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, val] = line.split('=');
        if (key && val && !process.env[key]) {
            process.env[key.trim()] = val.trim();
        }
    });
}

async function testModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error("No API KEY found!"); process.exit(1); }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-flash-latest", "gemini-2.0-flash-exp"];

    for (const modelName of modelsToTest) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName} works!`);
            console.log(`Response: ${response.text()}`);
            return; // Stop after first success
        } catch (error) {
            console.error(`❌ FAILED: ${modelName} - ${error.message.split('\n')[0]}`);
        }
    }
}

testModels();
