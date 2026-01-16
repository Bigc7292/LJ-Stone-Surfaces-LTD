
import pg from 'pg';
import 'dotenv/config';

// Manually loading .env.local if not loaded by dotenv (dotenv usually loads .env)
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        const [key, val] = line.split('=');
        if (key && val && !process.env[key]) {
            process.env[key.trim()] = val.trim();
        }
    });
}

const { Pool } = pg;

async function testConnection() {
    console.log("Testing Database Connection (Standard String)...");

    // Method 1: Connection String
    try {
        const pool1 = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        const client1 = await pool1.connect();
        console.log("✅ Connection String worked!");
        client1.release();
        await pool1.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection String Failed:", err.message);
    }

    console.log("Testing Database Connection (Explicit Params)...");
    // Method 2: Explicit Params
    try {
        const pool2 = new Pool({
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: Number(process.env.PGPORT),
            ssl: { rejectUnauthorized: false }
        });
        const client2 = await pool2.connect();
        console.log("✅ Explicit Params worked!");
        client2.release();
        await pool2.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Explicit Params Failed:", err.message);
        console.error("FATAL: Both methods failed. Credentials are likely invalid.");
        process.exit(1);
    }
}

testConnection();
