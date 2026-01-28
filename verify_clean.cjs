const fs = require('fs');
const axios = require('axios');

async function verify() {
    const PORT = 3010;
    const URL = `http://localhost:${PORT}`;

    console.log(`[TEST] Starting backend verification on ${URL}`);

    try {
        // 1. Read test image
        const img1 = fs.readFileSync('test_image_1.jpg').toString('base64');
        console.log(`[TEST] Image size: ${img1.length} chars`);

        // 2. Trigger Inpainting
        console.log(`[TEST] Triggering inpainting job...`);
        const response = await axios.post(`${URL}/api/ai/re-imager`, {
            primary_room: `data:image/jpeg;base64,${img1}`,
            stone_texture: "/textures/other/stones/taj-mahal-quartzite.png",
            stoneType: "Marble",
            finishType: "Polished",
            color: "Natural"
        });

        const { jobId } = response.data;
        console.log(`[TEST] Job Created: ${jobId}`);

        // 3. Poll until success or failure
        for (let attempt = 1; attempt <= 30; attempt++) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await axios.get(`${URL}/api/re-imager/status/${jobId}`);
            const job = statusRes.data;

            console.log(`[TEST] Attempt ${attempt}: Status = ${job.status}`);

            if (job.status === 'completed') {
                console.log(`[TEST] SUCCESS!`);
                console.log(`[TEST] Image URL length: ${job.imageUrl?.length || 0} characters`);
                console.log(`[TEST] Image URL preview: ${job.imageUrl?.substring(0, 50)}...`);

                // Save the rendered image to verify
                if (job.imageUrl?.startsWith('data:')) {
                    const base64Part = job.imageUrl.split(',')[1];
                    fs.writeFileSync('verification_result.png', Buffer.from(base64Part, 'base64'));
                    console.log(`[TEST] Saved rendered image to verification_result.png`);
                }
                return;
            } else if (job.status === 'failed') {
                console.error(`[TEST] FAILED: ${job.error}`);
                process.exit(1);
            }
        }

        console.error(`[TEST] TIMEOUT after 30 attempts`);
        process.exit(1);

    } catch (err) {
        console.error(`[TEST] CRITICAL ERROR:`, err.message);
        if (err.response) console.error(`[TEST] Error data:`, err.response.data);
        process.exit(1);
    }
}

verify();
