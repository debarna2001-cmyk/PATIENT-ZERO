import { AlertOctagon, RefreshCw, Save } from "lucide-react";
import { useState } from "react";

interface Props {
  daysToExam: number;
  studentName: string;
  targetSpecialty: string;
  onUpdateDays: (days: number) => void;
  onUpdateProfile: (name: string, specialty: string, year: number) => void;
  onHardReset: () => void;
}

export default function SettingsPanel({ daysToExam, studentName, targetSpecialty, onUpdateDays, onUpdateProfile, onHardReset }: Props) {
  const [days, setDays] = useState(daysToExam);
  const [name, setName] = useState(studentName);
  const [specialty, setSpecialty] = useState(targetSpecialty);

  const handleSaveDays = () => {
    onUpdateDays(days);
    alert("Countdown updated.");
  };

  const handleSaveProfile = () => {
    onUpdateProfile(name, specialty, new Date().getFullYear() + 1);
    alert("Profile updated.");
  };

  const handleReset = () => {
    if (confirm("WARNING: This will wipe all persistence storage. Are you sure?")) {
      onHardReset();
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-700 pb-4 mb-6">Avatar Config</h3>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avatar Designation</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Protocol (Specialty)</label>
            <input 
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>
        </div>
        <button 
          onClick={handleSaveProfile}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Avatar Sync
        </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-700 pb-4 mb-6">Simulation Variables</h3>
        
        <div className="flex flex-col gap-4 max-w-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">T-Minus (Days Left)</label>
          <div className="flex gap-3">
            <input 
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              min="1"
            />
            <button 
              onClick={handleSaveDays}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Update
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-900/30 border border-red-500/30 rounded-3xl p-8 shadow-xl">
         <h3 className="font-bold text-rose-900 text-xl tracking-tight border-b border-rose-200/50 pb-4 mb-6 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          Danger Zone
        </h3>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-rose-800">Emergency Protocol: System Reset</h4>
            <p className="text-sm text-rose-600/80 font-medium mt-1">Permanently format all patient records, XP, and mission progress.</p>
          </div>
          <button 
            onClick={handleReset}
            className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 flex items-center gap-2 shrink-0 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Initiate Clean Wipe
          </button>
        </div>
      </div>

    </div>
  );
}
