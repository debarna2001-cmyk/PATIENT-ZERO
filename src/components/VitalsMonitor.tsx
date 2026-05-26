import { PatientVitals } from "../types";
import { Activity, Heart, Thermometer, ShieldAlert } from "lucide-react";

interface VitalsMonitorProps {
  vitals: PatientVitals;
  status: "active" | "stabilized" | "flatlined";
  isCritical: boolean;
}

export default function VitalsMonitor({ vitals, status, isCritical }: VitalsMonitorProps) {
  const colorClass = status === "flatlined"
    ? "text-rose-500"
    : isCritical
    ? "text-amber-500"
    : "text-emerald-500";

  const bgBorderClass = status === "flatlined"
    ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/50 dark:bg-rose-950/80 backdrop-blur-xl dark:shadow-[0_0_20px_rgba(244,63,94,0.15)]"
    : isCritical
    ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/50 dark:bg-amber-950/80 backdrop-blur-xl dark:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    : "border-white/40 bg-white dark:bg-slate-900/40 dark:border-emerald-500/30 dark:bg-slate-900/80 backdrop-blur-xl dark:shadow-[0_0_20px_rgba(16,185,129,0.1)]";

  const dataBlockClass = status === "flatlined"
    ? "bg-rose-50/50 border-rose-100 dark:bg-rose-950/50 dark:border-rose-900/50 backdrop-blur-md"
    : isCritical
    ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/50 dark:border-amber-900/50 backdrop-blur-md"
    : "bg-white dark:bg-slate-900/50 border-white/60 dark:bg-slate-900/50 dark:border-slate-700/60 backdrop-blur-md";

  const textClass = status === "flatlined"
    ? "text-rose-900 dark:text-rose-400"
    : isCritical
    ? "text-amber-900 dark:text-amber-400"
    : "text-slate-900 dark:text-slate-200";

  const labelClass = status === "flatlined"
    ? "text-rose-600 dark:text-rose-500"
    : isCritical
    ? "text-amber-600 dark:text-amber-500"
    : "text-slate-500 dark:text-slate-400";

  const neonValueClass = status === "flatlined"
    ? "text-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]"
    : isCritical
    ? "text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]"
    : "text-emerald-600 drop-shadow-[0_0_8px_rgba(5,150,105,0.6)]";

  return (
    <div className={`border p-6 rounded-3xl flex flex-col gap-6 shadow-xl ${bgBorderClass} transition-colors duration-500`}>
      {/* Title block */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${status === 'flatlined' ? 'bg-rose-100' : isCritical ? 'bg-amber-100' : 'bg-emerald-100'}`}>
            <Activity className={`w-5 h-5 ${colorClass} ${status !== 'stabilized' && 'animate-pulse'}`} />
          </div>
          <div>
            <h2 className={`font-bold text-lg tracking-tight ${textClass}`}>
              Telemetry Monitor
            </h2>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {status === 'flatlined' ? 'CRITICAL FAILURE' : isCritical ? 'ELEVATED STRESS' : 'RHYTHM NORMAL'}
            </p>
          </div>
        </div>
      </div>

      {status === "flatlined" && (
        <div className="bg-rose-500/10 border border-rose-300 z-10 flex flex-col items-center justify-center p-6 rounded-2xl mb-4">
          <div className="text-rose-600 bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
            <ShieldAlert className="w-4 h-4" /> ASYSTOLE ALARM
          </div>
        </div>
      )}

      {/* Digital display grids */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-6 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Heart className="w-3.5 h-3.5" /> PULSE (HR)
          </span>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {status === "flatlined" ? "0" : vitals.hr}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>BPM</span>
          </div>
        </div>

        <div className={`border rounded-2xl p-6 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Activity className="w-3.5 h-3.5" /> SYS/DIAS
          </span>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {status === "flatlined" ? "0" : vitals.bp.split('/')[0]}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>mmHg</span>
          </div>
        </div>

        <div className={`border rounded-2xl p-6 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Heart className="w-3.5 h-3.5 rotate-90" /> SpO₂
          </span>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {status === "flatlined" ? "0" : vitals.spo2}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>%</span>
          </div>
        </div>

        <div className={`border rounded-2xl p-6 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Thermometer className="w-3.5 h-3.5" /> TEMP
          </span>
          <div className="flex items-baseline justify-between mt-4">
            <span className={`text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {status === "flatlined" ? "95.0" : vitals.temp.toFixed(1)}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>°F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
