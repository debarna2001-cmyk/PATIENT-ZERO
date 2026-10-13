import React from "react";
import { PatientVitals, MoodLog } from "../types";
import { Activity, Heart, Thermometer, ShieldAlert, Moon, Zap, Brain, BatteryCharging, Coffee, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { sound } from "../lib/audio";

interface VitalsMonitorProps {
  vitals: PatientVitals;
  status: "active" | "stabilized" | "flatlined";
  isCritical: boolean;
  // Integrated Clinical & Biological Reserve Parameters
  patientHealth?: number; // 0 - 100
  burnoutIndex?: number;  // 0 - 100
  studyMode?: 'Normal' | 'Duty' | 'Rest';
  todaySleepHours?: number;
  shiftStreak?: number;
  latestMoodLog?: MoodLog;
  onOpenSleepModal?: () => void;
  onQuickRest?: () => void;
}

export default function VitalsMonitor({
  vitals,
  status,
  isCritical,
  patientHealth,
  burnoutIndex = 0,
  studyMode = 'Normal',
  todaySleepHours = 0,
  shiftStreak = 0,
  latestMoodLog,
  onOpenSleepModal,
  onQuickRest
}: VitalsMonitorProps) {
  // Scientifically grounded allostatic equilibrium states:
  // 1. Optimal Homeostasis (health >= 65): Parasympathetic balance & clear focus
  // 2. Compensated Demand (health 40 - 64): Normal ambulatory study workload
  // 3. Restorative Buffer (health < 40): Gentle pacing buffer to prevent burnout without panic
  const isRecoveryBuffer = (patientHealth !== undefined && patientHealth < 40) || isCritical;
  const isOptimal = patientHealth !== undefined ? patientHealth >= 65 : !isCritical;

  const colorClass = isRecoveryBuffer
    ? "text-indigo-500 dark:text-indigo-400"
    : isOptimal
    ? "text-emerald-500"
    : "text-cyan-500";

  const bgBorderClass = isRecoveryBuffer
    ? "border-indigo-200/80 bg-white/95 dark:border-indigo-900/50 dark:bg-slate-900/90 backdrop-blur-xl"
    : isOptimal
    ? "border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl"
    : "border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl";

  const dataBlockClass = isRecoveryBuffer
    ? "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 backdrop-blur-md"
    : isOptimal
    ? "bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 backdrop-blur-md"
    : "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 backdrop-blur-md";

  const textClass = "text-slate-900 dark:text-slate-100";
  const labelClass = isRecoveryBuffer
    ? "text-indigo-600 dark:text-indigo-400"
    : isOptimal
    ? "text-slate-500 dark:text-slate-400"
    : "text-slate-500 dark:text-slate-400";

  const neonValueClass = isRecoveryBuffer
    ? "text-indigo-600 dark:text-indigo-300"
    : isOptimal
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-cyan-600 dark:text-cyan-400";

  // Check if this instance includes the full integrated patient parameters
  const isIntegratedMode = patientHealth !== undefined;

  return (
    <div className={`border p-6 sm:p-7 rounded-3xl flex flex-col gap-6 shadow-xl ${bgBorderClass} transition-colors duration-500`}>
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isRecoveryBuffer ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400' : isOptimal ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400' : 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400'}`}>
            <Activity className={`w-5 h-5 ${colorClass}`} />
          </div>
          <div>
            <h2 className={`font-black text-lg tracking-tight uppercase flex items-center gap-2 ${textClass}`}>
              Telemetry & Physiological Monitor
              {isIntegratedMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 font-bold tracking-widest">
                  Cognitive Resilience
                </span>
              )}
            </h2>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelClass}`}>
              {isRecoveryBuffer
                ? 'ADAPTIVE RESTORATIVE BUFFER ACTIVE • STEADY PACING'
                : isOptimal
                ? 'PHYSIOLOGICAL HOMEOSTASIS • COGNITIVE ACUITY PEAK'
                : 'COMPENSATED LOAD • EQUILIBRIUM MAINTAINED'}
            </p>
          </div>
        </div>

        {/* Tactical status badges */}
        <div className="flex items-center gap-2">
          {studyMode === 'Rest' && (
            <span className="px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
              Recovery Rest Day Active
            </span>
          )}
          {studyMode === 'Duty' && (
            <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              On-Call Duty (Halved Targets)
            </span>
          )}
          {shiftStreak > 0 && (
            <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs tracking-wider flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              {shiftStreak} Shift Streak
            </span>
          )}
        </div>
      </div>

      {isRecoveryBuffer && (
        <div className="bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between p-4 rounded-2xl">
          <div className="text-indigo-800 dark:text-indigo-300 px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Restorative Reserve Active: Homeostatic buffer is guarded. Long-term adherence is built through calm consistency and restful sleep, not panic.</span>
          </div>
        </div>
      )}

      {/* Primary Clinical ICU Vitals Grid (4 Parameters - Always physiologically realistic) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Heart className="w-3.5 h-3.5 text-rose-500" /> PULSE (HR)
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {vitals.hr}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>BPM</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">Resting: 60-100 bpm</span>
        </div>

        {/* Blood Pressure */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Activity className="w-3.5 h-3.5 text-cyan-500" /> BLOOD PRESSURE
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {vitals.bp.split('/')[0]}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>/{vitals.bp.split('/')[1]} mmHg</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">Normotensive Baseline</span>
        </div>

        {/* Oxygen Saturation */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Activity className="w-3.5 h-3.5 text-indigo-500" /> OXYGEN (SpO₂)
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {vitals.spo2}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>%</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">Normal Room Air: &ge;95%</span>
        </div>

        {/* Temperature */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between ${dataBlockClass}`}>
          <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${labelClass}`}>
            <Thermometer className="w-3.5 h-3.5 text-amber-500" /> CORE TEMP
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <span className={`text-3xl sm:text-4xl font-black tracking-tighter ${neonValueClass}`}>
              {vitals.temp.toFixed(1)}
            </span>
            <span className={`text-xs font-bold ${labelClass}`}>°F</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-1">Afebrile: 98.4-98.7°F</span>
        </div>
      </div>

      {/* Integrated Sleep, Rest, and Physiological Reserve Dashboard Deck */}
      {isIntegratedMode && (
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-cyan-500" /> Biological & Circadian Reserve Matrix
            </span>
            <span className="text-xs font-bold text-slate-500">
              Live Neuro-Somatic Feedback
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Sleep & Circadian Bank */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-400" /> Sleep Rest Reserve
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                  todaySleepHours >= 7 
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : todaySleepHours >= 5
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                }`}>
                  {todaySleepHours >= 7 ? "Optimal Restorative Sleep" : todaySleepHours >= 5 ? "Adequate Baseline" : "Pacing & Rest Recommended"}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {todaySleepHours > 0 ? todaySleepHours : "0"}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">Hours Logged Today</span>
                </div>

                {onOpenSleepModal && (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { sound.click(); onOpenSleepModal(); }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold tracking-wider transition shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Log Sleep
                  </motion.button>
                )}
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${todaySleepHours >= 7 ? 'bg-indigo-500' : todaySleepHours >= 5 ? 'bg-cyan-500' : 'bg-slate-400'}`}
                  style={{ width: `${Math.min(100, (todaySleepHours / 8) * 100)}%` }}
                />
              </div>
            </div>

            {/* 2. Cognitive Load & Burnout Index */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-400" /> Cognitive Burnout Load
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                  burnoutIndex > 65
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                    : burnoutIndex > 35
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                }`}>
                  {burnoutIndex > 65 ? "Elevated Demand (Break Recommended)" : burnoutIndex > 35 ? "Active Focus Load" : "Refreshed & Clear State"}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black tracking-tight ${burnoutIndex > 65 ? 'text-amber-600 dark:text-amber-400' : burnoutIndex > 35 ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {burnoutIndex}%
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">Exhaustion Index</span>
                </div>

                {onQuickRest && (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { sound.click(); onQuickRest(); }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-extrabold tracking-wider transition shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-500" />
                    Rest Break
                  </motion.button>
                )}
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${burnoutIndex > 65 ? 'bg-amber-500' : burnoutIndex > 35 ? 'bg-purple-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, burnoutIndex)}%` }}
                />
              </div>
            </div>

            {/* 3. Overall Patient Preparation Health & Biological Reserve */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-750 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-400" /> Patient Prep Health
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                  patientHealth >= 65
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : patientHealth >= 40
                    ? "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800"
                    : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                }`}>
                  {patientHealth >= 65 ? "Optimal Equilibrium" : patientHealth >= 40 ? "Compensated Performance" : "Restorative Buffer Active"}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black tracking-tight ${patientHealth >= 65 ? 'text-emerald-600 dark:text-emerald-400' : patientHealth >= 40 ? 'text-cyan-600 dark:text-cyan-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {patientHealth}%
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">Integrity Reserve</span>
                </div>

                <div className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-1 rounded-lg">
                  Shift: {studyMode}
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${patientHealth >= 65 ? 'bg-emerald-500' : patientHealth >= 40 ? 'bg-cyan-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, patientHealth))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Neuro-Resilience & Active Procrastination Telemetry Banner */}
          {latestMoodLog && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
                  <Brain className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Biocompatibility:
                  <span className="ml-1.5 font-extrabold text-purple-600 dark:text-purple-400">
                    Level {latestMoodLog.ratingValue}/5 ({latestMoodLog.ratingValue >= 5 ? "Radiant Flow" : latestMoodLog.ratingValue >= 4 ? "High Focus" : latestMoodLog.ratingValue >= 3 ? "Equilibrium" : latestMoodLog.ratingValue >= 2 ? "Fatigued" : "Exhausted"})
                  </span>
                </span>
              </div>

              {latestMoodLog.procrastinationTrigger ? (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-xl font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Procrastination Vector: <span className="italic font-normal">"{latestMoodLog.procrastinationTrigger}"</span></span>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>Attention Vector: Stable / No Active Breach</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
