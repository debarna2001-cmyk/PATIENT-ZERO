const fs = require('fs');

const filesToClean = [
  'src/App.tsx',
  'src/components/RewardStore.tsx',
  'src/components/MissionsPanel.tsx'
];

for (const file of filesToClean) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/ onPointerDown=\{[^}]+\}/g, '');
  fs.writeFileSync(file, content);
}
