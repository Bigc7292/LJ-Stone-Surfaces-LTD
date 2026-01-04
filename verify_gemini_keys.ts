
import { GoogleGenerativeAI } from "@google/generative-ai";

const key = "AIzaSyA-BxPXNz84Wmi5IcqHqmmsAeD3ChTjoZg";

async function testKey() {
    console.log("Testing VITE_GEMINI_API_KEY...");
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hi");
        const response = await result.response;
        const text = response.text();
        console.log("RESULT: " + (text ? "SUCCESS" : "EMPTY"));
    } catch (error: any) {
        console.log("RESULT: FAILED - " + error.message);
    }
}

testKey();
