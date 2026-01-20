import * as fs from 'fs';
import * as path from 'path';

const inputFile = 'seed_visualizer_generations.sql';
const content = fs.readFileSync(inputFile, 'utf-8');

// The file contains INSERT statements separated by newlines
const lines = content.split('\n').filter(line => line.trim().length > 0);

console.log(`Found ${lines.length} insert statements.`);

lines.forEach((line, index) => {
    const chunkFile = `seed_vis_rec_${index + 1}.sql`;
    fs.writeFileSync(chunkFile, line);
    console.log(`Created ${chunkFile} (${(line.length / 1024 / 1024).toFixed(2)} MB)`);
});
