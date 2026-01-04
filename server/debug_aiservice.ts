import "./env";
import { AIService } from "./services/aiService";

(async () => {
    try {
        console.log("Calling performInpainting...");
        await AIService.performInpainting({
            imagePath: "dummy",
            stoneType: "marble",
            prompt: "test",
            markers: []
        });
        console.log("performInpainting done (or failed gracefully)");
    } catch (e) {
        console.error("Caught error:", e);
    }
})();
