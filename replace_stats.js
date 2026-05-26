import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// We simply want to convert:
// setStats((prev) => {
//    ...
//    localStorage.setItem("patient_zero_v2_stats", JSON.stringify(next));
//    return next;
// });
// To modifyStats(...) but without the localStorage line.

content = content.replace(/setStats\(\(prev(\s*:\s*[A-Za-z]+)?\)\s*=>\s*{/g, "modifyStats((prev) => {");
content = content.replace(/localStorage\.setItem\("patient_zero_v2_stats",\s*JSON\.stringify\(next\)\);/g, "");

fs.writeFileSync('src/App.tsx', content);
