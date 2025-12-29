import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import 'dotenv/config';

async function test() {
    const key = process.env.STABILITY_API_KEY;
    console.log('Testing with key length:', key ? key.length : 0);
    if (!key) return;

    const formData = new FormData();
    const imagePath = 'C:/Users/toplo/.gemini/antigravity/brain/70b590be-6188-42ea-8728-bc60ea758548/uploaded_image_1766859424421.jpg';

    if (!fs.existsSync(imagePath)) {
        console.error('Image not found at:', imagePath);
        return;
    }

    formData.append('image', fs.createReadStream(imagePath));
    formData.append('prompt', 'Replace countertop with black marble');
    formData.append('search_prompt', 'countertop');
    formData.append('output_format', 'webp');

    try {
        console.log('Sending request to Stability AI...');
        const response = await axios.post(
            'https://api.stability.ai/v2beta/stable-image/edit/search-and-replace',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${key}`,
                    Accept: 'image/*',
                },
                responseType: 'arraybuffer',
            }
        );
        console.log('Success! Received image bytes:', response.data.byteLength);
        fs.writeFileSync('test-out.webp', Buffer.from(response.data));
        console.log('Saved result to test-out.webp');
    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status);
            try {
                const body = Buffer.from(error.response.data as ArrayBuffer).toString();
                console.error('Response Data:', body);
            } catch (e) {
                console.error('Could not parse error body');
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
