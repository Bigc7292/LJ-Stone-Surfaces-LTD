import { AIService } from './server/services/aiService.js';

// Test with a sample kitchen image URL
const testImage = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800';

async function test() {
    console.log('Testing Cloudinary integration...');
    console.log('Cloudinary configured:', !!process.env.CLOUDINARY_CLOUD_NAME);

    try {
        const result = await AIService.performInpainting({
            imagePath: testImage,
            stoneType: 'Calacatta Marble',
            prompt: 'Replace countertops'
        });

        if (result.startsWith('data:image')) {
            console.log('Result: Base64 image received (length:', result.length, ')');
        } else {
            console.log('Result URL:', result);
        }
        console.log('SUCCESS: Integration working!');
    } catch (error: any) {
        console.error('ERROR:', error.message);
    }
}

test();
