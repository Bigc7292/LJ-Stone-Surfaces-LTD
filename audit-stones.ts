
import { db } from "./server/db";
import { products, portfolio_gallery } from "./shared/schema";
import * as fs from "fs/promises";
import { join } from "path";
import { sql } from "drizzle-orm";

async function auditStones() {
    console.log("--- Stone Audit Report ---");

    // 1. Database Count
    try {
        const dbCountResult = await db.select({ count: sql`count(*)` }).from(products);
        console.log(`Database (products table): ${dbCountResult[0].count} records`);

        const portCountResult = await db.select({ count: sql`count(*)` }).from(portfolio_gallery);
        console.log(`Database (portfolio_gallery table): ${portCountResult[0].count} records`);
    } catch (err) {
        console.error("Database Count Failed:", err.message);
    }

    // 2. Local File Counts
    async function countLines(filePath: string): Promise<number> {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return content.trim().split("\n").filter(line => line.trim()).length;
        } catch (e) {
            return 0;
        }
    }

    const filesToAudit = [
        { name: "fine_tuning_data/metadata.jsonl", path: join("fine_tuning_data", "metadata.jsonl") },
        { name: "fine_tuning_data/caesarstone_data.jsonl", path: join("fine_tuning_data", "caesarstone_data.jsonl") },
        { name: "data_science/gemini_training_data.jsonl", path: join("data_science", "gemini_training_data.jsonl") }
    ];

    for (const file of filesToAudit) {
        const count = await countLines(file.path);
        console.log(`Local (${file.name}): ${count} entries`);
    }

    // 3. stoneLibrary.json
    try {
        const stoneLibrary = JSON.parse(await fs.readFile(join("client", "src", "data", "stoneLibrary.json"), "utf-8"));
        console.log(`Local (stoneLibrary.json): ${stoneLibrary.length} entries`);
    } catch (e) {
        console.error("stoneLibrary.json missing or invalid");
    }

    // 4. textures directory audit
    async function getFileCount(dir: string): Promise<number> {
        try {
            let count = 0;
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    count += await getFileCount(join(dir, entry.name));
                } else if (entry.isFile() && /\.(jpg|jpeg|png|webp|webp)$/i.test(entry.name)) {
                    count++;
                }
            }
            return count;
        } catch (e) {
            return 0;
        }
    }

    const texturesCount = await getFileCount(join("client", "public", "textures"));
    console.log(`Textures Directory (client/public/textures): ${texturesCount} images`);

    const stonesCount = await getFileCount(join("client", "public", "stones"));
    console.log(`Stones Directory (client/public/stones): ${stonesCount} images`);

    process.exit(0);
}

auditStones();
