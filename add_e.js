import fs from 'fs';

let code = fs.readFileSync('src/fallbackCases.ts', 'utf8');
code = code.replace(/D: ".*?"/g, match => match + ',\n      E: "Wait and observe without intervention"');
fs.writeFileSync('src/fallbackCases.ts', code);
