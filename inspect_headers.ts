import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'client', 'public', 'exported_replit_data');
const files = ['visualizer_generations.csv', 'chat_logs.csv', 'products.csv'];

files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`\n--- Headers for ${file} ---`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const firstLine = content.split('\n')[0];
        console.log(firstLine);
    } else {
        console.log(`\nFile ${file} not found.`);
    }
});
