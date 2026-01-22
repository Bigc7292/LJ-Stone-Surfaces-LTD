---
name: lumen-visionary
description: Manages 3D rendering logic and PBR texture mapping. Use when updating the Visualizer or applying new stone textures.
---

# Lumen Visionary Skill

## Goal
To achieve photo-realism in the web visualizer by correctly mapping physically-based materials.

## Implementation Steps
1. **Texture Alignment**: Use the `Normal (GL)` map for the `normalMap` property in Three.js to ensure light bounces correctly.
2. **Shine Control**: Map the `Roughness` texture to the `roughness` property. Lower values (0.1) for polished quartz; higher values (0.7) for honed limestone.
3. **Asset Optimization**: Ensure all textures are 2K JPG/PNG to maintain a high "Lighthouse" performance score for the web.

## Resources
- Refer to `resources/pbr_standards.json` for specific refractive indices of Marble vs. Quartz.