import { Terminal, Lightbulb, Heart, BookOpen, Clock, ShieldCheck, Activity } from "lucide-react";

export default function HelpManual() {
  return (
    <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 md:p-8 shadow-lg flex flex-col gap-6 font-sans text-slate-300" id="manual-panel">
      {/* Immersive Header */}
      <div className="border-b border-white/10 pb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-lg text-white">SYSTEM FRAMEWORK: PATIENT ZERO</h3>
          <p className="font-mono text-xs text-slate-400">Cognitive Endurance & Long-Term Adherence Architecture v2.5</p>
        </div>
      </div>

      {/* Philosophy block */}
      <div className="bg-slate-900/60 border-l-4 border-cyan-500 p-5 rounded-r-xl font-sans text-xs md:text-sm flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
          <ShieldCheck className="w-4 h-4" /> The Science of Sustainable Adherence
        </div>
        <p className="text-slate-300 leading-relaxed">
          "Resident, postgraduate medical preparation is a 6-to-18-month cognitive marathon. 
          You cannot panic into action. In behavioral psychology, chronic alarmism and hyper-punitive penalties trigger amygdala hijacking, cognitive exhaustion, and eventual avoidance.
          Real mastery is forged through <strong>homeostatic stability, psychological safety, and sustainable daily micro-habits</strong>. Patient Zero models realistic human physiology: your consistency, restorative sleep, and deliberate retrieval practice steadily expand your diagnostic acumen."
        </p>
      </div>

      {/* Key Features / Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-sm text-white border-b border-white/10 pb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400" /> Physiological Reserve & Homeostasis
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-xs text-slate-400">
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[1]</span>
              <span><strong>Realistic Ambulatory Vitals:</strong> Pulse (64-88 bpm), normotensive blood pressure, and core temperature fluctuate within real physiological homeostasis based on your sleep and workload, never artificial panic spikes.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[2]</span>
              <span><strong>Restorative Buffer Protection:</strong> If life disrupts a shift, the system applies gentle allostatic calibration with a protected baseline reserve, keeping momentum intact without demoralizing resets.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-emerald-400 font-bold mt-0.5">[3]</span>
              <span><strong>Circadian Sleep Banking:</strong> Logging 7+ hours of sleep directly restores parasympathetic tone, mitigates cognitive burnout, and replenishes your biological reserve.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-sans font-bold text-sm text-white border-b border-white/10 pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Deliberate Practice & Retrieval Science
          </h4>
          <ul className="flex flex-col gap-3 font-sans text-xs text-slate-400">
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[1]</span>
              <span><strong>Errors are Learning Anchors:</strong> In cognitive neuroscience, diagnostic friction is the primary driver of memory consolidation. Incorrect answers unlock high-yield clinical pearls without punitive alarm sirens.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[2]</span>
              <span><strong>High-Yield Rationales:</strong> Every clinical case is drawn from postgraduate curricula. Detailed explanations unpack differential diagnoses so you learn why alternatives are incorrect.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-indigo-400 font-bold mt-0.5">[3]</span>
              <span><strong>Adaptive Pacing Modes:</strong> Utilize On-Call Duty (halved targets) and Recovery Rest Days to pace study load around real-life clinical rotations.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Sustainable Long-Term Adherence */}
      <div className="border border-white/10 rounded-xl p-4 bg-slate-900/30 flex items-start gap-3.5 mt-2">
        <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-sans font-bold text-white flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Habit Continuity & Psychological Safety
          </span>
          <p className="text-slate-400 leading-relaxed">
            Long-term exam victory is decided by uninterrupted adherence over months. Patient Zero provides steady, reassuring physiological feedback so you can sit down every day with focus, clarity, and confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
