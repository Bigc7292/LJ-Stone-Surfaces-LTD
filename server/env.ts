import dotenv from "dotenv";
import path from "path";

// Load .env.local first
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// Load .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
