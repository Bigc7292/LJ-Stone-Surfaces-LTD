
import fs from 'fs';
import path from 'path';

// Native fetch in Node 18+
async function testUpload() {
    const baseUrl = 'http://localhost:3010';
    console.log(`Targeting server: ${baseUrl}`);

    // 1. Read the user provided image
    // Path: C:\Users\toplo\.gemini\antigravity\brain\0d56428d-8870-43f2-a007-8d4483a7372c\media__1770589179153.jpg
    // We need to use valid path syntax.
    const imagePath = String.raw`C:\Users\toplo\.gemini\antigravity\brain\0d56428d-8870-43f2-a007-8d4483a7372c\media__1770589179153.jpg`;

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image file not found at: ${imagePath}`);
        process.exit(1);
    }

    console.log(`Reading image from: ${imagePath}`);
    const mappingBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${mappingBuffer.toString('base64')}`;

    console.log(`Image read successfully. Size: ${mappingBuffer.length} bytes`);

    // 2. Prepare Payload
    // Matching LuxeStoneVisualizer.tsx structure
    const payload = {
        roomImage: base64Image,
        stoneName: "Test Granite",
        stoneCategory: "Granite",
        stoneTexture: "/textures/granite/Granite001A.png", // Valid asset we verified
        finishType: "Polished",
        ambience: "Natural"
    };

    console.log("Sending POST request to /api/grok/generate-image...");
    const startTime = Date.now();

    try {
        const response = await fetch(`${baseUrl}/api/grok/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const duration = Date.now() - startTime;
        console.log(`Response received in ${duration}ms. Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log("✅ SUCCESS: Image generated!");
            // console.log("Response Data:", JSON.stringify(data, null, 2)); // Too big
            if (data.imageUrl && data.imageUrl.startsWith("data:image")) {
                console.log("✅ Validated: imageUrl is a base64 image string.");
            } else {
                console.warn("⚠️ Warning: imageUrl format is unexpected.");
            }
        } else {
            const text = await response.text();
            console.error(`❌ FAILED: Server responded with ${response.status}`);
            console.error(`Response body: ${text}`);
        }

    } catch (error) {
        console.error("❌ network error:", error.message);
    }
}

testUpload();
