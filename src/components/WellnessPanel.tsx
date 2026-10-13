import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sound } from "../lib/audio";
import { 
  ShieldCheck, Heart, Sparkles, Wind, Eye, Moon, Flame, 
  RotateCcw, CheckCircle2, Award, Clock, ArrowRight, ShieldAlert,
  Activity, Play, Check
} from "lucide-react";
import { UserStats } from "../types";
import { RestorativeGuidanceModal, RestorativeProtocol } from "./RestorativeGuidanceModal";
import { formatDateDMY, formatDateTimeDMY } from "../lib/dateUtils";

const EVIDENCE_PROTOCOLS: RestorativeProtocol[] = [
  {
    id: "proto-sigh",
    name: "Physiological Sigh (Vagal Brake Reset)",
    category: "Autonomic Reset",
    durationMinutes: 3,
    evidence: "Two swift nasal inhalations followed by long oral exhalation triggers immediate vagal parasympathetic activation.",
    benefitBurnout: 8,
    benefitResilience: 8,
    icon: <Wind className="w-5 h-5 text-cyan-500" />
  },
  {
    id: "proto-optic",
    name: "15-Min Optic Flow & Outdoor Walk",
    category: "Optic Pacing",
    durationMinutes: 15,
    evidence: "Lateral eye motion from panoramic ambient vision quietens amygdalar threat alerts and refreshes working memory.",
    benefitBurnout: 10,
    benefitResilience: 7,
    icon: <Eye className="w-5 h-5 text-emerald-500" />
  },
  {
    id: "proto-nsdr",
    name: "20-Min NSDR / Non-Sleep Deep Rest",
    category: "Neuro-Rest",
    durationMinutes: 20,
    evidence: "Clears extracellular adenosine and restores prefrontal dopaminergic stores after deep study blocks.",
    benefitBurnout: 14,
    benefitResilience: 12,
    icon: <Moon className="w-5 h-5 text-indigo-500" />
  },
  {
    id: "proto-buffer",
    name: "Evening Cognitive Decoupling Buffer",
    category: "Circadian Buffer",
    durationMinutes: 30,
    evidence: "Protected non-medical relaxation before bedtime shields slow-wave sleep and long-term memory consolidation.",
    benefitBurnout: 16,
    benefitResilience: 14,
    icon: <Heart className="w-5 h-5 text-rose-500" />
  }
];

interface Props {
  stats: UserStats;
  onUpdateStats: (updater: (prev: UserStats) => UserStats) => void;
}

