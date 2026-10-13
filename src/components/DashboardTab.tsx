import React, { FormEvent } from "react";
import { motion } from "motion/react";
import { UserStats, PatientVitals, Mission, MoodLog } from "../types";
import { NarrativeState } from "../lib/narrative";
import VitalsMonitor from "./VitalsMonitor";
import Heatmap from "./Heatmap";
import { 
  ShieldAlert, ShieldCheck, BookOpen, Activity, Smile, Brain, Cpu, Check, 
  Sparkles, Calendar, ChevronRight, Compass, MapPin
} from "lucide-react";
import { formatDoctorName } from "../lib/doctorUtils";
import { getTodayISO } from "../lib/dateUtils";
import { RANKS } from "./ProgressPanel";

interface DashboardTabProps {
  stats: UserStats;
  currentVitals: PatientVitals;
  isRestorativeBuffer: boolean;
  narrativeState: NarrativeState;
  dailyStreak: number;
  computedDaysToExam: number;
  missions: Mission[];
  moodLogs: MoodLog[];
  moodRating: number;
  setMoodRating: (rating: number) => void;
  moodTrigger: string;
  setMoodTrigger: (trigger: string) => void;
  handleMoodSubmit: (e: FormEvent) => void;
  onOpenSleepModal: () => void;
  onQuickRest: () => void;
  onNavigateTab: (tab: "dashboard" | "missions" | "triage" | "progress" | "rewards" | "settings") => void;
  onOpenManualLog: (type: 'QuickMCQ' | 'FullStudy') => void;
  onOpenPastShiftLogger?: (dateIso: string) => void;
}

