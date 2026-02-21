const fs = require('fs');

const filePath = 'c:\\Users\\toplo\\Desktop\\ai_stuff\\clients\\jack_davis_big_jack\\LJ-Stone-Surfaces-LTD\\server\\services\\grokService.ts';

let content = fs.readFileSync(filePath, 'utf8');

const oldText = `.replace('{stoneDescription}', \`\${stoneCategory} with \${finishDescription}\`);`;

const newText = `.replace('{stoneDescription}', \`\${stoneCategory} - MUST match EXACTLY: light grey base with dark grey veins, irregular ice-like branching veining pattern, organic non-repeating lines, natural marble texture. \${finishDescription}\`);`;

content = content.replace(oldText, newText);

fs.writeFileSync(filePath, content);
console.log('Updated grokService.ts');
