import { sound } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";
import { UserStats, EmergencyLog, MoodLog } from "../types";
import { Crosshair, HelpCircle, Award, Target, AlertOctagon, HeartPulse, Zap, Bot, Loader2, Sparkles, BookOpen, TrendingUp, TrendingDown, Clock, Activity, Calendar, Brain, BatteryCharging, Coffee, ShieldAlert, ShieldCheck, Star, Crown, Medal, Trophy, Flame, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { formatDateDMY, getDaysAgoISO, getTodayISO } from "../lib/dateUtils";
import ShiftLog from "./ShiftLog";
import { SubTabControl, SubTabItem, SwipeableTabContainer } from "./SubTabControl";

interface Props {
  stats: UserStats;
  logs: EmergencyLog[];
  moodLogs?: MoodLog[];
  onClearLogs?: () => void;
  initialSection?: 'performance' | 'trends' | 'ai_review';
}

// Clinical ranks calibrated for the full 8-14 month residency preparation marathon
export const RANKS = [
  { rank: "Intern", minXp: 0, title: "Level 1: Novice Observer (Orientation)" },
  { rank: "Junior Resident", minXp: 20000, title: "Level 2: Ward Responder (Months 2-3)" },
  { rank: "Senior Resident", minXp: 60000, title: "Level 3: ICU Controller (Months 4-6)" },
  { rank: "Chief Resident", minXp: 120000, title: "Level 4: Dept Commander (Months 7-9)" },
  { rank: "Clinical Fellow", minXp: 190000, title: "Level 5: Specialty Fellow (Months 10-11)" },
  { rank: "Master Attending", minXp: 280000, title: "Level 6: Board Consultant (Months 12-14)" }
];

const ANALYTICS_SUBTABS: SubTabItem<'performance' | 'trends' | 'ai_review'>[] = [
  { id: 'performance', label: 'Performance', icon: <Crosshair className="w-4 h-4 shrink-0" />, activeColor: "text-cyan-700 dark:text-cyan-300" },
  { id: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4 shrink-0" />, activeColor: "text-indigo-700 dark:text-indigo-300" },
  { id: 'ai_review', label: 'AI Review', icon: <Bot className="w-4 h-4 shrink-0" />, activeColor: "text-purple-700 dark:text-purple-300" }
];

export default function ProgressPanel({ stats, logs, moodLogs = [], onClearLogs, initialSection }: Props) {
  const [activeSection, setActiveSection] = useState<'performance' | 'trends' | 'ai_review'>(initialSection || 'performance');

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);
  const [accuracyWindow, setAccuracyWindow] = useState<'dual' | 'rolling' | 'lifetime'>('dual');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState<{ title: string; content: string; actionableAdvice: string[] } | null>(null);

  const reqReview = async (type: 'Daily' | 'Weekly' | 'Monthly') => {
    setReviewLoading(true);
    setReviewData(null);
    try {
      const res = await fetch('/api/metrics/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, type })
      });
      const data = await res.json();
      setReviewData(data);
    } catch {
      setReviewData({ title: "System Error", content: "AI Chief Resident unavailable.", actionableAdvice: [] });
    } finally {
      setReviewLoading(false);
    }
  };

  let currentRankIndex = RANKS.findIndex(r => stats.xp < r.minXp) - 1;
  if (currentRankIndex < 0) currentRankIndex = RANKS.length - 1; 
  if (stats.xp < 500) currentRankIndex = 0;

  const currentRank = RANKS[currentRankIndex];
  const nextRank = RANKS[currentRankIndex + 1];

  let pctToNextRank = 100;
  if (nextRank) {
    const xpIntoRank = stats.xp - currentRank.minXp;
    const xpNeeded = nextRank.minXp - currentRank.minXp;
    pctToNextRank = (xpIntoRank / xpNeeded) * 100;
  }

  // Biocompatibility & Procrastination Analytics
  const validMoods = moodLogs || [];
  const avgResilience = validMoods.length > 0 
    ? (validMoods.reduce((acc, m) => acc + (m.ratingValue || 3), 0) / validMoods.length).toFixed(1)
    : "3.0";
  
  const triggerMap: Record<string, number> = {};
  validMoods.forEach(m => {
    const raw = (m.procrastinationTrigger || "").trim();
    if (raw) {
      let category = raw;
      const lower = raw.toLowerCase();
      if (lower.includes("instagram") || lower.includes("reels") || lower.includes("social") || lower.includes("twitter") || lower.includes("x.com") || lower.includes("reddit")) {
        category = "Social Media / Doomscrolling";
      } else if (lower.includes("youtube") || lower.includes("video") || lower.includes("netflix") || lower.includes("movie") || lower.includes("anime")) {
        category = "Video Streaming / YouTube";
      } else if (lower.includes("sleep") || lower.includes("tired") || lower.includes("fatigue") || lower.includes("exhaust")) {
        category = "Fatigue Paralysis";
      } else if (lower.includes("game") || lower.includes("gaming") || lower.includes("chess")) {
        category = "Gaming";
      } else if (lower.includes("overthink") || lower.includes("anxious") || lower.includes("stress")) {
        category = "Anxiety & Overthinking";
      }
      triggerMap[category] = (triggerMap[category] || 0) + 1;
    }
  });

  const topTriggers = Object.entries(triggerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalProcrastinationEvents = validMoods.filter(m => Boolean(m.procrastinationTrigger?.trim())).length;

  const calculateStudyStreak = (logs: Record<string, number> = {}) => {
    const dates = Object.keys(logs).sort((a,b) => b.localeCompare(a));
    if (!dates.length) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    
    let firstDateStr = dates[0];
    let firstDate = new Date(firstDateStr);
    firstDate.setHours(0,0,0,0);
    
    let diffDays = Math.round((currentDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) return 0;

    for (const d of dates) {
      const logDate = new Date(d);
      logDate.setHours(0,0,0,0);
      const diff = Math.round((currentDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24));
      
      if (diff === 0) {
        if (streak === 0) streak = 1;
      } else if (diff === 1) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }
    return streak;
  };
  
  const dailyStreak = calculateStudyStreak(stats.activityLogs);

  // 30-Day Rolling Window and Lifetime Accuracy Calculations
  const thirtyDaysAgoStr = getDaysAgoISO(30);

  const rollingPerformance: Record<string, { total: number; correct: number }> = {};

  // 1. Incorporate from stats.subjectPerformanceDaily (where date >= 30 days ago)
  if (stats.subjectPerformanceDaily) {
    Object.entries(stats.subjectPerformanceDaily).forEach(([dateKey, dayData]) => {
      if (dateKey >= thirtyDaysAgoStr) {
        Object.entries(dayData).forEach(([subject, perf]) => {
          if (!rollingPerformance[subject]) rollingPerformance[subject] = { total: 0, correct: 0 };
          rollingPerformance[subject].total += perf.total;
          rollingPerformance[subject].correct += perf.correct;
        });
      }
    });
  }

  // 2. Incorporate from logs (EmergencyLog[]) from the past 30 days
  logs.forEach(log => {
    let logDateStr = log.date;
    if (!logDateStr && log.id && log.id.startsWith("log-")) {
      const epoch = parseInt(log.id.replace("log-", ""), 10);
      if (!isNaN(epoch) && epoch > 0) {
        logDateStr = new Date(epoch).toISOString().split("T")[0];
      }
    }
    if (logDateStr && logDateStr >= thirtyDaysAgoStr && log.specialty) {
      if (!stats.subjectPerformanceDaily || !stats.subjectPerformanceDaily[logDateStr]) {
        if (!rollingPerformance[log.specialty]) rollingPerformance[log.specialty] = { total: 0, correct: 0 };
        rollingPerformance[log.specialty].total += 1;
        if (log.result === "STABILIZED") {
          rollingPerformance[log.specialty].correct += 1;
        }
      }
    }
  });

  const allSpecialties = Array.from(new Set([
    ...Object.keys(stats.subjectPerformance || {}),
    ...Object.keys(rollingPerformance)
  ])).sort();

  const comparisonData = allSpecialties.map(sub => {
    const lifetime = stats.subjectPerformance?.[sub] || { total: 0, correct: 0 };
    const rolling = rollingPerformance[sub] || { total: 0, correct: 0 };

    const lifetimeAcc = lifetime.total > 0 ? Math.round((lifetime.correct / lifetime.total) * 100) : 0;
    const rollingAcc = rolling.total > 0 ? Math.round((rolling.correct / rolling.total) * 100) : 0;
    const delta = rolling.total > 0 && lifetime.total > 0 ? rollingAcc - lifetimeAcc : 0;

    return {
      subject: sub.split(" ")[0].slice(0, 8),
      fullSubject: sub,
      lifetimeAccuracy: lifetimeAcc,
      lifetimeTotal: lifetime.total,
      rollingAccuracy: rollingAcc,
      rollingTotal: rolling.total,
      hasRolling: rolling.total > 0,
      delta
    };
  });

  const fallbackSubjectData = [
    { subject: 'Cardio', fullSubject: 'Cardiology', lifetimeAccuracy: 0, lifetimeTotal: 0, rollingAccuracy: 0, rollingTotal: 0, hasRolling: false, delta: 0 },
    { subject: 'Neuro', fullSubject: 'Neurology', lifetimeAccuracy: 0, lifetimeTotal: 0, rollingAccuracy: 0, rollingTotal: 0, hasRolling: false, delta: 0 },
    { subject: 'Surg', fullSubject: 'General Surgery', lifetimeAccuracy: 0, lifetimeTotal: 0, rollingAccuracy: 0, rollingTotal: 0, hasRolling: false, delta: 0 },
    { subject: 'Pharm', fullSubject: 'Pharmacology', lifetimeAccuracy: 0, lifetimeTotal: 0, rollingAccuracy: 0, rollingTotal: 0, hasRolling: false, delta: 0 },
  ];

  const subjectChartData = comparisonData.length > 0 ? comparisonData : fallbackSubjectData;

  const totalLifetimeAttempts = Object.values(stats.subjectPerformance || {}).reduce((acc, curr) => acc + curr.total, 0);
  const totalLifetimeCorrect = Object.values(stats.subjectPerformance || {}).reduce((acc, curr) => acc + curr.correct, 0);
  const lifetimeOverallAcc = totalLifetimeAttempts > 0 ? Math.round((totalLifetimeCorrect / totalLifetimeAttempts) * 100) : 0;

  const totalRollingAttempts = Object.values(rollingPerformance).reduce((acc, curr) => acc + curr.total, 0);
  const totalRollingCorrect = Object.values(rollingPerformance).reduce((acc, curr) => acc + curr.correct, 0);
  const rollingOverallAcc = totalRollingAttempts > 0 ? Math.round((totalRollingCorrect / totalRollingAttempts) * 100) : 0;
  const overallDelta = totalRollingAttempts > 0 && totalLifetimeAttempts > 0 ? rollingOverallAcc - lifetimeOverallAcc : 0;

  const timelineData = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = getDaysAgoISO(i);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
    timelineData.push({
      day: dayName,
      cases: (stats.triageCasesLogs && stats.triageCasesLogs[dateStr]) || 0,
      sleep: (stats.sleepLogs && stats.sleepLogs[dateStr]) || 0,
      mcqs: (stats.mcqLogs && stats.mcqLogs[dateStr]) || 0,
      videos: (stats.videoLogs && stats.videoLogs[dateStr]) || 0
    });
  }

  const analyticsSectionsList: ('performance' | 'trends' | 'ai_review')[] = ['performance', 'trends', 'ai_review'];
  const handleAnalyticsSwipeLeft = () => {
    const idx = analyticsSectionsList.indexOf(activeSection);
    if (idx < analyticsSectionsList.length - 1) {
      setActiveSection(analyticsSectionsList[idx + 1]);
    }
  };
  const handleAnalyticsSwipeRight = () => {
    const idx = analyticsSectionsList.indexOf(activeSection);
    if (idx > 0) {
      setActiveSection(analyticsSectionsList[idx - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto w-full">
      {/* Sticky Segmented Sub-Tab Switcher */}
      <SubTabControl
        tabs={ANALYTICS_SUBTABS}
        activeTab={activeSection}
        onChange={setActiveSection}
        layoutId="analytics-subtab-pill"
        ariaLabel="Analytics sections"
        sticky={true}
      />

      <SwipeableTabContainer
        onSwipeLeft={handleAnalyticsSwipeLeft}
        onSwipeRight={handleAnalyticsSwipeRight}
        className="w-full"
      >
        <AnimatePresence mode="wait">
          {activeSection === "performance" && (
            <motion.div
              key="panel-performance"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6"
            >
              {/* Visual Header Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-6">
        
        {/* Core Rank Badge */}
        <div className="md:border-r border-slate-200 dark:border-slate-800 md:pr-6 flex flex-col justify-between relative">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Operational Rank</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{currentRank.rank}</span>
              <p className="text-sm font-medium text-slate-500">{currentRank.title}</p>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
              <span>Progress To Next Level</span>
              <span>{stats.xp} XP</span>
            </div>
            <div className="relative h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800/50">
              <div style={{ width: `${pctToNextRank}%` }} className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 tracking-wide">
              <span>{currentRank.rank}</span>
              <span>{nextRank ? `${nextRank.minXp} XP (${nextRank.rank})` : "Max Level"}</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Success Quotient */}
        <div className="md:border-r border-slate-200 dark:border-slate-800 md:px-6 flex flex-col justify-between relative">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Stabilization Success</span>
          <div className="flex justify-between items-baseline mt-2">
            <div>
              <span className="text-4xl font-black text-emerald-500 tracking-tight">{stats.patientsSaved}</span>
              <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wide">Saved</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-rose-500 tracking-tight">{stats.patientsFlatlined}</span>
              <span className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">Crashed</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center tracking-wide">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Solve Survival Rate</span>
            <span className="font-bold text-emerald-500 text-lg tracking-tight">
              {stats.patientsSaved + stats.patientsFlatlined > 0 
                ? `${Math.floor((stats.patientsSaved / (stats.patientsSaved + stats.patientsFlatlined)) * 100)}%`
                : "No data"}
            </span>
          </div>
        </div>

        {/* Focus Momentum */}
        <div className="md:pl-6 flex flex-col justify-between relative">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Academic Streak</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm mt-1">
              <Zap className="w-7 h-7" />
            </div>
            <div className="flex items-baseline">
              <span className="text-4xl font-black tracking-tight text-orange-500">{dailyStreak}</span>
              <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wide">Days</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100 text-slate-500 font-medium text-sm leading-relaxed">
            Consistent operations heal background fatigue and boost XP retention multipliers. Keep checking in daily.
          </div>
        </div>
      </div>

      {/* 30-Day Rolling Accuracy Window & Lifetime Mastery Section */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 tracking-tight">
              <Crosshair className="w-5 h-5 text-indigo-500" />
              Subject Mastery & 30-Day Rolling Accuracy
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Evaluates recent 30-day cognitive retention alongside historical lifetime track records.
            </p>
          </div>

          {/* View toggle controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start md:self-auto border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => { sound.click(); setAccuracyWindow('dual'); }}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider ${
                accuracyWindow === 'dual'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Dual Comparison
            </button>
            <button
              onClick={() => { sound.click(); setAccuracyWindow('rolling'); }}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider ${
                accuracyWindow === 'rolling'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              30-Day Rolling
            </button>
            <button
              onClick={() => { sound.click(); setAccuracyWindow('lifetime'); }}
              className={`px-3 py-1.5 rounded-lg transition uppercase tracking-wider ${
                accuracyWindow === 'lifetime'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Lifetime Only
            </button>
          </div>
        </div>

        {/* Aggregate KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Mastery Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{lifetimeOverallAcc}%</span>
              <span className="text-xs text-slate-500 font-semibold">({totalLifetimeAttempts} total attempts)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Cumulative career diagnostic accuracy</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">30-Day Rolling Window</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{rollingOverallAcc}%</span>
              <span className="text-xs text-slate-500 font-semibold">({totalRollingAttempts} recent cases)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Window: <span className="text-emerald-500 font-mono font-bold">{formatDateDMY(thirtyDaysAgoStr)}</span> to <span className="text-emerald-500 font-mono font-bold">{formatDateDMY(getTodayISO())}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Momentum / Velocity Δ</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black flex items-center gap-1 ${
                overallDelta > 0 ? 'text-emerald-500' : overallDelta < 0 ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {overallDelta > 0 ? `+${overallDelta}%` : `${overallDelta}%`}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {overallDelta > 0 ? (
                  <span className="text-emerald-500 font-bold flex items-center"><TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" /> Improving</span>
                ) : overallDelta < 0 ? (
                  <span className="text-rose-500 font-bold flex items-center"><TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" /> Cognitive Slip</span>
                ) : (
                  <span>Consistent</span>
                )}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Net shift vs lifetime baseline</div>
          </div>
        </div>

        {/* Visual Chart */}
        <div className="h-72 w-full flex items-center justify-center mb-6">
          {comparisonData.length === 0 ? (
            <div className="text-center text-slate-500 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl w-full">
              <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-medium text-sm">Insufficient clinical data.<br/>Run triage shifts or log MCQs to populate the 30-day rolling accuracy window.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis yAxisId="left" stroke="#6366f1" orientation="left" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" stroke="#10b981" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-sm text-indigo-300">{data.fullSubject}</p>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Lifetime Mastery:</span>
                            <span className="font-bold text-white">{data.lifetimeAccuracy}% ({data.lifetimeTotal} cases)</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-300">
                            <span>30-Day Rolling:</span>
                            <span className="font-bold text-emerald-400">{data.hasRolling ? `${data.rollingAccuracy}% (${data.rollingTotal} cases)` : 'No recent data'}</span>
                          </div>
                          {data.hasRolling && data.lifetimeTotal > 0 && (
                            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                              <span>Momentum Δ:</span>
                              <span className={`font-bold ${data.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {accuracyWindow === 'dual' && (
                  <>
                    <Bar yAxisId="left" dataKey="lifetimeAccuracy" name="Lifetime %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="rollingAccuracy" name="30-Day Rolling %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </>
                )}
                {accuracyWindow === 'rolling' && (
                  <>
                    <Bar yAxisId="left" dataKey="rollingAccuracy" name="30-Day Accuracy %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="rollingTotal" name="30-Day Cases" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </>
                )}
                {accuracyWindow === 'lifetime' && (
                  <>
                    <Bar yAxisId="left" dataKey="lifetimeAccuracy" name="Lifetime %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="lifetimeTotal" name="Lifetime Total Cases" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Detailed Per-Specialty Breakdown Cards */}
        {comparisonData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5">
            {comparisonData.map((item, idx) => (
              <div key={idx} className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 tracking-tight">{item.fullSubject}</span>
                  {item.hasRolling ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      item.delta > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        : item.delta < 0
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {item.delta > 0 ? <TrendingUp className="w-3 h-3" /> : item.delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">
                      Lifetime Only
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-500 font-medium mb-0.5">
                      <span>Lifetime</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.lifetimeAccuracy}% ({item.lifetimeTotal})</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.lifetimeAccuracy}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-500 font-medium mb-0.5">
                      <span>30-Day Rolling</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.hasRolling ? `${item.rollingAccuracy}% (${item.rollingTotal})` : '—'}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.hasRolling ? item.rollingAccuracy : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )}

{activeSection === "trends" && (
  <motion.div
    key="panel-trends"
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 8 }}
    transition={{ duration: 0.15 }}
    className="flex flex-col gap-6"
  >
    <div className="grid grid-cols-1 gap-6">
        {/* Temporal Data Vitals graph (Real) */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 tracking-tight">
              <HeartPulse className="w-5 h-5 text-indigo-500" />
              Activity & Sleep Telemetry
            </h3>
          </div>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="cases" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cases Solved" />
                <Bar dataKey="mcqs" fill="#f59e0b" radius={[4, 4, 0, 0]} name="MCQs (Marrow)" />
                <Bar dataKey="videos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Videos (Marrow)" />
                <Bar dataKey="sleep" fill="#10b981" radius={[4, 4, 0, 0]} name="Sleep (Hours)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-4 tracking-wide uppercase">Weekly Historical Data</p>
        </div>
      </div>

      {/* Biocompatibility & Procrastination Analysis Deck */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">
                Biocompatibility & Attention Drift Matrix
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Cognitive resilience correlation, procrastination traps, and focus telemetry
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
            {validMoods.length} Biocompatibility Reports Logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mean Resilience Index */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resilience Index</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                Number(avgResilience) >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                Number(avgResilience) >= 3 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {Number(avgResilience) >= 4 ? 'Radiant Flow' : Number(avgResilience) >= 3 ? 'Equilibrium' : 'Depleted'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{avgResilience}</span>
              <span className="text-xs font-bold text-slate-400">/ 5.0 Average</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-2">
              Modulates autonomic tone, daily health recovery, and cognitive burnout load.
            </p>
          </div>

          {/* Procrastination Hazard Vector */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attention Slips</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                {totalProcrastinationEvents} Logged
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{totalProcrastinationEvents}</span>
              <span className="text-xs font-bold text-slate-400">Breaches</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-2">
              Attention drifts apply subtle cognitive friction notes without compromising long-term baseline stability.
            </p>
          </div>

          {/* Neuro-Somatic Strategy */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Countermeasure</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">Active</span>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
              {stats.burnoutIndex > 50 
                ? "Prescribe Recovery Shift: Trigger Rest Mode or a brief mindfulness reset to replenish cognitive reserve."
                : totalProcrastinationEvents > 2
                ? "Micro-Dosing MCQs: Start with just 3 rapid cases to overcome activation inertia."
                : "Equilibrium Sustained: Maintain steady deep-work intervals with scheduled breaks."}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 mt-2">Clinical habit intervention</span>
          </div>
        </div>

        {/* Identified Procrastination Traps Breakdown */}
        {topTriggers.length > 0 && (
          <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Primary Distraction Vectors Detected
            </span>
            <div className="flex flex-wrap gap-2.5">
              {topTriggers.map(([trigger, count], i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm">
                  <span>{trigger}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 font-bold text-[10px]">
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clinical Operation History */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">Clinical Operation History</h3>
          {onClearLogs && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={onClearLogs} className="text-xs font-bold text-rose-600 hover:text-rose-700 transition px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
              Purge Logs
            </motion.button>
          )}
        </div>
        <ShiftLog logs={logs} />
      </div>
    </motion.div>
  )}

{activeSection === "ai_review" && (
  <motion.div
    key="panel-ai_review"
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 8 }}
    transition={{ duration: 0.15 }}
    className="flex flex-col gap-6"
  >
    {/* AI Chief Resident Oversight */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 tracking-tight">
            <Bot className="w-6 h-6 text-indigo-500" />
            AI Chief Resident Oversight
          </h3>
        </div>
        
        {!reviewData && !reviewLoading && (
          <div className="text-slate-500 font-medium text-sm mb-6 relative z-10 leading-relaxed border-l-2 border-indigo-200 dark:border-indigo-900 pl-4">
            Awaiting your command. Generate an AI performance review to analyze your recent health metrics, case outcomes, burnout levels, and sleep telemetry.
          </div>
        )}

        <div className="flex gap-3 mb-6 relative z-10 overflow-x-auto pb-2">
          <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
            disabled={reviewLoading}
            onClick={() => reqReview('Daily')}
            className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            End of Day Review
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
            disabled={reviewLoading}
            onClick={() => reqReview('Weekly')}
            className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            Weekly Evaluation
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
             disabled={reviewLoading}
             onClick={() => reqReview('Monthly')}
             className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            Monthly Appraisal
          </motion.button>
        </div>

        {reviewLoading && (
           <div className="flex flex-col items-center justify-center py-10">
             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analyzing Telemetry Data...</p>
           </div>
        )}

        {reviewData && !reviewLoading && (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 relative z-10">
             <h4 className="font-black text-indigo-900 dark:text-indigo-200 text-lg mb-3 tracking-tight flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-indigo-500" />
               {reviewData.title}
             </h4>
             <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium">
               {reviewData.content}
             </p>
             <h5 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-3">Priority Action Items</h5>
             <ul className="space-y-3">
               {reviewData.actionableAdvice.map((advice, i) => (
                 <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 px-4 py-3 rounded-xl border border-indigo-50 dark:border-indigo-900/20 shadow-sm font-medium">
                   <Target className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                   {advice}
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>

      {/* High-Yield Clinical Pearls Vault */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 tracking-tight">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            High-Yield Clinical Pearls
          </h3>
          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">{logs.filter(l => l.result === "STABILIZED").length} Pearls Unlocked</span>
        </div>
        
        {logs.filter(l => l.result === "STABILIZED").length === 0 ? (
           <div className="text-center text-slate-500 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl">
             <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
             <p className="font-medium text-sm">No clinical pearls acquired yet.<br/>Successfully stabilize patients in Triage to unlock high-yield pearls.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs.filter(l => l.result === "STABILIZED").map((log, idx) => (
              <div key={idx} className="bg-indigo-50/50 dark:bg-slate-900/50 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl flex flex-col h-full group transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md">{log.specialty}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{log.timestamp.length > 8 ? log.timestamp.split(',')[0] : log.timestamp}</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-relaxed mb-4">{log.pearl}</p>
                  <div className="mt-auto px-4 py-3 bg-white dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Diagnosis Context</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1">{log.correctAnswer}</p>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )}
        </AnimatePresence>
      </SwipeableTabContainer>
    </div>
  );
}
