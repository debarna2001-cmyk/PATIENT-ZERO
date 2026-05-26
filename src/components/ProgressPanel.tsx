import { UserStats } from "../types";
import { Award, Target, Crosshair, HelpCircle, AlertOctagon, HeartPulse, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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

const mockTimelineData = [
  { day: 'Mon', stability: 65, burnout: 80 },
  { day: 'Tue', stability: 50, burnout: 85 },
  { day: 'Wed', stability: 70, burnout: 60 },
  { day: 'Thu', stability: 85, burnout: 40 },
  { day: 'Fri', stability: 78, burnout: 55 },
  { day: 'Sat', stability: 92, burnout: 30 },
  { day: 'Sun', stability: 88, burnout: 22 },
];

export default function ProgressPanel({ stats }: Props) {
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
  const subjectPerformanceArray = Object.entries(stats.subjectPerformance).map(([subject, data]) => {
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
            Diagnostic Accuracy Map
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {subjectPerformanceArray.length === 0 ? (
              <div className="text-center text-slate-500 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 p-6 rounded-2xl">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-sm">Insufficient clinical data.<br/>Admit more cases to build accuracy radar.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar name="Accuracy %" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Temporal Data Vitals graph (Mocked) */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2 tracking-tight">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              Patient Stabilization Trend
            </h3>
          </div>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTimelineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="stability" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} name="Health Index" />
                <Line type="monotone" dataKey="burnout" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2 }} name="Fatigue Index" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-4 tracking-wide uppercase">Weekly Telemetry Overview (Simulated Projection)</p>
        </div>
      </div>
    </div>
  );
}
