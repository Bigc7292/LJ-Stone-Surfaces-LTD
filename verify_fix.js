
import fs from 'fs';
import path from 'path';

// Use standard fetch (Node 18+)
async function test() {
    try {
        // Path to the image the user verified
        const imagePath = 'C:/Users/toplo/.gemini/antigravity/brain/90e7e8c3-ae0d-4a6a-b067-fa78e0798525/uploaded_image_1768486687712.jpg';

        console.log(`Reading image from: ${imagePath}`);
        const bitmap = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(bitmap).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("Sending POST request to https://lj-stone-surfaces-ltd-v3.netlify.app/api/ai/re-imager ...");

        const response = await fetch('https://lj-stone-surfaces-ltd-v3.netlify.app/api/ai/re-imager', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: dataUrl,
                stoneType: 'Calacatta Gold',
                markers: [{ x: 50, y: 50, label: 'Test Surface' }],
                finishType: 'Polished',
                color: 'Warm'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("FAILED. Status:", response.status);
            console.error("Error Details:", JSON.stringify(errorData, null, 2));
            process.exit(1);
        }

        const data = await response.json();
        console.log("SUCCESS! Request completed.");
        console.log("Returned Image URL (truncated):", data.imageUrl?.substring(0, 50) + "...");

    } catch (error) {
        console.error("Script Execution Error:", error);
        process.exit(1);
    }
}

test();
