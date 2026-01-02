
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// --- CONFIGURATION ---
const API_KEY = "I have the API key";
const METADATA_FILE = 'portfolio_metadata.json';
const IMAGE_DIR = 'portfolio_images/portfolio';
const PROMPT = "Describe this image of a kitchen or bathroom. Focus on the type of stone used for the countertops or surfaces, its color, and the overall style of the room (e.g., modern, traditional, minimalist).";
const DELAY_MS = 1000; // 1-second delay between requests
const SAVE_INTERVAL = 10; // Save progress every 10 images

// --- SCRIPT ---

const genAI = new GoogleGenerativeAI(API_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function fileToGenerativePart(filePath) {
    const fileData = fs.readFileSync(filePath);
    return {
        inlineData: {
            data: fileData.toString("base64"),
            mimeType: "image/jpeg",
        },
    };
}

function saveMetadata(metadata) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 4));
}

async function generateDescriptions() {
    console.log("Starting description generation with rate limiting and periodic saving...");

    try {
        let metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        for (const [index, item] of metadata.entries()) {
            const imageNumber = index + 1;
            const imagePath = path.join(IMAGE_DIR, item.filename);

            if (fs.existsSync(imagePath)) {
                console.log(`Processing ${item.filename} (${imageNumber} of ${metadata.length})...`);

                try {
                    const imagePart = fileToGenerativePart(imagePath);
                    const result = await model.generateContent([PROMPT, imagePart]);
                    const response = await result.response;
                    const description = await response.text();

                    item.description = description.trim();
                    console.log(`   -> Generated description: ${item.description.substring(0, 80)}...`);

                } catch (error) {
                    console.error(`   -> Error processing ${item.filename}:`, error.message);
                    item.description = "Error generating description.";
                }

            } else {
                console.warn(`   -> Image not found: ${item.filename}`);
                item.description = "Image file not found.";
            }
            
            // Save progress periodically
            if (imageNumber % SAVE_INTERVAL === 0 && imageNumber < metadata.length) {
                console.log(`\n--- Saving progress (${imageNumber} images processed) ---\n`);
                saveMetadata(metadata);
            }

            // Wait before the next request
            if (imageNumber < metadata.length) {
                await sleep(DELAY_MS);
            }
        }

        // Final save
        saveMetadata(metadata);
        console.log(`\nSuccessfully updated ${METADATA_FILE} with all generated descriptions!`);

    } catch (error) {
        console.error("\nAn error occurred during the process:", error);
    }
}

generateDescriptions();
