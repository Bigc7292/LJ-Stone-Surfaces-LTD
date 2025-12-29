import axios from "axios";

async function testText() {
    const prompt = "Hello, are you working?";
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=mistral`;
    console.log("Testing URL:", url);
    try {
        const response = await axios.get(url);
        console.log("Response Status:", response.status);
        console.log("Response Content:", response.data);
    } catch (err: any) {
        console.error("Error:", err.message);
        if (err.response) {
            console.error("Response Data:", err.response.data);
        }
    }
}

testText();
