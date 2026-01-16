
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import * as fs from 'fs';

async function logResult(msg: string) {
    console.log(msg);
    fs.appendFileSync("model_test_results.txt", msg + "\n");
}

async function testModel(modelName: string) {
    await logResult(`Testing model: ${modelName}...`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        await logResult("No GEMINI_API_KEY found");
        return false;
    }

    const versions = ["v1beta", "v1"];

    for (const v of versions) {
        await logResult(`  Testing with apiVersion: ${v}`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: v });
        const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        try {
            const result = await model.generateContent([
                { text: "Describe" },
                { inlineData: { mimeType: "image/png", data: tinyPng } }
            ]);
            await result.response;
            await logResult(`✅ SUCCESS with ${modelName} on ${v}`);
            return true;
        } catch (e: any) {
            await logResult(`❌ FAILED with ${modelName} on ${v}: ${e.message.slice(0, 150)}`);
        }
    }
    return false;

}

async function run() {
    fs.writeFileSync("model_test_results.txt", "Starting Test...\n");
    const models = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-8b",
        "gemini-1.5-flash-8b-latest",
        "gemini-exp-1206"
    ];

    for (const m of models) {
        if (await testModel(m)) {
            await logResult(`\n🎉 FOUND WORKING MODEL: "${m}"`);
            break;
        }
    }
}

run();
