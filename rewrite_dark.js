import fs from 'fs';
import path from 'path';

function addDarkClasses(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  const rules = [
    [/\btext-slate-900(?!\s*dark:text-)\b/g, 'text-slate-900 dark:text-slate-100'],
    [/\btext-slate-800(?!\s*dark:text-)\b/g, 'text-slate-800 dark:text-slate-200'],
    [/\btext-slate-700(?!\s*dark:text-)\b/g, 'text-slate-700 dark:text-slate-300'],
    [/\btext-slate-600(?!\s*dark:text-)\b/g, 'text-slate-600 dark:text-slate-400'],
    
    [/\bbg-white(?!\s*dark:bg-)\b/g, 'bg-white dark:bg-slate-900'],
    [/\bbg-slate-50(?!\s*dark:bg-)\b/g, 'bg-slate-50 dark:bg-slate-950/50'],
    [/\bbg-slate-100(?!\s*dark:bg-)\b/g, 'bg-slate-100 dark:bg-slate-800/50'],
  
    [/\bborder-slate-200(?!\s*dark:border-)\b/g, 'border-slate-200 dark:border-slate-800'],
    [/\bborder-slate-300(?!\s*dark:border-)\b/g, 'border-slate-300 dark:border-slate-700'],
  ];

  for (const [regex, replacement] of rules) {
     content = content.replace(regex, replacement);
  }

  // Cleanup duplicates that might have sneaked in
  content = content.replace(/dark:text-slate-100\s*dark:text-slate-100/g, 'dark:text-slate-100');
  content = content.replace(/dark:bg-slate-900\s*dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:bg-slate-950\/50\s*dark:bg-slate-950\/50/g, 'dark:bg-slate-950/50');
  content = content.replace(/dark:border-slate-800\s*dark:border-slate-800/g, 'dark:border-slate-800');

  fs.writeFileSync(file, content);
}

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));
files.push('src/App.tsx');
files.forEach(addDarkClasses);
