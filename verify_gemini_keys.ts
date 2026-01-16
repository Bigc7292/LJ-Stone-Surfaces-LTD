
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';

const key = "AIzaSyBfCNsLymrZohsTSLSfSQK8qdMbPqVyDH0";

async function testKey() {
    console.log("Testing VITE_GEMINI_API_KEY...");
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hi");
        const response = await result.response;
        const text = response.text();
        const msg = "RESULT: " + (text ? "SUCCESS" : "EMPTY");
        console.log(msg);
        fs.writeFileSync('verification_result.txt', msg);
    } catch (error: any) {
        let msg = "RESULT: FAILED - " + error.message;
        if (error.response?.candidates?.[0]?.finishReason === "SAFETY") {
            msg = "RESULT: SUCCESS (Blocked by safety but key works)";
        }
        console.log(msg);
        fs.writeFileSync('verification_result.txt', msg);
    }
}

testKey();
