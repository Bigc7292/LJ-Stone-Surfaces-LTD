
import { db } from "./server/db";
import { products, portfolio_gallery } from "./shared/schema";
import * as fs from "fs/promises";
import { join, basename, extname } from "path";
import { sql } from "drizzle-orm";

// --- Configuration ---
const JSONL_FILES = [
    { name: "Metadata", path: "fine_tuning_data/metadata.jsonl" },
    { name: "Caesarstone", path: "fine_tuning_data/caesarstone_data.jsonl" },
    { name: "Gemini Training", path: "data_science/gemini_training_data.jsonl" }
];

const TEXTURE_DIR = "client/public/textures";
const PORTFOLIO_DIR = "data_science/training_hub/public/portfolio_images";

// --- Utilities ---
function cleanStoneName(name: string): string {
    let n = basename(name, extname(name));
    n = n.replace(/(_|-)2K(-JPG|-PNG)?/gi, '');
    n = n.replace(/(_|-)(Polished|Honed|Leathered|Color|Diffuse|Albedo|BaseColor|Base_Color|Roughness|Normal|Height|Metallic|AmbientOcclusion)/gi, '');
    n = n.replace(/(_|-)\(US\)|\(CAN-or-US\)/gi, '');
    n = n.replace(/\(1\)/g, '');
    n = n.replace(/_/g, ' ').replace(/-/g, ' ');
    // Handle camelCase or concatenated names if necessary
    return n.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').trim();
}

function detectCategory(path: string, name: string): string {
    const p = (path + name).toLowerCase();
    if (p.includes('marble')) return 'Marble';
    if (p.includes('quartz')) return 'Quartz';
    if (p.includes('granite')) return 'Granite';
    if (p.includes('dekton')) return 'Dekton';
    if (p.includes('porcelain')) return 'Porcelain';
    if (p.includes('limestone')) return 'Limestone';
    if (p.includes('travertine')) return 'Travertine';
    return 'Other';
}

function isPBRMap(fileName: string): boolean {
    const tech_keywords = ['Normal', 'Rough', 'Displacement', 'Ambient', 'AO', 'Metallic', 'Specular', 'Reflection', 'Height', 'BaseColor', 'Base_Color'];
    const lowerName = fileName.toLowerCase();
    // Special case for 'Color' or 'Diffuse' which are often the main texture
    const main_texture_keywords = ['Color', 'Diffuse', 'Albedo'];

    if (tech_keywords.some(tk => fileName.includes(tk))) return true;

    // If it's JUST 'Color' in a subfolder, it's likely a PBR map and we prefer a more descriptive name
    if (main_texture_keywords.some(mk => lowerName === mk.toLowerCase() || lowerName === `${mk.toLowerCase()}.jpg`)) {
        return true;
    }

    return false;
}

async function sync() {
    console.log("🚀 Starting MASTER Stone & Portfolio Sync...");

    // 0. RESET TABLES (Crucial for a clean, non-redundant state)
    console.log("Purging existing data to handle table consolidation...");
    await db.execute(sql`TRUNCATE TABLE products RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE portfolio_gallery RESTART IDENTITY CASCADE`);
    // Empty stone_library since we are moving to products
    try {
        await db.execute(sql`TRUNCATE TABLE stone_library RESTART IDENTITY CASCADE`);
    } catch (e) { }

    let stoneCount = 0;
    let portfolioCount = 0;

    // 1. Process JSONL Files (Metadata + AI Training Data)
    for (const fileInfo of JSONL_FILES) {
        console.log(`Processing ${fileInfo.name}...`);
        try {
            const content = await fs.readFile(fileInfo.path, 'utf-8');
            const lines = content.trim().split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;
                const data = JSON.parse(line);
                const fileName = (data.file_name || data.image || "").replace(/\\/g, '/');
                const originalText = data.text || "";

                if (!fileName) continue;

                // STRICT ROUTING
                const isWhatsApp = fileName.toLowerCase().includes('whatsapp');

                if (isWhatsApp) {
                    // Portfolio Item
                    const title = originalText || cleanStoneName(fileName);
                    const imageUrl = fileName.includes('portfolio_images')
                        ? `/portfolio_images/${basename(fileName)}`
                        : `/attached_assets/${basename(fileName)}`;

                    await db.insert(portfolio_gallery).values({
                        imageUrl,
                        title: title.length > 100 ? title.substring(0, 97) + '...' : title,
                        category: 'Recent Project'
                    }).onConflictDoNothing();
                    portfolioCount++;
                } else {
                    // Stone Item
                    if (isPBRMap(fileName)) continue;

                    const name = cleanStoneName(fileName);
                    const category = detectCategory(fileName, name);

                    let imageUrl = fileName;
                    if (imageUrl.includes('quartz_images/')) imageUrl = `/textures/quartz/${basename(imageUrl)}`;
                    else if (imageUrl.includes('marble_images/')) imageUrl = `/textures/marble/${basename(imageUrl)}`;
                    else if (imageUrl.includes('granite_images/')) imageUrl = `/textures/granite/${basename(imageUrl)}`;
                    else if (!imageUrl.startsWith('/')) imageUrl = `/textures/${category.toLowerCase()}/${basename(imageUrl)}`;

                    await db.insert(products).values({
                        name: name.length > 50 ? name.substring(0, 47) + '...' : name,
                        category,
                        description: originalText || `${category} stone with a premium finish.`,
                        imageUrl,
                        isFeatured: Math.random() > 0.98
                    }).onConflictDoNothing();
                    stoneCount++;
                }
            }
        } catch (err: any) {
            console.warn(`Could not process ${fileInfo.name}: ${err.message}`);
        }
    }

    // 2. Scan Textures Folder (Physical texture assets)
    async function scanStones(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name).replace(/\\/g, '/');
            if (entry.isDirectory()) {
                await scanStones(fullPath);
            } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {

                const isWhatsApp = fullPath.toLowerCase().includes('whatsapp');
                if (isWhatsApp) {
                    await db.insert(portfolio_gallery).values({
                        imageUrl: fullPath.split('client/public')[1] || fullPath,
                        title: cleanStoneName(entry.name),
                        category: 'Completed Projects'
                    }).onConflictDoNothing();
                    portfolioCount++;
                    continue;
                }

                if (isPBRMap(entry.name)) continue;

                const name = cleanStoneName(entry.name);
                const category = detectCategory(fullPath, name);
                const relativePath = fullPath.split('client/public')[1] || fullPath;

                await db.insert(products).values({
                    name: name.length > 50 ? name.substring(0, 47) + '...' : name,
                    category,
                    description: `${category} stone available for installation.`,
                    imageUrl: relativePath,
                    isFeatured: false
                }).onConflictDoNothing();
                stoneCount++;
            }
        }
    }
    console.log("Scanning textures directory for physical assets...");
    await scanStones(TEXTURE_DIR);

    // 3. Scan Portfolio folder (Project images)
    try {
        const portFiles = await fs.readdir(PORTFOLIO_DIR);
        for (const file of portFiles) {
            if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                await db.insert(portfolio_gallery).values({
                    imageUrl: `/portfolio_images/${file}`,
                    title: cleanStoneName(file),
                    category: 'Completed Work'
                }).onConflictDoNothing();
                portfolioCount++;
            }
        }
    } catch (e) { }

    console.log(`\n✅ UNIFIED SYNC COMPLETE!`);
    console.log(`Stone Products: ${stoneCount}`);
    console.log(`Portfolio Projects: ${portfolioCount}`);
    console.log(`\nNote: products and stone_library are now synchronized into 'products'.`);
    process.exit(0);
}

sync();
