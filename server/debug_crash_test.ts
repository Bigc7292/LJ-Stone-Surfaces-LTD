console.log("Testing dependencies...");
try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    console.log("GenAI imported");
    new GoogleGenerativeAI("test");
    console.log("GenAI instantiated");
} catch (e) { console.error("GenAI failed:", e); }

try {
    const { default: Groq } = await import("groq-sdk");
    console.log("Groq imported");
    new Groq({ apiKey: "test" });
    console.log("Groq instantiated");
} catch (e) { console.error("Groq failed:", e); }

export { };
