
import "dotenv/config";
import pg from 'pg';

const { Pool } = pg;

// We need to read .env.local manually because dotenv/config usually reads .env
// But let's assume the user runs this with the env vars set or we stick them in
// Actually, let's hardcode the URL from .env.local for this test to be sure
// Neon Connection
const connectionString = "postgresql://neondb_owner:npg_mUrkQ3iDvuN9@ep-ancient-night-agun8qbt.c-2.eu-central-1.aws.neon.tech:5432/neondb?sslmode=require";

async function testDB() {
    console.log("Testing connection to:", connectionString.replace(/:[^:]*@/, ':****@')); // Hide password

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log("✅ Client connected!");

        try {
            console.log("Running SELECT 1...");
            const res = await client.query('SELECT 1');
            console.log("✅ Query Result:", res.rows[0]);
        } catch (qErr) {
            console.error("❌ Query Failed:", qErr);
        } finally {
            client.release();
        }

        // Test the products query that failed
        const client2 = await pool.connect();
        try {
            console.log("Running SELECT * FROM products LIMIT 1...");
            const res = await client2.query('SELECT * FROM products LIMIT 1');
            console.log("✅ Products Query Result:", res.rows.length, "rows");
        } catch (qErr) {
            console.error("❌ Products Query Failed:", qErr);
        } finally {
            client2.release();
        }

    } catch (err) {
        console.error("❌ Connection Failed:", err);
    } finally {
        await pool.end();
    }
}

testDB();
