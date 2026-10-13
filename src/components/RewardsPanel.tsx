import { useState, useMemo } from "react";
import { 
  Award, Lock, Star, ShieldCheck, BatteryCharging, Flame, Crown, 
  Zap, BrainCircuit, Medal, Activity, Trophy, Filter, CheckCircle2,
  Sparkles, Layers, ChevronRight, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../lib/audio";
import { UserStats, EmergencyLog } from "../types";
import { UNIFIED_ACHIEVEMENTS, UnifiedAchievement, AchievementCategory } from "../data/achievements";

interface Props {
  stats?: UserStats;
  xp?: number;
  patientsSaved?: number;
  studyStreak?: number;
  logs?: EmergencyLog[];
}

export default function RewardsPanel({ stats, xp, patientsSaved, studyStreak, logs }: Props) {
  // Synthesize stats if only primitive props are passed
  const resolvedStats: UserStats = useMemo(() => {
    if (stats) return stats;
    return {
      studentName: "Resident",
      targetSpecialty: "Emergency Medicine",
      targetExamYear: 2026,
      daysToExam: 365,
      patientHealth: 100,
      burnoutIndex: 0,
      isStabilizing: false,
      shiftStreak: studyStreak || 0,
      patientsSaved: patientsSaved || 0,
      patientsFlatlined: 0,
      unlockedPearlsCount: 0,
      xp: xp || 0,
      credits: 0,
      subjectPerformance: {},
      activityLogs: {},
      sleepLogs: {}
    };
  }, [stats, xp, patientsSaved, studyStreak]);

  const [selectedCategory, setSelectedCategory] = useState<"all" | AchievementCategory>("all");
  const [filterMode, setFilterMode] = useState<"all" | "unlocked" | "locked">("all");
  const [activeSealDetail, setActiveSealDetail] = useState<UnifiedAchievement | null>(null);

  // Compute status for all 30 achievements
  const achievementStatus = useMemo(() => {
    return UNIFIED_ACHIEVEMENTS.map(ach => {
      const isUnlocked = ach.checkUnlocked(resolvedStats, logs);
      const progress = ach.getProgress(resolvedStats, logs);
      const percent = Math.min(100, Math.max(0, Math.round((progress.current / Math.max(progress.target, 1)) * 100)));
      return {
        ...ach,
        isUnlocked,
        progress,
        percent
      };
    });
  }, [resolvedStats, logs]);

  const unlockedCount = achievementStatus.filter(a => a.isUnlocked).length;
  const totalCount = achievementStatus.length; // 30
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievementStatus.filter(a => {
      if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
      if (filterMode === "unlocked" && !a.isUnlocked) return false;
      if (filterMode === "locked" && a.isUnlocked) return false;
      return true;
    });
  }, [achievementStatus, selectedCategory, filterMode]);

  // Next upcoming locked seal
  const nextUpSeal = useMemo(() => {
    return achievementStatus.find(a => !a.isUnlocked);
  }, [achievementStatus]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Diamond":
        return "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-300";
      case "Platinum":
        return "bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300";
      case "Gold":
        return "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300";
      case "Silver":
        return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300";
      default: // Bronze
        return "bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Unified Banner */}
      <div className="relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Soft decorative gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                  Unified System
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  30 Progression Levels
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Achievements & Milestone Seals
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1 max-w-xl">
                Unified clinical milestone accreditation awarded for diagnostic saves, uninterrupted shift cadence, and medical mastery.
              </p>
            </div>
          </div>

          {/* Progress Circular / Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="uppercase tracking-wider">Total Seals</span>
              <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                {unlockedCount} / {totalCount}
              </span>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
              <span>Progress: {completionPercentage}%</span>
              <span>{totalCount - unlockedCount} remaining</span>
            </div>
          </div>
        </div>

        {/* Next upcoming seal callout if available */}
        {nextUpSeal && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Next Milestone Target:
              </span>
              <span className="font-extrabold text-amber-700 dark:text-amber-300">
                Lvl {nextUpSeal.level} — {nextUpSeal.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>{nextUpSeal.desc}</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {nextUpSeal.progress.current} / {nextUpSeal.progress.target} {nextUpSeal.progress.unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => { sound.click(); setSelectedCategory("all"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All 30 Levels
          </button>
          <button
            onClick={() => { sound.click(); setSelectedCategory("clinical_saves"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "clinical_saves"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Clinical Saves
          </button>
          <button
            onClick={() => { sound.click(); setSelectedCategory("streak_cadence"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "streak_cadence"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Shift Streaks
          </button>
          <button
            onClick={() => { sound.click(); setSelectedCategory("xp_knowledge"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "xp_knowledge"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            XP & Knowledge
          </button>
          <button
            onClick={() => { sound.click(); setSelectedCategory("resilience_vitals"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "resilience_vitals"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Resilience
          </button>
          <button
            onClick={() => { sound.click(); setSelectedCategory("triage_protocols"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "triage_protocols"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Triage Reflex
          </button>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => { sound.click(); setFilterMode("all"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterMode === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500"
            }`}
          >
            All
          </button>
          <button
            onClick={() => { sound.click(); setFilterMode("unlocked"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterMode === "unlocked" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-slate-500"
            }`}
          >
            Earned ({unlockedCount})
          </button>
          <button
            onClick={() => { sound.click(); setFilterMode("locked"); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              filterMode === "locked" ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs" : "text-slate-500"
            }`}
          >
            Locked ({totalCount - unlockedCount})
          </button>
        </div>
      </div>

      {/* Grid of 30 Leveled Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((seal) => {
          return (
            <motion.div 
              key={seal.id}
              whileHover={{ y: -2 }}
              onClick={() => {
                sound.click();
                setActiveSealDetail(seal);
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                seal.isUnlocked 
                  ? "bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 shadow-md shadow-amber-500/5 hover:border-amber-400" 
                  : "bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Header: Level Pill & Tier Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    seal.isUnlocked 
                      ? 'bg-amber-100/80 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80' 
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {seal.isUnlocked ? seal.icon : <Lock className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 tracking-wider">
                        LVL {seal.level}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getTierColor(seal.sealTier)}`}>
                        {seal.sealTier}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                      {seal.categoryLabel}
                    </span>
                  </div>
                </div>

                {seal.isUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    Earned
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                    {seal.percent}%
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div>
                <h4 className={`font-bold text-sm tracking-tight ${
                  seal.isUnlocked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {seal.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                  {seal.desc}
                </p>
              </div>

              {/* Progress Bar & Numerical Counter */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">Requirement</span>
                  <span className={seal.isUnlocked ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}>
                    {seal.progress.current} / {seal.progress.target} {seal.progress.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      seal.isUnlocked 
                        ? 'bg-emerald-500' 
                        : 'bg-amber-500/70'
                    }`}
                    style={{ width: `${seal.percent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal for Selected Achievement */}
      <AnimatePresence>
        {activeSealDetail && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-600 shrink-0">
                  {activeSealDetail.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                      Level {activeSealDetail.level}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getTierColor(activeSealDetail.sealTier)}`}>
                      {activeSealDetail.sealTier} Seal
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                    {activeSealDetail.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    Category: {activeSealDetail.categoryLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {activeSealDetail.desc}
              </div>

              {/* Status Breakdown */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Current Metric:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono">
                    {activeSealDetail.getProgress(resolvedStats, logs).current} / {activeSealDetail.getProgress(resolvedStats, logs).target} {activeSealDetail.getProgress(resolvedStats, logs).unit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      activeSealDetail.checkUnlocked(resolvedStats, logs) ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.round((activeSealDetail.getProgress(resolvedStats, logs).current / activeSealDetail.getProgress(resolvedStats, logs).target) * 100))}%` 
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => { sound.click(); setActiveSealDetail(null); }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
