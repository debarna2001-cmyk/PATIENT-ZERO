import { sound } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { Mission, DailyMissionRecord, UserStats } from "../types";
import { 
  CheckCircle2, ShieldAlert, ShieldCheck, TrendingUp, AlertTriangle, 
  Flame, AlertCircle, Heart, History, Calendar, Check, X, 
  ChevronDown, ChevronUp, XCircle, BookOpen, Tv, Moon, Edit3, Trash2, Plus, Save
} from "lucide-react";
import { formatDateDMY, getTodayISO, getDaysAgoISO } from "../lib/dateUtils";

interface Props {
  missions: Mission[];
  missionHistory?: DailyMissionRecord[];
  patientHealth: number;
  stats?: UserStats;
  onUpdateProgress: (id: string, amount?: number) => void;
  onClaimReward: (id: string, overrideCompletion?: boolean) => void;
  onAddMission: (title: string, category: 'MCQ' | 'Revision' | 'Lectures' | 'Tests' | 'Custom', target: number, unit: string, period?: 'daily' | 'weekly') => void;
  onSimulateSlip: (reason: string) => void;
  studyMode?: 'Normal' | 'Duty' | 'Rest';
  onLogPastShift?: (date: string, mcqs: number, modules: number, sleep: number, note?: string) => void;
  onDeleteArchivedShift?: (date: string) => void;
  initialPastDate?: string | null;
}

