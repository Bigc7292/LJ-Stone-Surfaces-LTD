# Bulk Testing Phase: Implementation Guide

You are about to test the system across 20+ different kitchen and bathroom environments. To get the most consistent results from the Surgical AI Engine, please follow this guide.

## 🎯 Testing Objectives
1.  **Verify Room Preservation**: Ensure cabinets, floors, and appliances remain 100% identical.
2.  **Verify Stone Mapping**: Check if the stone correctly follows the contours of islands, backsplashes, and sinks.
3.  **Verify Cinematic Continuity**: Ensure the dual walkthrough videos (Clockwise/CCW) correctly follow the edited image's lighting and material.

## 🛠️ Test Case Checklist
Aim for a diverse range of inputs:
- [ ] **Complex Layouts**: Kitchens with islands + separate counters.
- [ ] **Multi-Surface**: Bathrooms with floor-to-ceiling stone walls + bathtubs.
- [ ] **Extreme Lighting**: Direct sunlight glares vs. dim ambient LED backlighting.
- [ ] **Occlusion**: Images with objects (toasters, plants, tools) on the countertops.
- [ ] **Material Variety**: Test at least 5 different stone types from the catalogue.

## 🔍 What to Look For (Visual Audit)
- **Sharp Edges**: Does the stone meet the floor or cabinets with a clean, crisp line?
- **Lighting Accuracy**: Does the stone material reflect the real windows or ceiling lights in the room?
- **Hallucinations**: Did the AI accidentally change a door handle or a floor tile color? (Should be 0% change).

## 📝 Reporting Issues
If a specific room fails:
1.  **Save the Input Image**.
2.  **Note the Material/Color used**.
3.  **Describe the Error**: (e.g., "AI changed the cabinet color", "Veins look blurry").

This system is built for surgical precision. Your 20-case stress test will help us fine-tune the final prompt weighting.
