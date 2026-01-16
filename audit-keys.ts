import axios from "axios";
import "dotenv/config";

async function auditKeys() {
    const keys = [
        process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        process.env.AI_INTEGRATIONS_GEMINI_API_KEY_2,
        process.env.AI_INTEGRATIONS_GEMINI_API_KEY_3
    ].filter(Boolean);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        console.log(`--- Auditing Key #${i + 1} (${key?.substring(0, 8)}...) ---`);
        try {
            // Test 1: List models
            const listResp = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            console.log(`Key #${i + 1} VALID (Can list models)`);

            // Test 2: Simple generation with 1.5 flash
            console.log(`Testing gemini-1.5-flash...`);
            const genResp = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                contents: [{ parts: [{ text: "hi" }] }]
            });
            console.log(`gemini-1.5-flash WORKING`);

            // Test 3: Test 2.5 flash
            console.log(`Testing gemini-2.5-flash...`);
            try {
                await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                    contents: [{ parts: [{ text: "hi" }] }]
                });
                console.log(`gemini-2.5-flash WORKING`);
            } catch (e: any) {
                console.log(`gemini-2.5-flash FAILED (probably model name)`);
            }

        } catch (err: any) {
            console.log(`FAILED: ${err.response?.data?.error?.message || err.message}`);
        }
    }
}

auditKeys();