export default function WellnessPanel({ stats, onUpdateStats }: Props) {
  const [activeProtocol, setActiveProtocol] = useState<RestorativeProtocol | null>(null);
  const [sessionSuccessToast, setSessionSuccessToast] = useState<string | null>(null);

  const streak = stats.shiftStreak || 0;
  const shields = stats.streakShields || 0;
  const maxShields = 3;
  
  // Progress toward next shield: every 7 days gives 1 shield
  const daysIntoCurrentCycle = streak % 7;
  const daysNeededForNextShield = streak > 0 && daysIntoCurrentCycle === 0 ? 0 : 7 - daysIntoCurrentCycle;
  const cyclePercent = Math.round((daysIntoCurrentCycle / 7) * 100);

  const handleProtocolComplete = (protocol: RestorativeProtocol) => {
    sound.stabilizationChime();
    const completedTimestamp = new Date().toISOString();
    
    onUpdateStats(prev => {
      const currentBurnout = prev.burnoutIndex || 0;
      const currentHealth = prev.patientHealth || 100;
      const currentHistory = prev.restorativeHistory || [];

      const nextBurnout = Math.max(0, currentBurnout - protocol.benefitBurnout);
      const nextHealth = Math.min(100, currentHealth + protocol.benefitResilience);

      const newHistoryItem = {
        id: `rest-${Date.now()}`,
        protocolId: protocol.id,
        protocolName: protocol.name,
        durationMinutes: protocol.durationMinutes,
        completedAt: completedTimestamp,
        burnoutReduction: protocol.benefitBurnout
      };

      return {
        ...prev,
        burnoutIndex: nextBurnout,
        patientHealth: nextHealth,
        restorativeHistory: [newHistoryItem, ...currentHistory.slice(0, 20)]
      };
    });

    setActiveProtocol(null);
    setSessionSuccessToast(`Completed ${protocol.name}: -${protocol.benefitBurnout}% Burnout, +${protocol.benefitResilience}% Reserve!`);
    setTimeout(() => setSessionSuccessToast(null), 4000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-12">
      {/* Toast */}
      <AnimatePresence>
        {sessionSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-xl"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {sessionSuccessToast}
            </span>
            <button onClick={() => setSessionSuccessToast(null)} className="opacity-70 hover:opacity-100 uppercase text-[10px]">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-indigo-900/40 border border-cyan-800/40 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Allostatic Reserve & Cognitive Safeguards
              </span>
              <span className="text-xs text-slate-400 font-mono">NEET PG Endurance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Clinical Wellness & Shift Safeguards
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
              Medical preparation is an allostatic marathon. Deploy evidence-based nervous system recovery protocols and earn streak-protective Allostatic Shift Shields to safeguard your momentum against 24h duty disruptions.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-2xl shadow-sm shrink-0">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/80 rounded-xl text-cyan-600 dark:text-cyan-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Vitals Status</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.patientHealth}% Reserve</span>
                <span className="text-xs text-slate-500 font-semibold">• {stats.burnoutIndex}% Strain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALLOSTATIC SHIFT SHIELD (STREAK-BASED MECHANIC) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight">
                Allostatic Shift Shield Safeguard
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
              Automatic buffer against emergency hospital calls, 24-hour on-call duty, or severe cognitive fatigue. Absorbs missed days so your habit streak and behavioral momentum never collapse.
            </p>
          </div>

          {/* Shield Tokens Visual */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const isHeld = slotIdx < shields;
                return (
                  <div
                    key={slotIdx}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isHeld
                        ? "bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/20"
                        : "border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 opacity-50"
                    }`}
                    title={isHeld ? `Banked Shift Shield #${slotIdx + 1}` : "Empty Shield Slot"}
                  >
                    <ShieldCheck className={`w-5 h-5 ${isHeld ? "animate-pulse" : ""}`} />
                  </div>
                );
              })}
            </div>
            <div className="pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Banked</span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                {shields} of {maxShields} Max
              </span>
            </div>
          </div>
        </div>

        {/* Streak Earning Mechanism */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">How Shields Are Earned</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              Earned biologically every <strong>7 consecutive cleared shifts</strong>. Rewards sustainable daily rhythm and habit preservation.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Cadence:</span>
              <span className="text-emerald-500">7 Days = 1 Shield</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress To Next Shield</span>
            <div className="mt-2">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">
                  {daysIntoCurrentCycle} / 7 Days Cleared
                </span>
                <span className="text-cyan-500">{cyclePercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  style={{ width: `${cyclePercent}%` }}
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Remaining:</span>
              <span className="text-cyan-600 dark:text-cyan-400">
                {daysNeededForNextShield === 0 ? "Eligible on next shift!" : `${daysNeededForNextShield} days to next Shield`}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-Buffering Protection</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              {shields > 0 
                ? "Active: If you miss a calendar day due to ward emergencies or recovery, 1 Shield will auto-deploy to preserve your active shift streak."
                : "Bank is empty: Complete a 7-day shift cycle to forge your next tactical reserve shield."}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Streak Defense:</span>
              <span className={shields > 0 ? "text-emerald-500 font-black" : "text-amber-500"}>
                {shields > 0 ? "PROTECTED (Active)" : "UNGUARDED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE-BASED RESTORATIVE PROTOCOLS */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              Evidence-Based Restorative Protocols
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Clinically verified somatic and autonomic nervous system recalibration for doctors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVIDENCE_PROTOCOLS.map((protocol) => (
            <motion.div
              key={protocol.id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition hover:border-cyan-400/50"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                      {protocol.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        {protocol.category}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {protocol.name}
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-500" />
                    {protocol.durationMinutes} min
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {protocol.evidence}
                </p>

                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{protocol.benefitResilience}% Allostatic Health
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    -{protocol.benefitBurnout}% Burnout
                  </span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  sound.click();
                  setActiveProtocol(protocol);
                }}
                className="mt-5 w-full py-3 bg-slate-100 hover:bg-cyan-500 hover:text-white dark:bg-slate-800 dark:hover:bg-cyan-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Begin Guided Protocol
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* PROTOCOL SESSION HISTORY */}
      {stats.restorativeHistory && stats.restorativeHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            Recent Restorative Sessions
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.restorativeHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{entry.protocolName}</span>
                  <span className="text-slate-400 text-[11px]">
                    {formatDateTimeDMY(entry.completedAt)} • {entry.durationMinutes} minutes
                  </span>
                </div>
                <span className="font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  -{entry.burnoutReduction}% Strain
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guided Protocol Modal */}
      {activeProtocol && (
        <RestorativeGuidanceModal
          protocol={activeProtocol}
          onClose={() => setActiveProtocol(null)}
          onComplete={handleProtocolComplete}
        />
      )}
    </div>
  );
}
