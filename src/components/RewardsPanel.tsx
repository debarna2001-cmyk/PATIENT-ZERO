import { Award, Lock, Star, ShieldCheck, BatteryCharging, BrainCircuit } from "lucide-react";

interface Props {
  xp: number;
  patientsSaved: number;
  shiftStreak: number;
}

const BADGES = [
  { id: "b1", title: "First Blood", description: "Successfully stabilized your first critical patient.", condition: (c: Props) => c.patientsSaved >= 1, icon: <ShieldCheck className="w-6 h-6" /> },
  { id: "b2", title: "Iron Focus", description: "Maintain a 3-day operational shift streak.", condition: (c: Props) => c.shiftStreak >= 3, icon: <BatteryCharging className="w-6 h-6" /> },
  { id: "b3", title: "Ward Veteran", description: "Achieve 10+ clinical saves.", condition: (c: Props) => c.patientsSaved >= 10, icon: <Star className="w-6 h-6" /> },
  { id: "b4", title: "Diagnostic Genius", description: "Attain overall Level 3 (1500 XP).", condition: (c: Props) => c.xp >= 1500, icon: <BrainCircuit className="w-6 h-6" /> },
  { id: "b5", title: "Unbreakable", description: "Hold a flawless 14-day study streak.", condition: (c: Props) => c.shiftStreak >= 14, icon: <Award className="w-6 h-6" /> },
];

export default function RewardsPanel(props: Props) {
  const unlockedCount = BADGES.filter(b => b.condition(props)).length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm text-center">
        <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Clinical Achievements</h2>
        <p className="text-slate-500 font-medium text-sm mt-2 max-w-md mx-auto">Unlock operational seals by stabilizing patients, adhering to protocols, and retaining academic consistency.</p>
        
        <div className="mt-6 inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm">
          <span className="text-slate-500 uppercase tracking-widest text-xs">Total Seals Unlocked:</span>
          <span className="text-orange-600">{unlockedCount} / {BADGES.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BADGES.map((badge) => {
          const isUnlocked = badge.condition(props);
          return (
            <div 
              key={badge.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col gap-4 ${
                isUnlocked 
                  ? "bg-white dark:bg-slate-900 border-orange-200 shadow-lg shadow-orange-500/5 hover:-translate-y-1" 
                  : "bg-slate-50 dark:bg-slate-950/50/50 border-slate-200 dark:border-slate-800 grayscale opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-4 rounded-2xl ${isUnlocked ? 'bg-orange-50 text-orange-500' : 'bg-slate-200 text-slate-400'}`}>
                  {isUnlocked ? badge.icon : <Lock className="w-6 h-6" />}
                </div>
                {isUnlocked && <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-widest border border-orange-200">Earned</span>}
              </div>
              
              <div>
                <h4 className={`font-bold text-lg tracking-tight ${isUnlocked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{badge.title}</h4>
                <p className={`text-sm font-medium mt-1 ${isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
