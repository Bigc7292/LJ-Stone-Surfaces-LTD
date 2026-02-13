
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function compareTables() {
    console.log("🚀 Comparing stone_library and products...");
    try {
        const stoneLibResult = await db.execute(sql`SELECT count(*) FROM stone_library`);
        const productsResult = await db.execute(sql`SELECT count(*) FROM products`);

        console.log(`stone_library count: ${stoneLibResult.rows[0].count}`);
        console.log(`products count: ${productsResult.rows[0].count}`);

        console.log("\n--- stone_library sample ---");
        const slSample = await db.execute(sql`SELECT * FROM stone_library LIMIT 3`);
        console.log(slSample.rows);

        console.log("\n--- products sample ---");
        const pSample = await db.execute(sql`SELECT * FROM products LIMIT 3`);
        console.log(pSample.rows);

    } catch (err) {
        console.error("Comparison failed:", err.message);
    }
    process.exit(0);
}

compareTables();
