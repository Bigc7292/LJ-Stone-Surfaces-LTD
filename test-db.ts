
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

console.log('Testing connection to:', connectionString ? 'URL Found' : 'URL Missing');
if (connectionString) {
    // Hide password in logs
    console.log('Host:', connectionString.split('@')[1]);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Try with loose SSL first
});

async function test() {
    try {
        const client = await pool.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error('Connection failed:', err.message);
        console.error('Code:', err.code);
        if (err.cause) console.error('Cause:', err.cause);
    } finally {
        await pool.end();
    }
}

test();
