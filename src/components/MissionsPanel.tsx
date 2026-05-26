import React, { useState } from "react";
import { Mission } from "../types";
import { CheckCircle2, ShieldAlert, TrendingUp, AlertTriangle, Flame, AlertCircle } from "lucide-react";

interface Props {
  missions: Mission[];
  patientHealth: number;
  onUpdateProgress: (id: string, amount?: number) => void;
  onAddMission: (title: string, category: 'MCQ' | 'Revision' | 'Lectures' | 'Tests' | 'Custom', target: number, unit: string, period?: 'daily' | 'weekly') => void;
  onSimulateSlip: (reason: string) => void;
  studyMode?: 'Normal' | 'Duty' | 'Rest';
}

export default function MissionsPanel({ missions, patientHealth, onUpdateProgress, onAddMission, onSimulateSlip, studyMode = 'Normal' }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [newUnit, setNewUnit] = useState("Chapters");
  const [newPeriod, setNewPeriod] = useState<'daily' | 'weekly'>("daily");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddMission(newTitle, 'Custom', newTarget, newUnit, newPeriod);
    setNewTitle("");
    setNewTarget(1);
    setNewPeriod("daily");
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Immersive Warning Banner */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-colors ${
        patientHealth < 35 
          ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900" 
          : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
      }`}>
        <div className="flex items-start md:items-center gap-4">
          <div className={`p-3 rounded-2xl ${patientHealth < 35 ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 animate-pulse" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"}`}>
            <ShieldAlert className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${patientHealth < 35 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>Tactical Shift Status</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mt-1">
              {patientHealth < 35 
                ? "WARNING: Preparation state collapsing. Complete directives immediately or initialize triage!" 
                : "STATUS SECURE: Prep vitals holding steady. Complete daily directives to advance."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => onSimulateSlip("Dopamine Overload / Reddit Doomscroll slip")}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-600 hover:bg-rose-50 transition shadow-sm w-full sm:w-auto"
          >
            Report Doomscroll Slip
          </button>
          <button
            onClick={() => onSimulateSlip("Burnout / Procrastination fatigue")}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-amber-600 hover:bg-amber-50 transition shadow-sm w-full sm:w-auto"
          >
            Report Procrastination
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Core Tactical Directives */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-2">
                  Daily Study Directives
                  {studyMode === 'Duty' && <span className="px-2 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold uppercase tracking-widest whitespace-nowrap">Duty Active - Targets Halved</span>}
                  {studyMode === 'Rest' && <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest whitespace-nowrap">Rest Active</span>}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Complete objectives to restore Patient Vitals</p>
              </div>
              
              {studyMode !== 'Rest' && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50 rounded-xl transition shrink-0"
                >
                  {showAddForm ? "Close Form" : "+ Add Directive"}
                </button>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/50 flex flex-col gap-5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">Issue New Directive</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Objective Label</label>
                    <input
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Complete Endocrine blocks"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Target Volume</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Unit of Measurement</label>
                    <input
                      required
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="e.g. Pages, Questions..."
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Reset Cycle / Period</label>
                    <select
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value as 'daily' | 'weekly')}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 text-sm font-medium outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                    >
                      <option value="daily">Daily Reset (Resets at midnight every day)</option>
                      <option value="weekly">Weekly Reset (Maintained / resets weekly)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 transition mt-2">
                  Confirm Directive Parameter
                </button>
              </form>
            )}

            <div className="flex flex-col gap-4">
              {studyMode === 'Rest' ? (
                <div className="text-center text-rose-500 py-16 bg-rose-50 dark:bg-rose-950/20 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/50">
                  <Heart className="w-12 h-12 mx-auto mb-4 animate-pulse relative z-10" />
                  <span className="font-black text-xl uppercase tracking-widest block mb-2 relative z-10">Rest Day Active</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400 relative z-10 block max-w-sm mx-auto px-4">All directives suspended. Prioritize recovery and burnout reduction.</span>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center text-slate-500 py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="font-medium">No directives active.</span>
                </div>
              ) : (
                missions.map(m => {
                  const activeTarget = studyMode === 'Duty' ? Math.max(1, Math.ceil(m.target / 2)) : m.target;
                  const isCompleted = m.status === "Completed" || m.current >= activeTarget;
                  const pct = Math.min(100, Math.floor((m.current / activeTarget) * 100));

                  return (
                    <div
                      key={m.id}
                      className={`border p-5 rounded-2xl transition duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 ${
                        isCompleted
                          ? "border-emerald-200 bg-emerald-50 text-slate-500"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:border-slate-700 hover:shadow-md"
                      }`}
                    >
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                          <h4 className={`font-bold text-base flex flex-col sm:flex-row items-baseline gap-2 ${isCompleted ? 'text-emerald-800 line-through opacity-70' : 'text-slate-900 dark:text-slate-100'}`}>
                            {m.title}
                            {studyMode === 'Duty' && !isCompleted && (
                              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded leading-none">Duty 50%</span>
                            )}
                            {m.period === 'weekly' ? (
                              <span className="text-[10px] uppercase font-semibold tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/30">Weekly Limit</span>
                            ) : (
                              <span className="text-[10px] uppercase font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">Daily Cycle</span>
                            )}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800/50">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                            />
                          </div>
                          <span className={`text-sm font-bold min-w-[60px] text-right ${isCompleted ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>
                            {m.current} / {activeTarget}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 mt-3 text-xs font-bold uppercase tracking-wider">
                          <span className={`${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-blue-500/80 dark:text-blue-400'}`}>+{m.xpReward} XP</span>
                          <span className={`${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-purple-500/80 dark:text-purple-400'}`}>+{m.creditReward} CRDT</span>
                          <span className={`${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-rose-500/80 dark:text-rose-400'}`}>+{m.stabilizeValue}% Health</span>
                        </div>
                      </div>

                      {!isCompleted ? (
                        <div className="flex gap-2 sm:flex-col shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                          <button
                            onClick={() => onUpdateProgress(m.id, 1)}
                            className="px-4 py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition flex-1 sm:flex-none text-center"
                          >
                            +1 {m.unit}
                          </button>
                          <button
                            onClick={() => onUpdateProgress(m.id, activeTarget - m.current)}
                            className="px-4 py-2.5 text-sm font-bold bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 rounded-xl transition flex-1 sm:flex-none text-center"
                          >
                            Auto-Complete
                          </button>
                        </div>
                      ) : (
                        <div className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold shrink-0 text-center w-full sm:w-auto shadow-sm tracking-wide">
                          SECURED
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Reward Dynamics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2 border-b border-slate-100 pb-4 mb-5 tracking-tight">
              <Flame className="w-5 h-5 text-orange-500" />
              Pharmacokinetics Info
            </h4>
            
            <div className="text-slate-600 dark:text-slate-400 font-medium text-sm flex flex-col gap-4">
              <p className="leading-relaxed">
                "Patient Zero" tracks continuous focus. When you complete real-world study cycles, updating telemetry inputs triggers:
              </p>
              
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-start gap-4">
                <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex flex-col text-sm">
                  <span className="text-emerald-900 font-bold mb-1 tracking-tight">Stabilization Bolus</span>
                  <span className="text-emerald-700">+10-30% Patient Stability Index</span>
                  <span className="text-emerald-700">+50-200 Diagnostic XP</span>
                </div>
              </div>

              <p className="leading-relaxed">
                If the shift registers a <span className="text-red-500 font-bold">"Slip"</span>, attention de-synchronization is entered:
              </p>

              <div className="p-4 rounded-2xl border border-red-200 bg-red-50 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex flex-col text-sm">
                  <span className="text-red-900 font-bold mb-1 tracking-tight">Decompensation Cascade</span>
                  <span className="text-red-700">-15% Prep Health directly</span>
                  <span className="text-red-700">+40 HR Tachycardia shock</span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-500 border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-wider mt-2">
                To reverse procrastination decline, immediately initialize a "Stabilize Triage" rescue diagnostic.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
