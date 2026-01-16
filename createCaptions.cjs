/* Run this with: node createCaptions.cjs 
   It creates .txt files next to your images for AI training.
*/

const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.join(__dirname, 'fine_tuning_data');
const TRIGGER_WORD = "LJSTONE"; // The magic word the AI will learn

// --- HELPER TO WRITE CAPTION ---
function writeCaption(folderName, productName, material, finish) {
    // 1. Find the image file
    const dirPath = path.join(SOURCE_ROOT, folderName);
    if (!fs.existsSync(dirPath)) return;

    // Use the same fuzzy search logic that worked for the import
    const searchTerms = productName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(x => x.length > 2);
    const files = fs.readdirSync(dirPath);

    const match = files.find(file => {
        const lower = file.toLowerCase();
        return searchTerms.some(term => lower.includes(term)) &&
            (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg'));
    });

    if (match) {
        // 2. Create the caption content
        // Format: "[trigger] texture of [Name], [Material], [Finish] finish"
        const caption = `${TRIGGER_WORD} texture of ${productName} surface, ${material}, ${finish} finish, high quality stone texture`;

        // 3. Write the .txt file
        const txtFileName = match.replace(/\.(jpg|jpeg|png)$/i, '.txt');
        const txtPath = path.join(dirPath, txtFileName);

        fs.writeFileSync(txtPath, caption);
        console.log(`📝 Created: ${txtFileName}`);
    }
}

// --- PROCESS DATA ---

// 1. Caesarstone
try {
    const p = path.join(SOURCE_ROOT, 'caesarstone_data.jsonl');
    if (fs.existsSync(p)) {
        const lines = fs.readFileSync(p, 'utf-8').split('\n');
        lines.forEach(line => {
            if (!line.trim()) return;
            try {
                const item = JSON.parse(line);
                writeCaption('caesarstone_images', item.Name, "Quartz", item["Spec/Finish"] || "Polished");
            } catch (e) { }
        });
    }
} catch (e) { }

// 2. Cosentino
try {
    const p = path.join(SOURCE_ROOT, 'cosentino_data', 'cosentino_products_raw.json');
    if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const items = Array.isArray(data) ? data : (data.products || []);
        items.forEach(item => {
            writeCaption('cosentino_images', item.name, item.material || "Dekton", item.finish || "Matte");
        });
    }
} catch (e) { }

console.log("\n✅ Captioning complete. Check your 'fine_tuning_data' folders for .txt files.");