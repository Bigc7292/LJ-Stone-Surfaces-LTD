import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { setupVite } from "../server/vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

// --- FIX FOR ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic Logging Middleware using standard console
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let resBody: any;

    const oldResJson = res.json;
    res.json = function (body) {
        resBody = body;
        return oldResJson.apply(res, arguments as any);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (resBody) {
                logLine += ` :: ${JSON.stringify(resBody)}`;
            }
            console.log(logLine);
        }
    });

    next();
});

(async () => {
    // We create a standard HTTP server to wrap Express
    const server = createServer(app);

    console.log("Starting server...");

    // ERROR FIX: Added 'server' as first argument to match function signature in server/routes.ts
    await registerRoutes(server, app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });

    if (app.get("env") === "development") {
        await setupVite(server, app);
    } else {
        // Note: If serveStatic is missing from vite.ts, 
        // we use standard express.static instead.
        app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
    }

    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`serving on port ${PORT}`);
    });
})();