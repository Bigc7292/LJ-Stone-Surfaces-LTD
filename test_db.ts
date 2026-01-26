import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

(async () => {
    try {
        console.log("Testing database connection...");
        const result = await db.execute(sql`SELECT 1`);
        console.log("Connection successful:", result);
    } catch (error) {
        console.error("Connection failed:", error);
    }
})();
