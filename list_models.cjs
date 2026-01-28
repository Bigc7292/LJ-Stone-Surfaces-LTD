const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Listing models...");
        // Direct REST call usually easier to see details
        const axios = require('axios');
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error listing models:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

listModels();
