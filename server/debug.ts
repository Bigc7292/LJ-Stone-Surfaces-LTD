import "./env";
console.log("Imported env");
import express from "express";
console.log("Imported express");
import { registerRoutes } from "./routes";
console.log("Imported routes");
import { serveStatic } from "./static";
console.log("Imported static");
import { createServer } from "http";
console.log("Imported http");

const app = express();
const httpServer = createServer(app);

(async () => {
    try {
        console.log("Calling registerRoutes...");
        await registerRoutes(httpServer, app);
        console.log("registerRoutes done");
    } catch (e) {
        console.error("Debug caught error:", e);
    }
})();
