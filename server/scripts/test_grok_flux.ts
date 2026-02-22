import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log("🚀 Starting Grok/Flux Integration Test (Images + Video)...");

    // Dynamic import to ensure dotenv.config() has run first
    const { GrokService } = await import('../services/grokService.js');

    // Path to the test image provided by the user
    // Use the latest user-provided image from the prompt
    const systemProvidedPath = 'c:/Users/toplo/Desktop/ai_stuff/clients/jack_davis_big_jack/LJ-Stone-Surfaces-LTD/.gemini/input_file_0.png';
    let inputImagePath = systemProvidedPath;

    if (!fs.existsSync(inputImagePath)) {
        // Fallback to the marker or a known path
        inputImagePath = 'c:/Users/toplo/Desktop/ai_stuff/clients/jack_davis_big_jack/LJ-Stone-Surfaces-LTD/verification_result.png';
    }

    if (!fs.existsSync(inputImagePath)) {
        console.error(`❌ Input image not found at: ${inputImagePath}`);
        return;
    }

    console.log(`📸 Using image: ${inputImagePath}`);
    const roomBase64 = fs.readFileSync(inputImagePath).toString('base64');

    // Sample stone details: Luxury Black Marble with Dramatic Gold Veins
    const testParams = {
        roomImageBase64: roomBase64,
        stoneName: "Black Portoro",
        stoneCategory: "Marble with dramatic gold veins, photorealistic, high detail, preserve room structure identical",
        finishType: "Polished" as const,
        ambience: "Natural Daylight"
    };

    let resultBase64 = "";

    try {
        console.log("📤 Step 1: Sending SURGICAL EDIT request to /v1/images/edits...");
        resultBase64 = await GrokService.generateStoneVisualization(testParams);

        const outputPath = path.join(process.cwd(), 'test-output-flux.png');
        const base64Data = resultBase64.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(outputPath, base64Data, 'base64');

        console.log(`✅ Success! Generated image saved to: ${outputPath}`);
    } catch (error) {
        console.error("❌ Image test failed:", error);
        return;
    }

    /* 
    // Video skipped as per user request to focus on image stability first.
    try {
        console.log("🎬 Step 2: Starting VIDEO WALKTHROUGH generation...");
        // ...
    } catch (error) {
        console.error("❌ Video test failed:", error);
    }
    */
}

runTest();
