const fs = require('fs');
const axios = require('axios');

async function verify() {
    const PORT = 3010;
    const URL = `http://localhost:${PORT}`;

    console.log(`[TEST] Starting direct backend verification on ${URL}`);

    try {
        // 1. Read test images
        const img1 = fs.readFileSync('c:\\Users\\toplo\\Desktop\\ai_stuff\\clients\\jack_davis_big_jack\\LJ-Stone-Surfaces-LTD\\test_image_1.jpg').toString('base64');
        const img2 = fs.readFileSync('c:\\Users\\toplo\\Desktop\\ai_stuff\\clients\\jack_davis_big_jack\\LJ-Stone-Surfaces-LTD\\test_image_2.jpg').toString('base64');

        // 2. Trigger Inpainting (passing a valid path string for the stone to test shielding)
        console.log(`[TEST] Triggering inpainting job...`);
        const response = await axios.post(`${URL}/api/ai/re-imager`, {
            primary_room: `data:image/jpeg;base64,${img1}`,
            offset_room: `data:image/jpeg;base64,${img2}`,
            stone_texture: "/textures/other/stones/taj-mahal-quartzite.png", // THIS IS THE CULPRIT
            stoneType: "Marble",
            finishType: "Polished",
            color: "Natural"
        });

        const { jobId } = response.data;
        console.log(`[TEST] Job Created: ${jobId}. Polling...`);

        // 3. Poll until success or failure
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 30) {
            await new Promise(r => setTimeout(r, 3000));
            const statusRes = await axios.get(`${URL}/api/re-imager/status/${jobId}`);
            const job = statusRes.data;

            console.log(`[TEST] Attempt ${attempts + 1}: Status = ${job.status}`);

            if (job.status === 'completed') {
                console.log(`[TEST] SUCCESS! Image URL: ${job.imageUrl.substring(0, 100)}...`);
                completed = true;
            } else if (job.status === 'failed') {
                console.error(`[TEST] FAILED: ${job.error}`);
                process.exit(1);
            }
            attempts++;
        }

        if (!completed) {
            console.error(`[TEST] TIMEOUT`);
            process.exit(1);
        }

    } catch (err) {
        console.error(`[TEST] CRITICAL ERROR:`, err.message);
        if (err.response) console.error(`[TEST] ERROR DATA:`, err.response.data);
        process.exit(1);
    }
}

verify();
