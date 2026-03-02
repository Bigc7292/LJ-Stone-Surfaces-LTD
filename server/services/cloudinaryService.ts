/**
 * Cloudinary Service - Video & Image Upload
 * Uploads media to Cloudinary for permanent storage
 */
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('[Cloudinary Service] WARNING: Missing Cloudinary credentials in .env');
} else {
    console.log('[Cloudinary Service] Initialized successfully.');
}

/**
 * Upload a video from a temporary URL (e.g. Grok API output) to Cloudinary
 * Returns the permanent secure_url
 */
export async function uploadVideoFromUrl(tempUrl: string, folder = 'lj-stone/videos'): Promise<string> {
    console.log(`[Cloudinary Service] Uploading video from temp URL to Cloudinary...`);

    const result = await cloudinary.uploader.upload(tempUrl, {
        resource_type: 'video',
        folder,
        format: 'mp4',
        transformation: [
            { quality: 'auto:good' }
        ]
    });

    console.log(`[Cloudinary Service] Video uploaded: ${result.secure_url} (${result.bytes} bytes)`);
    return result.secure_url;
}

/**
 * Upload an image from a URL or base64 to Cloudinary
 * Returns the permanent secure_url
 */
export async function uploadImageFromUrl(imageUrlOrBase64: string, folder = 'lj-stone/images'): Promise<string> {
    const result = await cloudinary.uploader.upload(imageUrlOrBase64, {
        resource_type: 'image',
        folder,
    });

    return result.secure_url;
}

export default cloudinary;
