<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1p6t6B1HKFsS4qR_0oXiKHatJzzoutqjJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
   Milestone: Multi-Perspective Spatial Engine Integration

UI Upgrade: Transitioned LuxeStoneVisualizer.tsx to handle Dual-Perspective uploads (Angle 1 & Angle 2).

Texture Reference: Added dedicated Slab Reference slot to pipe high-fidelity catalog textures directly to the AI.

Service Logic: Upgraded aiService.ts to utilize Gemini 2.0/2.5 Flash Multi-Image payload.

Data Flow: Updated routes.ts to support 50MB payloads for high-resolution stereo-image processing.

Goal: Move from "flat stickers" to "spatial 3D wrapping" of stone materials.
