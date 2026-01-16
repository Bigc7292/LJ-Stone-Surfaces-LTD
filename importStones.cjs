/* Run this script with: node importStones.cjs */

const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const SOURCE_ROOT = path.join(__dirname, 'fine_tuning_data');
const TRIGGER_WORD = "LJSTONE";

// AUTO-DETECT DESTINATION
let projectRoot = __dirname;
if (fs.existsSync(path.join(__dirname, 'client', 'src'))) {
    projectRoot = path.join(__dirname, 'client');
}

const TARGET_IMG_DIR = path.join(projectRoot, 'public', 'stones');
const DATA_DIR = path.join(projectRoot, 'src', 'data');
const TARGET_JSON_FILE = path.join(DATA_DIR, 'stoneLibrary.json');

if (!fs.existsSync(TARGET_IMG_DIR)) fs.mkdirSync(TARGET_IMG_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let masterLibrary = [];

// --- 2. HELPER FUNCTIONS ---
function findImageByFuzzyName(folderName, productName) {
    if (!productName) return null;

    const dirPath = path.join(SOURCE_ROOT, folderName);
    if (!fs.existsSync(dirPath)) return null;

    // Remove special chars and split into search words
    const searchTerms = productName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(x => x.length > 2);

    try {
        const files = fs.readdirSync(dirPath);

        // Find a file that contains the search terms
        const match = files.find(file => {
            const lowerFile = file.toLowerCase();
            // Match if it has the terms AND is an image
            return searchTerms.some(term => lowerFile.includes(term)) &&
                (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.png') || lowerFile.endsWith('.jpeg'));
        });

        if (match) {
            // Copy the image
            const sourcePath = path.join(dirPath, match);
            // Create a clean, web-safe filename
            const ext = path.extname(match);
            const safeName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() + ext;
            const targetPath = path.join(TARGET_IMG_DIR, safeName);

            fs.copyFileSync(sourcePath, targetPath);
            return `/stones/${safeName}`; // Return the web URL
        }
    } catch (e) { console.log(e); }

    return null;
}

// --- 3. PROCESS CAESARSTONE ---
console.log("Processing Caesarstone...");
try {
    const p = path.join(SOURCE_ROOT, 'caesarstone_data.jsonl');
    if (fs.existsSync(p)) {
        const lines = fs.readFileSync(p, 'utf-8').split('\n');
        lines.forEach((line, idx) => {
            if (!line.trim()) return;
            try {
                const item = JSON.parse(line);
                const name = item.Name || "Unknown";
                const material = "Quartz";
                const finish = item["Spec/Finish"] || "Polished";

                // 1. Find and Copy Image
                const webUrl = findImageByFuzzyName('caesarstone_images', name);

                if (webUrl) {
                    // 2. Generate Description DIRECTLY here
                    const desc = `${TRIGGER_WORD} texture of ${name} surface, ${material}, ${finish} finish, high quality stone texture.`;

                    masterLibrary.push({
                        id: `cs_${idx}`,
                        name: name,
                        category: material,
                        texture: finish,
                        swatchUrl: webUrl,
                        description: desc // <--- Guaranteed to be here
                    });
                }
            } catch (e) { }
        });
    }
} catch (e) { console.log("Error Caesarstone:", e.message); }

// --- 4. PROCESS COSENTINO ---
console.log("Processing Cosentino...");
try {
    const p = path.join(SOURCE_ROOT, 'cosentino_data', 'cosentino_products_raw.json');
    if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        const items = Array.isArray(data) ? data : (data.products || []);

        items.forEach((item, idx) => {
            const name = item.name;
            const material = item.material || "Dekton";
            const finish = item.finish || "Matte";

            // 1. Find and Copy Image
            const webUrl = findImageByFuzzyName('cosentino_images', name);

            if (webUrl) {
                // 2. Generate Description DIRECTLY here
                const desc = `${TRIGGER_WORD} texture of ${name} surface, ${material}, ${finish} finish, high quality stone texture.`;

                masterLibrary.push({
                    id: `cos_${idx}`,
                    name: name,
                    category: material,
                    texture: finish,
                    swatchUrl: webUrl,
                    description: desc // <--- Guaranteed to be here
                });
            }
        });
    }
} catch (e) { console.log("Error Cosentino:", e.message); }

// --- 5. SAVE ---
fs.writeFileSync(TARGET_JSON_FILE, JSON.stringify(masterLibrary, null, 2));
console.log(`\n---------------------------------------`);
console.log(`SUCCESS! Imported ${masterLibrary.length} stones.`);
console.log(`Target: ${TARGET_JSON_FILE}`);
console.log(`---------------------------------------\n`);