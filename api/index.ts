import express from 'express';
import { registerRoutes } from '../server/routes';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

// Basic middleware needed for the app
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: false }));

// Initialize routes lazily
let readyPromise: Promise<any> | null = null;

async function bootstrap() {
    if (!readyPromise) {
        // We import routes from server/routes which attaches them to 'app'
        readyPromise = registerRoutes(server, app).catch(err => {
            console.error("Failed to register routes:", err);
            // Reset promise so we retry on next request
            readyPromise = null;
            throw err;
        });
    }
    await readyPromise;
}

export default async function handler(req: any, res: any) {
    try {
        await bootstrap();
        // Forward the request to Express
        app(req, res);
    } catch (error: any) {
        console.error("API Handler Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
