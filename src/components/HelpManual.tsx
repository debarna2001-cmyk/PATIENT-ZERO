import { Terminal, Lightbulb, AlertOctagon, Heart, BookOpen, Clock } from "lucide-react";

export default function HelpManual() {
  return (
    <div className="bg-slate-950 border border-white/5 rounded-xl p-6 shadow-lg flex flex-col gap-6 font-sans text-slate-300" id="manual-panel">
      {/* Immersive Header */}
      <div className="border-b border-white/5 pb-4 flex items-center gap-3">
        <Terminal className="w-6 h-6 text-red-500 animate-pulse" />
        <div>
          <h3 className="font-sans font-bold text-lg text-white">SYSTEM ENVELOPE: "PATIENT ZERO"</h3>
          <p className="font-mono text-xs text-slate-400">Tactical NEET PG Psychological Survival Protocol v2.4a</p>
        </div>
      </div>

      {/* Narrative block */}
      <div className="bg-black/40 border-l-4 border-red-500 p-4 rounded-r-lg font-mono text-xs flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-red-400 font-bold">
          <AlertOctagon className="w-4 h-4" /> RE: INCOMING SHIFT NOTIFICATION
        </div>
        <p className="leading-relaxed">
          "Resident, welcome to the night-shift containment unit. NEET PG is not just a test of cognitive memory—it is a psychological trial of clinical decision speed. 
          The patient vignettes before you are actual postgraduate exam matrices. Vitals fluctuate in real-time. 
          A single wrong drug dosage or tracheal delay will flatline the patient. Live under pressure. Survive your shift. Pass the entrance exam."
        </p>
      </div>

      {/* Key Features / Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-1 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400" /> Vitals & Dynamic Stress
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-xs">
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[1]</span>
              <span>Each clinical session begins with high-fidelity telemetry representing the shock index, temperature, or respiratory state.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[2]</span>
              <span>Answering correctly stabilizes the patient instantly. Click "AUDIO FEEDBACK" to hear the cardiac rhythm modulate as you work.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[3]</span>
              <span>Answering incorrectly triggers vital depletion. A second lapse flatlines the case completely.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-sm text-white border-b border-white/5 pb-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Study Rationale & MCQ Pearls
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-xs">
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[1]</span>
              <span>Every MCQ represents high-yield clinical facts. Standard textbooks (Harrison's Internal Medicine, Bailey & Love Surgery) provide the rigorous logic.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[2]</span>
              <span>If you commit a mistake, read the **Post-Rescue Evaluation**. It systematically explains why alternative options are incorrect, which is how top-rankers study.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[3]</span>
              <span>Unlock advanced cards in the **Formulary protocols** using your gathered Clinical XP to master difficult medical indices.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Golden Hour / Stress management */}
      <div className="border border-white/5 rounded-xl p-4 bg-slate-900/10 flex items-start gap-3.5 mt-2">
        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-sans font-bold text-white flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Golden Hour Compensatory Reserve
          </span>
          <p className="text-slate-400 leading-relaxed">
            The warning bar at the top of an active triage represents the patient's remaining circulatory stamina. If it drains to 0%, the patient flatlines automatically from obstruction or systemic shock. Active diagnosis is necessary under the golden hour limit.
          </p>
        </div>
      </div>
    </div>
  );
}