export default function DashboardTab({
  stats,
  currentVitals,
  isRestorativeBuffer,
  narrativeState,
  dailyStreak,
  computedDaysToExam,
  missions,
  moodLogs,
  moodRating,
  setMoodRating,
  moodTrigger,
  setMoodTrigger,
  handleMoodSubmit,
  onOpenSleepModal,
  onQuickRest,
  onNavigateTab,
  onOpenManualLog,
  onOpenPastShiftLogger
}: DashboardTabProps) {
  let currentRankIndex = RANKS.findIndex(r => (stats.xp || 0) < r.minXp) - 1;
  if (currentRankIndex < 0) currentRankIndex = RANKS.length - 1;
  if ((stats.xp || 0) < 500) currentRankIndex = 0;
  const currentRank = RANKS[currentRankIndex] || RANKS[0];

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-8 pb-12"
    >
      {narrativeState.activeNarrativeEvent && (
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 text-xs sm:text-sm font-bold tracking-wide">
          {narrativeState.activeNarrativeEvent}
        </div>
      )}

      {/* Top Row: Ambulatory Vitals & Reserve Monitor */}
      <div className="w-full">
        <VitalsMonitor
          vitals={currentVitals}
          status="active"
          isCritical={false}
          patientHealth={stats.patientHealth}
          burnoutIndex={stats.burnoutIndex}
          studyMode={stats.studyMode}
          todaySleepHours={stats.sleepLogs?.[getTodayISO()] || 0}
          shiftStreak={dailyStreak}
          latestMoodLog={moodLogs[0]}
          onOpenSleepModal={onOpenSleepModal}
          onQuickRest={onQuickRest}
        />
      </div>

      {/* Tactical Action deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 units): Patient Status and Action Controls */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* System Integrity Core */}
          <div className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-colors border shadow-sm ${
            isRestorativeBuffer 
              ? "bg-slate-900/60 backdrop-blur-xl border-indigo-500/40" 
              : "bg-slate-900/40 backdrop-blur-xl border-slate-700/50"
          }`}>
            <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
               <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(103, 232, 249, 0.4) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)' }}></div>
            </div>
            
            <div className="flex justify-between items-start mb-6 border-b border-slate-700/50 pb-5 relative z-10">
              <div>
                <h3 className="font-bold text-slate-100 text-xl tracking-wide flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" /> Cognitive Resilience Index
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-0.5">{narrativeState.missionBriefing}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-sm tracking-widest uppercase ${
                isRestorativeBuffer 
                  ? "bg-indigo-950/70 text-indigo-300 border-indigo-500/40" 
                  : "bg-emerald-950/70 text-emerald-400 border-emerald-500/40"
              }`}>
                {isRestorativeBuffer ? "Restorative Buffer Active" : narrativeState.phaseLabel}
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <div className="flex justify-between mb-2 text-sm font-semibold">
                <span className="text-slate-300">Resilience Score</span>
                <span className={isRestorativeBuffer ? "text-indigo-400 font-black" : "text-cyan-400 font-black"}>
                  {stats.patientHealth}%
                </span>
              </div>
              <div className="h-3.5 bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
                <div
                  style={{ width: `${stats.patientHealth}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isRestorativeBuffer 
                      ? "bg-indigo-500 text-indigo-500" 
                      : "bg-cyan-500 text-cyan-500"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 relative z-10">
              <div className="flex flex-col gap-1 border-r border-slate-700 pr-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">COG-LOAD</span>
                <span className={`font-bold text-lg ${stats.burnoutIndex > 65 ? "text-amber-400" : "text-slate-200"}`}>
                  {stats.burnoutIndex}%
                </span>
              </div>
              <div className="flex flex-col gap-1 border-r border-slate-700 pr-4 pl-0 sm:pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">EXAM T-MINUS</span>
                <span className="font-bold text-lg text-slate-200">
                  {computedDaysToExam} d
                </span>
              </div>
              <div className="flex flex-col gap-1 border-r border-slate-700 pr-4 pl-0 sm:pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SHIFT SHIELDS</span>
                <span className="font-bold text-lg text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {stats.streakShields || 0} / 3
                </span>
              </div>
              <div className="flex flex-col gap-1 pl-0 sm:pl-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MED-RANK</span>
                <span className="font-bold text-sm sm:text-base text-purple-400 truncate max-w-[150px]" title={currentRank.title}>
                  Lvl {currentRankIndex + 1}: {currentRank.rank}
                </span>
              </div>
            </div>
          </div>

          <Heatmap 
            activityLogs={stats.activityLogs || {}} 
            mcqLogs={stats.mcqLogs || {}} 
            sleepLogs={stats.sleepLogs || {}} 
            onOpenPastShiftLogger={onOpenPastShiftLogger}
          />

          {/* Quick Interventions Deck */}
          <div className="flex flex-col gap-4">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">Immediate Interventions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onNavigateTab("triage")}
                className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-cyan-300 dark:hover:border-cyan-700 text-left rounded-3xl transition-all shadow-sm group"
              >
                <ShieldAlert className="w-6 h-6 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm mb-1">Morning Triage</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Solve 5 clinical cases.
                </p>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onOpenManualLog("QuickMCQ")}
                className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-orange-300 dark:hover:border-orange-700 text-left rounded-3xl transition-all shadow-sm group"
              >
                <BookOpen className="w-6 h-6 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm mb-1">QBank Session</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Log 10 practice MCQs.
                </p>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onOpenManualLog("FullStudy")}
                className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-purple-300 dark:hover:border-purple-700 text-left rounded-3xl transition-all shadow-sm group"
              >
                <Activity className="w-6 h-6 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm mb-1">Video Study</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Log 1 hour video modules.
                </p>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => onNavigateTab("progress")}
                className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 text-left rounded-3xl transition-all shadow-sm group"
              >
                <Sparkles className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm mb-1">High-Yield Pearls</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Review unlocked clinical pearls.
                </p>
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={onOpenSleepModal}
                className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-300 dark:hover:border-emerald-700 text-left rounded-3xl transition-all shadow-sm group"
              >
                <Smile className="w-6 h-6 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm mb-1">Sleep / Rest</span>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Log rest & reset cognitive load.
                </p>
              </motion.button>
            </div>
          </div>

          {/* Biocompatibility & Attention Logger */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">Biocompatibility Log</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mindfully track cognitive fatigue and attention friction.</p>
              </div>
            </div>

            <form onSubmit={handleMoodSubmit} className="flex flex-col gap-6">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 block uppercase tracking-wider">Current Resilience Level (1: Exhausted, 5: Radiant)</label>
                <div className="flex items-center gap-3 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <motion.button whileTap={{ scale: 0.95 }}
                      key={val}
                      type="button"
                      onClick={() => setMoodRating(val)}
                      className={`w-11 h-11 rounded-2xl font-bold text-base transition-all ${
                        moodRating === val
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105"
                          : "bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {val}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs font-bold mt-3 px-3 py-1.5 rounded-xl inline-block bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {moodRating === 1 && "Level 1: Fatigue Acknowledged (Protective Pacing Active • Reserve Protected)"}
                  {moodRating === 2 && "Level 2: Mild Strain (Pacing Mode • Reserve Protected)"}
                  {moodRating === 3 && "Level 3: Baseline Equilibrium (+3% Reserve, -6% Strain)"}
                  {moodRating === 4 && "Level 4: High Acuity & Focus (+5% Reserve, -10% Strain)"}
                  {moodRating === 5 && "Level 5: Radiant Flow State (+7% Reserve, -15% Strain)"}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">Trigger Notes (Attention Drift Vectors)</label>
                  <span className="text-[11px] font-semibold text-slate-400">Non-judgmental Observation</span>
                </div>
                <input
                  type="text"
                  value={moodTrigger}
                  placeholder="e.g. Lost 45m to Reels or decision fatigue..."
                  onChange={(e) => setMoodTrigger(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium outline-none focus:border-purple-400 transition-all placeholder:text-slate-400"
                />
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {["Social Media Reels", "YouTube Rabbit Hole", "Fatigue Inertia", "Notification Noise", "Overthinking"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMoodTrigger(tag)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.95 }}
                type="submit"
                className="py-3.5 w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                Log Biocompatibility Entry
              </motion.button>
            </form>

            {moodLogs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recent Biocompatibility Logs</span>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {moodLogs.slice(0, 5).map((ml, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-purple-600 bg-purple-100 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded text-[10px]">LVL {ml.ratingValue}</span>
                        <span className="truncate italic max-w-xs">{ml.procrastinationTrigger || "Stable focus / No active breach"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{ml.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 units): Horizon Countdown & Active Shift Preview */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Exam Countdown Horizon */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">NEET PG Countdown</span>
            <span className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
              {computedDaysToExam}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Days Remaining</span>
          </div>

          {/* Clinical Journey Map Expedition Preview */}
          <motion.div 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateTab("rewards")}
            className="border border-cyan-200/80 dark:border-cyan-800/60 bg-gradient-to-br from-cyan-50/70 via-white to-slate-50 dark:from-slate-900/90 dark:via-cyan-950/20 dark:to-slate-900 p-6 rounded-3xl flex flex-col relative overflow-hidden shadow-sm cursor-pointer group hover:border-cyan-400 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm shrink-0">
                  <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0284C7] dark:text-cyan-400 block">
                    Campus Journey
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {formatDoctorName(stats.studentName)}'s Campus Trail
                  </h4>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#0284C7] dark:text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Explore 7 clinical checkpoints across the campus trail, collect diagnostic relics, and reveal high-yield pearls.
            </p>
            <div className="flex items-center justify-between text-[11px] font-medium pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300 font-bold">{stats.xp || 0} XP Yield</span>
              <span className="text-[#0284C7] dark:text-cyan-400 font-bold">Open Campus Journey →</span>
            </div>
          </motion.div>

          {/* Active Protocols Preview */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" /> Active Shift Objectives
              </h4>
              <motion.button whileTap={{ scale: 0.95 }} 
                onClick={() => onNavigateTab("missions")}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                View Shift <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {missions.slice(0, 4).map(m => {
                const pct = Math.floor((m.current / m.target) * 100);
                return (
                  <div key={m.id} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{m.title}</span>
                      {m.status === "Completed" ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-750 shrink-0">
                          {m.current}/{m.target} {m.unit}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, pct)}%` }}
                        className={`h-full transition-all duration-500 ${m.status === "Completed" ? "bg-emerald-500" : "bg-cyan-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
