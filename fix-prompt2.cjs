const fs = require('fs');

const filePath = 'c:\\Users\\toplo\\Desktop\\ai_stuff\\clients\\jack_davis_big_jack\\LJ-Stone-Surfaces-LTD\\server\\services\\grokService.ts';

let content = fs.readFileSync(filePath, 'utf8');

const oldText = `prompt = \`Edit this kitchen/room image: Replace all countertop surfaces and the backsplash with \${stoneName} \${stoneCategory}, characterized by its unique natural patterns, intricate veining, and realistic texture. Ensure the final result features a \${finishDescription}. Use a seamless, continuous slab style for the backsplash (no visible tile grout lines). Keep everything else exactly the same—cabinets, appliances, sink, window, walls, floor, lighting, and perspective. Photorealistic, high detail, matching original lighting and perspective. \${ambience} lighting tone. This is a premium \${stoneCategory} variety, so emphasize the high-end natural aesthetic.\`;`;

const newText = `prompt = \`EDIT THIS IMAGE: Replace all countertop surfaces AND backsplash with \${stoneName} (\${stoneCategory}). CRITICAL: MUST match the stone exactly - replicate its distinctive veining pattern, color palette, and natural texture. The stone has irregular branching veins, organic flowing lines, and characteristic \${finishDescription}. Use a seamless slab style for backsplash (no tiles). Keep EVERYTHING else identical: cabinets, appliances, sink, window, walls, floor, lighting, perspective. Photorealistic, high detail.\`;`;

content = content.replace(oldText, newText);

fs.writeFileSync(filePath, content);
console.log('Updated fallback prompt');
