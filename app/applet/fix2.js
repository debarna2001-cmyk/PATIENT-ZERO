const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/  const timerRef = useRef<number \| null>\(null\);\n/, '');

// Delete the effect
app = app.replace(/  useEffect\(\(\) => \{\n    if \(currentCase[\s\S]*?\}, \[currentCase, vitalStatus, revealed, activeTab\]\);\n/, '');

// Delete the functions
const startIdx = app.indexOf('  const startTriageSession = async () => {');
const endIdx = app.indexOf('  const handleClearLogs = () => {');
if (startIdx !== -1 && endIdx !== -1) {
  app = app.substring(0, startIdx) + app.substring(endIdx);
}

// Replace the triage JSX segment
const startJsx = app.indexOf('{activeTab === "triage" && (');
const endJsx = app.indexOf('{activeTab === "progress" && (');
if (startJsx !== -1 && endJsx !== -1) {
    let before = app.substring(0, startJsx);
    let after = app.substring(endJsx);
    app = before + 
`          {activeTab === "triage" && (
            <TriageSession
              stats={stats}
              missions={missions}
              logs={logs}
              modifyStats={modifyStats}
              updateLogs={updateLogs}
              logActivity={logActivity}
              handleUpdateMissionProgress={handleUpdateMissionProgress}
              spawnParticles={spawnParticles}
              onExit={() => setActiveTab("dashboard")}
            />
          )}\n\n          ` + after;
}

// Add import
app = app.replace(/import VitalsMonitor from "\.\/components\/VitalsMonitor";/, `import VitalsMonitor from "./components/VitalsMonitor";\nimport TriageSession from "./components/TriageSession";`);

fs.writeFileSync('src/App.tsx', app);
