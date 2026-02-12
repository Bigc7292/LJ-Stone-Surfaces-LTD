import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "../shared/schema";
import "dotenv/config"; // Ensures env vars are loaded

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Please check your .env.local file.");
}

// We use the Pool configuration to handle connection drops
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/Neon connections
  }
});

export const db = drizzle(pool, { schema });
