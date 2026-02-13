
import { db } from "./server/db";
import { products, portfolio_gallery } from "./shared/schema";

async function check() {
    console.log("--- Sample Products ---");
    const sampleProducts = await db.select().from(products).limit(5);
    sampleProducts.forEach(p => console.log(`[${p.category}] ${p.name} -> ${p.imageUrl}`));

    console.log("\n--- Sample Portfolio ---");
    const samplePortfolio = await db.select().from(portfolio_gallery).limit(5);
    samplePortfolio.forEach(p => console.log(`[${p.category}] ${p.title} -> ${p.imageUrl}`));

    process.exit(0);
}

check();