export default function MissionsPanel({ 
  missions, 
  missionHistory = [], 
  patientHealth, 
  stats,
  onUpdateProgress, 
  onClaimReward, 
  onAddMission, 
  onSimulateSlip, 
  studyMode = 'Normal',
  onLogPastShift,
  onDeleteArchivedShift,
  initialPastDate
}: Props) {
  const [panelTab, setPanelTab] = useState<'active' | 'history'>('active');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(1);
  const [newUnit, setNewUnit] = useState("Chapters");
  const [newPeriod, setNewPeriod] = useState<'daily' | 'weekly'>("daily");

  // Retrospective past shift logger state
  const [showRetroForm, setShowRetroForm] = useState(false);
  const [retroDate, setRetroDate] = useState(() => getDaysAgoISO(1));
  const [retroMcqs, setRetroMcqs] = useState(45);
  const [retroModules, setRetroModules] = useState(2);
  const [retroSleep, setRetroSleep] = useState(7.0);
  const [retroNote, setRetroNote] = useState("");
  const [editingArchiveDate, setEditingArchiveDate] = useState<string | null>(null);

  useEffect(() => {
    if (initialPastDate) {
      setPanelTab('history');
      setRetroDate(initialPastDate);
      setShowRetroForm(true);
    }
  }, [initialPastDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddMission(newTitle, 'Custom', newTarget, newUnit, newPeriod);
    setNewTitle("");
    setNewTarget(1);
    setNewPeriod("daily");
    setShowAddForm(false);
  };

  const handleSubmitRetro = (e: React.FormEvent) => {
    e.preventDefault();
    sound.click();
    if (onLogPastShift && retroDate) {
      onLogPastShift(retroDate, retroMcqs, retroModules, retroSleep, retroNote);
      setEditingArchiveDate(null);
      setShowRetroForm(false);
      setRetroNote("");
    }
  };

  const handleStartEditArchive = (rec: DailyMissionRecord) => {
    sound.click();
    setRetroDate(rec.date);
    setRetroNote(rec.note || "");
    const mcqsFromStats = stats?.mcqLogs?.[rec.date];
    const modulesFromStats = stats?.videoLogs?.[rec.date];
    const sleepFromStats = stats?.sleepLogs?.[rec.date];
    const mcqM = rec.missions?.find(m => m.category === 'MCQ');
    const modM = rec.missions?.find(m => m.category === 'Lectures');
    setRetroMcqs(mcqsFromStats !== undefined ? mcqsFromStats : (mcqM?.current || 40));
    setRetroModules(modulesFromStats !== undefined ? modulesFromStats : (modM?.current || 2));
    setRetroSleep(sleepFromStats !== undefined ? sleepFromStats : 7.0);
    setEditingArchiveDate(rec.date);
    setShowRetroForm(true);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Habit Continuity & Allostatic Status Banner */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-colors ${
        patientHealth < 40 
          ? "bg-indigo-50/60 dark:bg-slate-900/90 border-indigo-200 dark:border-indigo-900/50" 
          : "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
      }`}>
        <div className="flex items-start md:items-center gap-4">
          <div className={`p-3 rounded-2xl ${patientHealth < 40 ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"}`}>
            {patientHealth < 40 ? <Heart className="w-6 h-6 shrink-0" /> : <ShieldCheck className="w-6 h-6 shrink-0" />}
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${patientHealth < 40 ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"}`}>Shift Habit Continuity</span>
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mt-1">
              {patientHealth < 40 
                ? "RESTORATIVE BUFFER ACTIVE: Reserve is guarded. Build momentum through low-friction micro-habits rather than frantic sprints." 
                : "SUSTAINED CONSISTENCY: Daily rhythm is strong. Clear today's shift to reinforce long-term adherence."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => onSimulateSlip("Attention breach / Doomscroll slip")}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm w-full sm:w-auto"
          >
            Log Attention Slip
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => onSimulateSlip("Cognitive fatigue / Procrastination")}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition shadow-sm w-full sm:w-auto"
          >
            Log Pacing Need
          </motion.button>
        </div>
      </div>

      {/* Tab Switcher: Active Shift vs Continuity Archive */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setPanelTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            panelTab === 'active'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Active Shift Protocols
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            {missions.filter(m => m.status === 'Completed').length}/{missions.length}
          </span>
        </button>
        <button
          onClick={() => setPanelTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            panelTab === 'history'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-cyan-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          Shift Continuity Archive
          {missionHistory.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold">
              {missionHistory.length} Shifts
            </span>
          )}
        </button>
      </div>

      {panelTab === 'active' ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Core Tactical Protocols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-2">
                  Daily Study Protocols
                  {studyMode === 'Duty' && <span className="px-2 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 font-bold uppercase tracking-widest whitespace-nowrap">Duty Active - Targets Halved</span>}
                  {studyMode === 'Rest' && <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest whitespace-nowrap">Rest Active</span>}
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Complete objectives to restore Patient Vitals</p>
              </div>
              
              {studyMode !== 'Rest' && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50 rounded-xl transition shrink-0"
                >
                  {showAddForm ? "Close Form" : "+ Add Protocol"}
                </motion.button>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/50 flex flex-col gap-5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">Issue New Protocol</h4>
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
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/10 transition mt-2">
                  Confirm Protocol Parameter
                </motion.button>
              </form>
            )}

            <div className="flex flex-col gap-4">
              {studyMode === 'Rest' ? (
                <div className="text-center text-rose-500 py-16 bg-rose-50 dark:bg-rose-950/20 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/50">
                  <Heart className="w-12 h-12 mx-auto mb-4 animate-pulse relative z-10" />
                  <span className="font-black text-xl uppercase tracking-widest block mb-2 relative z-10">Rest Day Active</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400 relative z-10 block max-w-sm mx-auto px-4">All protocols suspended. Prioritize recovery and burnout reduction.</span>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center text-slate-500 py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <span className="font-medium">No protocols active.</span>
                </div>
              ) : (
                [...missions].sort((a, b) => {
                  const order = ["m-04-triage", "m-01-mcqs", "m-02-lectures", "m-05-review", "m-03-gt"];
                  const aIndex = order.indexOf(a.id);
                  const bIndex = order.indexOf(b.id);
                  
                  const aIdx = aIndex === -1 ? 99 : aIndex;
                  const bIdx = bIndex === -1 ? 99 : bIndex;
                  
                  if (aIdx === bIdx) return a.id.localeCompare(b.id);
                  return aIdx - bIdx;
                }).map(m => {
                  const activeTarget = studyMode === 'Duty' ? Math.max(1, Math.ceil(m.target / 2)) : m.target;
                  const isCompleted = m.status === "Completed";
                  const readyToClaim = !isCompleted && m.current >= activeTarget;
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
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : readyToClaim ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                            />
                          </div>
                          <span className={`text-sm font-bold min-w-[60px] text-right ${isCompleted ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>
                            {m.current} / {activeTarget}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 mt-3 text-xs font-bold uppercase tracking-wider">
                          <span className={`${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-blue-500/80 dark:text-blue-400'}`}>+{m.xpReward} XP</span>
                          <span className={`${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400' : 'text-rose-500/80 dark:text-rose-400'}`}>+{m.stabilizeValue}% Health</span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <div className="px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold shrink-0 text-center w-full sm:w-auto shadow-sm tracking-wide mt-4 sm:mt-0">
                          SECURED
                        </div>
                      ) : readyToClaim ? (
                        <div className="w-full sm:w-auto mt-4 sm:mt-0">
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => onClaimReward(m.id)}
                            className="px-6 py-3 w-full sm:w-auto text-sm font-black bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl transition shadow-lg shadow-amber-500/20 text-center uppercase tracking-wide border border-amber-300"
                          >
                            Claim Reward
                          </motion.button>
                        </div>
                      ) : (
                        ["m-01-mcqs", "m-02-lectures", "m-04-triage"].includes(m.id) ? (
                          <div className="w-full sm:w-auto mt-4 sm:mt-0 text-center text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            {m.id === "m-01-mcqs" ? "Updates via QBank logs" : m.id === "m-02-lectures" ? "Updates via Video logs" : "Updates via Triage cases"}
                          </div>
                        ) : (
                          <div className="flex gap-2 sm:flex-col shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0 mt-4 sm:mt-0">
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => onUpdateProgress(m.id, 1)}
                              className="px-4 py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition flex-1 sm:flex-none text-center"
                            >
                              Mission Accomplished
                            </motion.button>
                          </div>
                        )
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
      ) : (
        /* Continuity Archive View */
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-500" />
                  Shift Continuity & Daily Archive
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Verified record of past daily objectives. Log past protocols backwards or review verified continuity.
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    sound.click();
                    setShowRetroForm(!showRetroForm);
                    setEditingArchiveDate(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showRetroForm ? "Close Logger" : "+ Log Past Shift Protocols"}
                </motion.button>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-cyan-500" />
                  <span>{missionHistory.length} Shifts Archived</span>
                </div>
              </div>
            </div>

            {/* Retrospective Protocol Logger Form */}
            {showRetroForm && (
              <form onSubmit={handleSubmitRetro} className="mb-6 p-6 border-2 border-cyan-500/30 rounded-3xl bg-cyan-50/40 dark:bg-cyan-950/20 backdrop-blur-sm flex flex-col gap-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {editingArchiveDate ? `Edit Shift Protocols for ${formatDateDMY(editingArchiveDate)}` : "Manual Retrospective Protocol Logger"}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
                    Indian Standard Time (IST)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Shift Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" /> Shift Date
                    </label>
                    <input
                      type="date"
                      required
                      max={getTodayISO()}
                      value={retroDate}
                      onChange={(e) => setRetroDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Selected: {formatDateDMY(retroDate)}</span>
                  </div>

                  {/* MCQs Solved */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-orange-500" /> MCQs Solved
                      </label>
                      <div className="flex items-center gap-1">
                        {[10, 25, 50].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setRetroMcqs(prev => Math.max(0, prev + inc))}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={retroMcqs}
                      onChange={(e) => setRetroMcqs(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">QBank questions solved</span>
                  </div>

                  {/* Marrow Modules */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5 text-purple-500" /> Marrow Modules
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((inc) => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setRetroModules(prev => Math.max(0, prev + inc))}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition"
                          >
                            +{inc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={retroModules}
                      onChange={(e) => setRetroModules(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Video lectures / modules</span>
                  </div>

                  {/* Rest Hours */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" /> Hours Slept
                      </label>
                      <div className="flex items-center gap-1">
                        {[6, 7, 8].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setRetroSleep(hrs)}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition"
                          >
                            {hrs}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={retroSleep}
                      onChange={(e) => setRetroSleep(Math.max(0, Math.min(24, parseFloat(e.target.value) || 0)))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Rest & restorative sleep</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Shift Notes (optional, e.g. Cardiology & General Surgery revision)"
                    value={retroNote}
                    onChange={(e) => setRetroNote(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-400 font-medium"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRetroForm(false);
                        setEditingArchiveDate(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {editingArchiveDate ? "Update Shift Archive" : "Save Shift to Archive"}
                    </motion.button>
                  </div>
                </div>
              </form>
            )}

            {/* Continuity Verification Info Card */}
            <div className="mb-6 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-950 dark:text-cyan-200 leading-relaxed font-medium">
                <span className="font-bold block text-sm mb-0.5">Continuity Protocol Guarantee</span>
                Daily objectives reset their active progress bar each day at 00:00 to give you a clean slate for the new shift. The exact state of yesterday's completed and pending objectives is snapshotted into this archive beforehand, guaranteeing your historical progress is retained and never lost.
              </div>
            </div>

            {missionHistory.length === 0 ? (
              <div className="text-center text-slate-500 py-16 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-base">No Prior Shift Archives Yet</span>
                <p className="text-xs text-slate-500 max-w-md px-4 leading-relaxed font-medium">
                  Complete today's active study protocols, or click <strong>+ Log Past Shift Protocols</strong> above to log prior dates backwards.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {missionHistory.map((rec) => {
                  const isExpanded = expandedDate === rec.date;
                  const isFull = rec.completedRate >= 100;
                  const isPartial = rec.completedRate > 0 && rec.completedRate < 100;
                  
                  return (
                    <div
                      key={rec.date}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 p-5 transition hover:border-slate-300 dark:hover:border-slate-700 flex flex-col gap-4"
                    >
                      <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                        onClick={() => setExpandedDate(isExpanded ? null : rec.date)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                            isFull 
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" 
                              : isPartial 
                                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400" 
                                : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400"
                          }`}>
                            {isFull ? <CheckCircle2 className="w-5 h-5" /> : isPartial ? <Calendar className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-900 dark:text-slate-100 text-base tracking-tight font-mono">
                                Shift Date: {formatDateDMY(rec.date)}
                              </span>
                              {rec.date === getTodayISO() && (
                                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">
                                  Today's Shift
                                </span>
                              )}
                              {(rec.status === 'Shift Missed' || (rec.completedRate === 0 && rec.date !== getTodayISO())) && (
                                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                  Shift Missed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-0.5">
                              {stats?.mcqLogs?.[rec.date] !== undefined && (
                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                  {stats.mcqLogs[rec.date]} MCQs
                                </span>
                              )}
                              {stats?.videoLogs?.[rec.date] !== undefined && (
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  • {stats.videoLogs[rec.date]} Modules
                                </span>
                              )}
                              {stats?.sleepLogs?.[rec.date] !== undefined && (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  • {stats.sleepLogs[rec.date]}h Sleep
                                </span>
                              )}
                              <span className={!isFull && !isPartial ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'font-medium'}>
                                • {rec.completedCount} of {rec.totalCount} Objectives ({rec.completedRate}%)
                              </span>
                              {rec.note && <span className="italic opacity-85">• {rec.note}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            isFull
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : isPartial
                                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 font-extrabold"
                          }`}>
                            {isFull ? "Target Cleared" : isPartial ? "Partially Met" : "Goals Not Met"}
                          </span>

                          {onLogPastShift && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditArchive(rec);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-500 transition"
                              title="Edit this shift"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteArchivedShift && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.click();
                                if (window.confirm ? window.confirm(`Remove archived record for ${formatDateDMY(rec.date)}?`) : true) {
                                  onDeleteArchivedShift(rec.date);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 transition"
                              title="Delete this record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${rec.completedRate}%` }}
                          className={`h-full transition-all duration-500 ${
                            isFull
                              ? "bg-emerald-500"
                              : isPartial
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                      </div>

                      {/* Expanded Mission List */}
                      {isExpanded && (
                        <div className="mt-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Recorded Objectives for this Shift:
                          </span>
                          {rec.missions && rec.missions.length > 0 ? (
                            rec.missions.map((m) => {
                              const done = m.status === "Completed";
                              return (
                                <div
                                  key={m.id}
                                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium ${
                                    done
                                      ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200"
                                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                                    )}
                                    <span className="font-bold">{m.title}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {m.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-semibold">
                                      {m.current} / {m.target} {m.unit}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                                      done
                                        ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    }`}>
                                      {done ? "Completed" : "Pending"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-400">No specific mission items recorded.</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
