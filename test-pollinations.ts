import axios from "axios";

async function verifyPollinations() {
    console.log("--- Verifying AI Visualize (Pollinations.ai) ---");
    try {
        const response = await axios.post("http://localhost:5000/api/ai/visualize", {
            description: "A luxury kitchen with Calacatta Borghese marble countertops, gold faucets, and white oak cabinets."
        });
        console.log("Status:", response.status);
        console.log("Image URL received:", response.data.imageUrl ? "YES" : "NO");
        console.log("SUCCESS: AI Visualize works.");
    } catch (err: any) {
        console.error("FAILURE: AI Visualize failing:", err.message);
    }

    console.log("\n--- Verifying AI Re-Imager (Pollinations.ai) ---");
    try {
        // Simulate a base64 image
        const response = await axios.post("http://localhost:5000/api/ai/re-imager", {
            image: "data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            stoneType: "Calacatta Borghese"
        });
        console.log("Status:", response.status);
        console.log("Re-imaged URL received:", response.data.imageUrl ? "YES" : "NO");
        console.log("SUCCESS: AI Re-Imager works.");
    } catch (err: any) {
        console.error("FAILURE: AI Re-Imager failing:", err.message);
    }
}

verifyPollinations();
