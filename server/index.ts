import "dotenv/config";
import "./env"; // Ensure .env.local is loaded
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite"; // Removed serveStatic/log as they caused errors
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

// --- FIX FOR ES MODULES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

    // ERROR FIX (2554): Added 'server' as second argument
    // ERROR FIX (2345): 'server' is now a real HTTP Server, not just 'app'
    await registerRoutes(server, app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });

    if (app.get("env") === "development") {
        // Serve data_science and attached_assets in development as well
        app.use("/data_science", express.static(path.resolve(__dirname, "..", "data_science")));
        app.use("/attached_assets", express.static(path.resolve(__dirname, "..", "attached_assets")));
        await setupVite(server, app);
    } else {
        // Note: If serveStatic is missing from vite.ts, 
        // we use standard express.static instead.
        app.use("/data_science", express.static(path.resolve(__dirname, "..", "data_science")));
        app.use("/attached_assets", express.static(path.resolve(__dirname, "..", "attached_assets")));
        app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));
    }

    const PORT = Number(process.env.PORT) || 3010;
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`serving on port ${PORT}`);
    });
})();