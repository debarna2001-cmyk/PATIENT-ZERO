import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/patient_zero_/g, 'patient_zero_v2_');
fs.writeFileSync('src/App.tsx', content);
