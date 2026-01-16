/* Run this with: node checkFilenames.cjs */
const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.join(__dirname, 'fine_tuning_data');

function inspectFolder(folderName) {
    console.log(`\n--- INSPECTING: ${folderName} ---`);
    const dirPath = path.join(SOURCE_ROOT, folderName);

    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log(`Total files found: ${files.length}`);
        console.log("First 5 filenames:");
        files.slice(0, 5).forEach(f => console.log(`   - ${f}`));
    } else {
        console.log(`❌ Folder not found: ${dirPath}`);
    }
}

inspectFolder('caesarstone_images');
inspectFolder('gemini_data');
inspectFolder('cosentino_images');