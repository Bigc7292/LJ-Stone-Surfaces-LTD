
import fs from 'fs';
import path from 'path';

// Target LOCALHOST
const API_URL = "http://localhost:5000/api/ai/re-imager";
const IMAGE_PATH = path.join(process.cwd(), 'client/public/stones/patagonia.jpg');

async function runTest() {
    console.log("1. Reading test image...");
    try {
        const buffer = fs.readFileSync(IMAGE_PATH);
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

        console.log(`2. Sending request to LOCAL API: ${API_URL}`);

        // We expect the new logic to handle this
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

        const outBuffer = Buffer.from(data.imageUrl.split(',')[1], 'base64');
        fs.writeFileSync('test_output_local.jpg', outBuffer);
        console.log("   Saved result to 'test_output_local.jpg'");

    } catch (err: any) {
        console.error("TEST FAILED:", err.message);
        process.exit(1);
    }
}

runTest();
