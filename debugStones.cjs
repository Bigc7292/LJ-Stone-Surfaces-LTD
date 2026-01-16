/* Run this with: node debugStones.cjs */
const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.join(__dirname, 'fine_tuning_data');

console.log("--- DEBUGGING DATA PATHS ---");
console.log(`Looking in: ${SOURCE_ROOT}\n`);

// 1. CHECK CAESARSTONE
try {
    const p = path.join(SOURCE_ROOT, 'caesarstone_data.jsonl');
    if (fs.existsSync(p)) {
        console.log("✅ Found Caesarstone JSONL");
        const line = fs.readFileSync(p, 'utf-8').split('\n')[0]; // Read first line
        const item = JSON.parse(line);
        console.log("   First Item Data:", JSON.stringify(item, null, 2));

        // Check Image
        const imgName = path.basename(item.image_path || item.image || "NO_IMAGE_FIELD");
        const imgPath = path.join(SOURCE_ROOT, 'caesarstone_images', imgName);
        console.log(`   Expected Image Path: ${imgPath}`);
        console.log(`   Does it exist? ${fs.existsSync(imgPath) ? "YES" : "NO"}`);
    } else {
        console.log("❌ Caesarstone JSONL NOT found");
    }
} catch (e) { console.log("Error checking Caesarstone:", e.message); }

console.log("\n------------------------------------------------\n");

// 2. CHECK GEMINI
try {
    const p = path.join(SOURCE_ROOT, 'gemini_data', 'products.json');
    if (fs.existsSync(p)) {
        console.log("✅ Found Gemini JSON");
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        const item = Array.isArray(data) ? data[0] : (data.products ? data.products[0] : null);

        if (item) {
            console.log("   First Item Data:", JSON.stringify(item, null, 2));
            const imgName = path.basename(item.image_url || item.image || "NO_IMAGE_FIELD");
            const imgPath = path.join(SOURCE_ROOT, 'gemini_data', imgName);
            console.log(`   Expected Image Path: ${imgPath}`);
            console.log(`   Does it exist? ${fs.existsSync(imgPath) ? "YES" : "NO"}`);
        } else {
            console.log("   JSON was found but structure is unexpected (empty?).");
        }
    } else {
        console.log("❌ Gemini JSON NOT found");
    }
} catch (e) { console.log("Error checking Gemini:", e.message); }

console.log("\n------------------------------------------------\n");

// 3. CHECK COSENTINO
try {
    const p = path.join(SOURCE_ROOT, 'cosentino_data', 'cosentino_products_raw.json');
    if (fs.existsSync(p)) {
        console.log("✅ Found Cosentino JSON");
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        const item = Array.isArray(data) ? data[0] : (data.products ? data.products[0] : null);

        if (item) {
            console.log("   First Item Data:", JSON.stringify(item, null, 2));
            const imgName = path.basename(item.image || "NO_IMAGE_FIELD");
            const imgPath = path.join(SOURCE_ROOT, 'cosentino_images', imgName);
            console.log(`   Expected Image Path: ${imgPath}`);
            console.log(`   Does it exist? ${fs.existsSync(imgPath) ? "YES" : "NO"}`);
        }
    } else {
        console.log("❌ Cosentino JSON NOT found");
    }
} catch (e) { console.log("Error checking Cosentino:", e.message); }