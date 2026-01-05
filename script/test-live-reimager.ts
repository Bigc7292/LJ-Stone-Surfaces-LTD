
import fs from 'fs';
import path from 'path';

// Known Cloud Run URL from previous deployments
const API_URL = "https://api-64679742754.us-central1.run.app/api/ai/re-imager";
const IMAGE_PATH = path.join(process.cwd(), 'client/public/stones/patagonia.jpg');

async function runTest() {
    console.log("1. Reading test image...");
    try {
        const buffer = fs.readFileSync(IMAGE_PATH);
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        console.log("2. Sending request to Live Cloud Run API...");
        console.log(`   Target: ${API_URL}`);
        console.log("   Payload: stoneType='Titanium Gold Granite', markers=[{x:50,y:50}], finish='Polished'");

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: base64Image,
                stoneType: "Titanium Gold Granite",
                markers: [{ x: 50, y: 50, label: "Test Surface" }],
                finishType: "Polished",
                color: "Dark"
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error ${response.status}: ${text}`);
        }

        const data = await response.json();
        if (!data.imageUrl) throw new Error("No imageUrl in response");

        console.log("3. Success! Received generated image.");
        console.log(`   Image Data Length: ${data.imageUrl.length} chars`);

        // Save it to verify it's a real image
        const outBuffer = Buffer.from(data.imageUrl.split(',')[1], 'base64');
        fs.writeFileSync('test_output_live.jpg', outBuffer);
        console.log("   Saved result to 'test_output_live.jpg'");

    } catch (err: any) {
        console.error("TEST FAILED:", err.message);
        process.exit(1);
    }
}

runTest();
