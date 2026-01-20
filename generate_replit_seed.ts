import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const dataDir = path.join(process.cwd(), 'client', 'public', 'exported_replit_data');

// function to escape SQL strings
const escapeSql = (str: string) => {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''").replace(/\0/g, '') + "'";
};

async function processFile(filename: string, tableName: string, columnMapping: Record<string, string>) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filename} (not found)`);
        return;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers: string[] = [];
    let isHeader = true;
    let sqlStatements: string[] = [];

    console.log(`Processing ${filename}...`);

    for await (const line of rl) {
        if (isHeader) {
            // Simple split for headers, assuming no commas in headers
            headers = line.split(',').map(h => h.replace(/^"|"$/g, '').trim());
            isHeader = false;
            continue;
        }

        // CSV parsing logic (handling quoted fields)
        const row: string[] = [];
        let currentVal = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        row.push(currentVal);

        // Map values to columns
        const valuesObj: any = {};
        headers.forEach((h, i) => {
            if (columnMapping[h]) {
                valuesObj[columnMapping[h]] = row[i]?.replace(/^"|"$/g, '');
            }
        });

        // Construct INSERT
        const cols = Object.keys(valuesObj).join(', ');
        const vals = Object.values(valuesObj).map((v: any) => escapeSql(v)).join(', ');

        if (cols && vals) {
            sqlStatements.push(`INSERT INTO ${tableName} (${cols}) VALUES (${vals}) ON CONFLICT (id) DO NOTHING;`);
        }
    }

    const outputFile = `seed_${tableName}.sql`;
    fs.writeFileSync(outputFile, sqlStatements.join('\n'));
    console.log(`Created ${outputFile} with ${sqlStatements.length} records.`);
}

async function run() {
    // 1. Chat Logs
    await processFile('chat_logs.csv', 'chat_logs', {
        'id': 'id',
        'session_id': 'session_id',
        'user_message': 'user_message',
        'ai_response': 'ai_response',
        'created_at': 'created_at'
    });

    // 2. Visualizer Generations
    await processFile('visualizer_generations.csv', 'visualizer_generations', {
        'id': 'id',
        'original_image_url': 'original_image_url',
        'generated_image_url': 'generated_image_url',
        'stone_selected': 'stone_selected',
        'prompt_used': 'prompt_used',
        'markers': 'markers',
        'created_at': 'created_at'
    });
}

run().catch(console.error);
