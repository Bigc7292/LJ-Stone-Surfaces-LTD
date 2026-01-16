const fs = require('fs');
const path = require('path');

// CONFIGURATION
const STONES_DIR = path.join(__dirname, 'client/public/stones');
const LIBRARY_FILE = path.join(__dirname, 'client/src/data/stoneLibrary.json');
const MIN_SIZE_KB = 15; // Any image smaller than 15KB is considered "Fake/White"

function cleanLibrary() {
    console.log("🪨  Starting Stone Library Cleanup...");

    if (!fs.existsSync(STONES_DIR)) {
        console.error("❌ Error: Stones directory not found at", STONES_DIR);
        return;
    }

    // 1. Identify and Delete Small Files
    const files = fs.readdirSync(STONES_DIR);
    let deletedCount = 0;
    const deletedFiles = new Set();

    console.log(`🔍 Scanning ${files.length} images for bad files (<${MIN_SIZE_KB}KB)...`);

    files.forEach(file => {
        const filePath = path.join(STONES_DIR, file);
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInKilobytes = fileSizeInBytes / 1024;

        // Check if it's an image and too small
        if ((file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) && fileSizeInKilobytes < MIN_SIZE_KB) {
            try {
                fs.unlinkSync(filePath); // DELETE THE FILE
                deletedFiles.add(file);
                deletedCount++;
                // console.log(`   🗑️  Deleted fake image: ${file} (${fileSizeInKilobytes.toFixed(2)} KB)`);
            } catch (err) {
                console.error(`   ⚠️  Failed to delete ${file}:`, err.message);
            }
        }
    });

    console.log(`✅ Deleted ${deletedCount} bad images.`);

    // 2. Clean up the JSON Library
    console.log("🧹 Cleaning stoneLibrary.json...");

    let libraryData = [];
    try {
        const rawData = fs.readFileSync(LIBRARY_FILE, 'utf8');
        libraryData = JSON.parse(rawData);
    } catch (err) {
        console.error("❌ Error reading library file:", err.message);
        return;
    }

    const originalCount = libraryData.length;

    // Filter out items whose images were deleted OR look like duplicates
    const cleanLibrary = libraryData.filter(item => {
        // Extract filename from URL (e.g., "/stones/abc.jpg" -> "abc.jpg")
        const filename = item.swatchUrl.split('/').pop();

        // If file was deleted, remove from JSON
        if (deletedFiles.has(filename)) return false;

        // Also check if file actually exists (double check)
        const fullPath = path.join(STONES_DIR, decodeURIComponent(filename));
        if (!fs.existsSync(fullPath)) return false;

        return true;
    });

    // 3. Save the Clean JSON
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(cleanLibrary, null, 2));

    console.log("------------------------------------------------");
    console.log(`🎉 Cleanup Complete!`);
    console.log(`   - Bad Images Deleted: ${deletedCount}`);
    console.log(`   - Library Entries Removed: ${originalCount - cleanLibrary.length}`);
    console.log(`   - Valid Stones Remaining: ${cleanLibrary.length}`);
    console.log("------------------------------------------------");
    console.log("👉 Now run: git add . && git commit -m 'Removed broken stones' && git push origin main --force");
}

cleanLibrary();