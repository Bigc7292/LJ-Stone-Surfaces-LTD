import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';

async function testSurgicalEdit() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const projectId = process.env.GOOGLE_PROJECT_ID || '724034238892';
    const location = process.env.GOOGLE_LOCATION || 'us-central1';

    // Vertex AI Endpoint for Imagen 3 Editing
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-capability-editing-001:predict`;

    console.log(`[Benchmark] Testing surgical edit on Vertex AI...`);

    const imagePath = 'sample_kitchen.jpg';
    if (!fs.existsSync(imagePath)) {
        console.error(`[Error] ${imagePath} not found!`);
        return;
    }

    const base64Image = fs.readFileSync(imagePath).toString('base64');

    const payload = {
        instances: [
            {
                prompt: "Surgically edit ONLY the countertops. Replace the existing countertop material with Taj Mahal Quartzite (creamy white natural stone with elegant grey and gold veining). Do not change cabinets, lighting, floor, or room layout. Keep EVERYTHING ELSE identical.",
                image: {
                    bytesBase64Encoded: base64Image
                }
            }
        ],
        parameters: {
            editConfig: {
                editMode: "INPAINT_INSIDE_MASK",
                maskMode: "SEMANTIC",
                segmentationSpec: {
                    labels: ["countertop"]
                }
            },
            sampleCount: 1,
            aspectRatio: "1:1", // Adjust based on input if needed
            outputMimeType: "image/jpeg"
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer $(gcloud auth print-access-token)` // This script needs local gcloud auth or a token
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.error) {
            console.error('[Benchmark] API Error:', JSON.stringify(data.error, null, 2));
            return;
        }

        const outputImage = data.predictions?.[0]?.bytesBase64Encoded;
        if (outputImage) {
            fs.writeFileSync('benchmark_result.jpg', Buffer.from(outputImage, 'base64'));
            console.log('[Benchmark] Success! Saved to benchmark_result.jpg');
        } else {
            console.log('[Benchmark] No image returned in predictions.');
            console.log('Full Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('[Benchmark] Error:', error);
    }
}

testSurgicalEdit();
