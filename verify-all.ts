import axios from "axios";

async function verifyAll() {
    console.log("--- Verifying AI Consultant (POST /api/ai/consultant) ---");
    try {
        const response = await axios.post("http://localhost:5000/api/ai/consultant", {
            text: "I narrow kitchen with dark cabinets, looking for a light marble countertop."
        });
        console.log("Status:", response.status);
        console.log("Recommendation length:", response.data.recommendation ? response.data.recommendation.length : "N/A");
        console.log("SUCCESS: AI Consultant work.");
    } catch (err: any) {
        console.error("FAILURE: AI Consultant failing:", err.message);
    }

    console.log("\n--- Verifying AI Chat (POST /api/ai/chat) ---");
    try {
        const response = await axios.post("http://localhost:5000/api/ai/chat", {
            message: "Tell me about your installation process."
        });
        console.log("Status:", response.status);
        console.log("Chat Response length:", response.data.response ? response.data.response.length : "N/A");
        console.log("SUCCESS: AI Chat works.");
    } catch (err: any) {
        console.error("FAILURE: AI Chat failing:", err.message);
    }
}

verifyAll();
