import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'client', 'public', 'exported_replit_data', 'visualizer_generations.csv');
const buffer = Buffer.alloc(500);
const fd = fs.openSync(filePath, 'r');
fs.readSync(fd, buffer, 0, 500, 0);
fs.closeSync(fd);

console.log(JSON.stringify(buffer.toString('utf-8')));
