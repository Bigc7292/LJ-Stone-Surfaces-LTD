// Test script to directly call Stability AI Inpaint API and capture any errors
import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

async function testStabilityAI() {
    console.log("=== Testing Stability AI Inpaint API ===\n");

    const apiKey = process.env.STABILITY_API_KEY;
    console.log("API Key found:", apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : "NO");

    if (!apiKey) {
        console.log("ERROR: No STABILITY_API_KEY in .env");
        return;
    }

    // Create a simple test image (100x100 blue square)
    const testImage = await sharp({
        create: {
            width: 512,
            height: 512,
            channels: 3,
            background: { r: 100, g: 150, b: 200 }
        }
    }).png().toBuffer();

    console.log("Created test image:", testImage.length, "bytes");

    // Create a simple mask (white background with black circle in center)
    const maskSvg = `
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            <circle cx="256" cy="256" r="100" fill="black"/>
        </svg>
    `;
    const testMask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
    console.log("Created test mask:", testMask.length, "bytes");

    // Create form data
    const formData = new FormData();
    formData.append("image", testImage, { filename: "image.png", contentType: "image/png" });
    formData.append("mask", testMask, { filename: "mask.png", contentType: "image/png" });
    formData.append("prompt", "beautiful marble stone texture");
    formData.append("output_format", "png");

    console.log("\nCalling Stability AI API...");
    console.log("Endpoint: https://api.stability.ai/v2beta/stable-image/edit/inpaint");

    try {
        const response = await axios.post(
            "https://api.stability.ai/v2beta/stable-image/edit/inpaint",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "image/*",
                },
                responseType: "arraybuffer",
                timeout: 60000,
            }
        );

        console.log("\n✅ SUCCESS!");
        console.log("Response status:", response.status);
        console.log("Response size:", response.data.length, "bytes");

        // Save the result
        await sharp(response.data).toFile("test_stability_result.png");
        console.log("Saved result to test_stability_result.png");

    } catch (error: any) {
        console.log("\n❌ ERROR!");
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("Error code:", error.code);

        if (error.response) {
            console.log("\nResponse details:");
            console.log("Status:", error.response.status);
            console.log("Status text:", error.response.statusText);

            try {
                const errorText = Buffer.from(error.response.data).toString("utf-8");
                console.log("Response body:", errorText);
            } catch (e) {
                console.log("Could not parse response body");
            }
        } else if (error.request) {
            console.log("No response received - network error?");
        }
    }
}

testStabilityAI();
