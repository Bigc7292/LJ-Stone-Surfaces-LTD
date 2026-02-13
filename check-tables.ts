
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkTables() {
    console.log("🚀 Checking Database Tables...");
    try {
        const result = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables found:", result.rows.map(r => r.table_name));
    } catch (err) {
        console.error("Failed to list tables:", err.message);
    }
    process.exit(0);
}

checkTables();
