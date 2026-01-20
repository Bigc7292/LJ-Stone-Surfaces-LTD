import * as fs from 'fs';
import * as path from 'path';

const stonesDir = path.join(process.cwd(), 'client', 'public', 'stones');
const existingSwatchesPath = path.join(process.cwd(), 'client', 'src', 'data', 'existing_swatches.json');

try {
    const existingData = JSON.parse(fs.readFileSync(existingSwatchesPath, 'utf-8'));
    const existingUrls = new Set(existingData.map((s: any) => s.swatch_url));

    const files = fs.readdirSync(stonesDir);
    const missingFiles = [];

    for (const file of files) {
        if (file.startsWith('WhatsApp')) continue; // Ignore portfolio images
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue; // Ignore non-images

        const url = `/stones/${file}`;
        if (!existingUrls.has(url)) {
            missingFiles.push(file);
        }
    }

    if (missingFiles.length === 0) {
        console.log('No missing stone files found.');
    } else {
        console.log(`Found ${missingFiles.length} missing stone files.`);

        // Generate SQL
        const escapeSql = (str: string) => str.replace(/'/g, "''");

        // Generate explicit IDs for new stones to avoid conflicts with existing seeded IDs
        // We'll use a prefix 'auto_' + timestamp + index
        const timestamp = Date.now();

        const values = missingFiles.map((file, index) => {
            const name = path.parse(file).name
                .replace(/[_-]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            const url = `/stones/${file}`;
            // Generate a sufficiently unique ID
            const id = `auto_${timestamp}_${index}`;

            return `('${id}', '${escapeSql(name)}', 'Uncategorized', 'Standard', '${escapeSql(url)}', 'Imported from file system')`;
        }).join(',\n');

        const sql = `INSERT INTO stone_library (id, name, category, texture, swatch_url, description) VALUES \n${values} \nON CONFLICT (id) DO NOTHING;`;

        fs.writeFileSync('seed_missing_stones.sql', sql);
        console.log('Created seed_missing_stones.sql');
    }

} catch (err) {
    console.error('Error:', err);
}
