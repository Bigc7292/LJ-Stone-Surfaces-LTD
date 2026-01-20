import * as fs from 'fs';
import * as path from 'path';

// Define source directory relative to script execution location
const imagesDir = path.join(process.cwd(), 'client', 'public', 'portfolio_images');
const outputDir = process.cwd();

try {
    // Read all files from the directory
    const files = fs.readdirSync(imagesDir);

    // Filter for image files (jpeg/jpg)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

    const CHUNK_SIZE = 100; // Batch size

    if (imageFiles.length === 0) {
        console.log('No image files found to seed.');
    }

    // Helper to escape single quotes for SQL
    const escapeSql = (str: string) => str.replace(/'/g, "''");

    for (let i = 0; i < imageFiles.length; i += CHUNK_SIZE) {
        const chunk = imageFiles.slice(i, i + CHUNK_SIZE);

        const values = chunk.map(filename => {
            // Create title from filename: "WhatsApp Image... (1).jpeg" -> "WhatsApp Image... (1)"
            const title = path.parse(filename).name;
            // Web-accessible path: /portfolio_images/filename.jpeg
            const imageUrl = `/portfolio_images/${filename}`;

            return `('${escapeSql(imageUrl)}', '${escapeSql(title)}')`;
        }).join(',\n');

        const sql = `INSERT INTO portfolio_gallery (image_url, title) VALUES \n${values};`;

        fs.writeFileSync(path.join(outputDir, `seed_portfolio_${i / CHUNK_SIZE + 1}.sql`), sql);
        console.log(`Created seed_portfolio_${i / CHUNK_SIZE + 1}.sql`);
    }

    console.log(`Verified ${imageFiles.length} images.`);

} catch (err) {
    console.error('Error reading directory:', err);
}
