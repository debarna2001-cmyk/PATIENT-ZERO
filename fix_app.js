const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/  const timerRef = useRef<number \| null>\(null\);\n/, '');

app = app.replace(/  useEffect\(\(\) => \{\n    if \(typeof currentCase[\s\S]*?\}, \[currentCase, vitalStatus, revealed, activeTab\]\);\n/, '');
// actually I'm just gonna use generic start/end string replaces to be safe

let startIdx = app.indexOf('  const startTriageSession = async');
let endIdx = app.indexOf('  const handleClearLogs = () => {');
if (startIdx !== -1 && endIdx !== -1) {
    app = app.substring(0, startIdx) + app.substring(endIdx);
}

startIdx = app.indexOf('{activeTab === "triage" && (');
endIdx = app.indexOf('{activeTab === "progress" && (');
if (startIdx !== -1 && endIdx !== -1) {
    let before = app.substring(0, startIdx);
    let after = app.substring(endIdx);
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

app = app.replace(/import VitalsMonitor from "\.\/components\/VitalsMonitor";/, `import VitalsMonitor from "./components/VitalsMonitor";\nimport TriageSession from "./components/TriageSession";`);

fs.writeFileSync('src/App.tsx', app);
