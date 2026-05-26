import { UserStats } from "../types";
import { Crosshair, HelpCircle, Award, Target, AlertOctagon, HeartPulse, Zap, Bot, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  stats: UserStats;
}

// Generate clinical ranks
const RANKS = [
  { rank: "Intern", minXp: 0, title: "Level 1: Novice Observer" },
  { rank: "Junior Resident", minXp: 500, title: "Level 2: Ward Responder" },
  { rank: "Senior Resident", minXp: 1500, title: "Level 3: ICU Controller" },
  { rank: "Chief Resident", minXp: 3000, title: "Level 4: Dept Commander" },
  { rank: "Attending", minXp: 6000, title: "Level 5: Master Diagnostician" }
];


export default function ProgressPanel({ stats }: Props) {
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

  // Radar data
  const subjectPerformanceArray = Object.entries(stats.subjectPerformance || {}).map(([subject, data]) => {
    return {
      subject: subject.split(" ")[0], // abbreviate
      accuracy: data.total > 0 ? Math.floor((data.correct / data.total) * 100) : 0,
      fullMark: 100,
    };
  });

  const fallbackRadar = [
    { subject: 'Cardio', accuracy: 0, fullMark: 100 },
    { subject: 'Neuro', accuracy: 0, fullMark: 100 },
    { subject: 'Surg', accuracy: 0, fullMark: 100 },
    { subject: 'Pharm', accuracy: 0, fullMark: 100 },
  ];

  const radarData = subjectPerformanceArray.length > 2 ? subjectPerformanceArray : fallbackRadar;

  const timelineData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    timelineData.push({
      day: dayName,
      cases: (stats.activityLogs && stats.activityLogs[dateStr]) || 0,
      sleep: (stats.sleepLogs && stats.sleepLogs[dateStr]) || 0,
      mcqs: (stats.mcqLogs && stats.mcqLogs[dateStr]) || 0,
      videos: (stats.videoLogs && stats.videoLogs[dateStr]) || 0
    });
  }

  return (
    <div className="flex flex-col gap-8">
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
              <span className="text-4xl font-black tracking-tight text-orange-500">{stats.shiftStreak}</span>
              <span className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-wide">Days</span>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100 text-slate-500 font-medium text-sm leading-relaxed">
            Consistent operations heal background fatigue and boost XP retention multipliers. Keep checking in daily.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Specialty Radar Chart */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-6 flex items-center gap-2 tracking-tight">
            <Crosshair className="w-5 h-5 text-blue-500" />
            Subject Wise Analytics
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {subjectPerformanceArray.length === 0 ? (
              <div className="text-center text-slate-500 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="font-medium text-sm">Insufficient clinical data.<br/>Manually log sessions to build accuracy radar.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#64748b" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} opacity={0.5} />
                  <Radar name="Accuracy %" dataKey="accuracy" stroke="#00f0ff" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 600 }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

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
          <button 
            disabled={reviewLoading}
            onClick={() => reqReview('Daily')}
            className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            End of Day Review
          </button>
          <button 
            disabled={reviewLoading}
            onClick={() => reqReview('Weekly')}
            className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            Weekly Evaluation
          </button>
          <button 
             disabled={reviewLoading}
             onClick={() => reqReview('Monthly')}
             className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all uppercase whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
          >
            Monthly Appraisal
          </button>
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

    </div>
  );
}
