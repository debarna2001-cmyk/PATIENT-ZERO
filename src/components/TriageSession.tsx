import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Activity, ShieldAlert, RefreshCw, Check, Clock, Lightbulb, ChevronRight, AlertTriangle } from "lucide-react";
import { ClinicalCase, EmergencyLog, UserStats, Mission } from "../types";
import { fallbackCases } from "../fallbackCases";
import { sound } from "../lib/audio";
import VitalsMonitor from "./VitalsMonitor";

const specialtyList = [
  "Emergency Medicine / ICU",
  "Cardiology",
  "Obstetrics & Gynecology",
  "Pharmacology & Toxicology",
  "Pediatrics",
  "Internal Medicine",
  "General Surgery"
];

interface TriageSessionProps {
  stats: UserStats;
  missions: Mission[];
  logs: EmergencyLog[];
  modifyStats: (updater: (prev: UserStats) => UserStats) => void;
  updateLogs: (newLogs: EmergencyLog[]) => void;
  logActivity: (prev: UserStats, acts: { cases?: number; mcqs?: number; videos?: number }) => UserStats;
  handleUpdateMissionProgress: (id: string, amount: number) => void;
  spawnParticles: (text: string) => void;
  onExit: () => void;
}

export default function TriageSession({
  stats,
  missions,
  logs,
  modifyStats,
  updateLogs,
  logActivity,
  handleUpdateMissionProgress,
  spawnParticles,
  onExit
}: TriageSessionProps) {
  const [triageQueue, setTriageQueue] = useState<ClinicalCase[]>([]);
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [sessionHistory, setSessionHistory] = useState<{case: ClinicalCase, success: boolean}[]>([]);
  const [shiftSuggestions, setShiftSuggestions] = useState<string[] | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Emergency Medicine / ICU");
  const [vitalStatus, setVitalStatus] = useState<"active" | "stabilized" | "flatlined">("active");
  const [isCritical, setIsCritical] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const activeCase = localStorage.getItem("patient_zero_v2_active_case");
    if (activeCase && activeCase !== "null") try { setCurrentCase(JSON.parse(activeCase)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (currentCase && vitalStatus === "active" && !revealed) {
      timerRef.current = window.setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentCase, revealed, vitalStatus]);

  const startTriageSession = async () => {
    const today = new Date().toISOString().split("T")[0];
    const casesPlayedToday = stats.triageCasesLogs?.[today] || 0;
    const remainingToday = Math.max(0, 5 - casesPlayedToday);
    if (remainingToday === 0) {
       alert("Daily Limit Reached: You have reached the maximum limit of 5 clinical cases for today. Return tomorrow for your next operative shift.");
       onExit();
       return;
    }
    sound.charge();
    setIsGenerating(true);
    setErrorMessage(null);
    setSelectedAnswer(null);
    setRevealed(false);
    setAttempts(0);
    setVitalStatus("active");
    setIsCritical(false);
    setTimeSpentSeconds(0);
    setSessionHistory([]);
    setShiftSuggestions(null);
    try {
      const response = await fetch("/api/cases/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ specialty: selectedSpecialty }) });
      if (!response.ok) throw new Error("Network corrupted. Admitting fallback clinical case.");
      const freshCases: ClinicalCase[] = await response.json();
      if (Array.isArray(freshCases) && freshCases.length > 0) {
        const allowedCases = freshCases.slice(0, remainingToday);
        setTriageQueue(allowedCases.slice(1));
        setCurrentCase(allowedCases[0]);
      } else {
        throw new Error("Invalid format");
      }
    } catch (err) {
      const filtered = fallbackCases.filter((c) => c.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      const options = filtered.length >= remainingToday ? filtered : fallbackCases;
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      const selectedCases = shuffled.slice(0, remainingToday).map(c => ({ ...c, id: `offline-${Date.now()}-${Math.random()}` }));
      setTriageQueue(selectedCases.slice(1));
      setCurrentCase(selectedCases[0]);
      setErrorMessage("OFFLINE BACKUP DEPLOYED: Simulation is running on internal local firmware.");
    } finally {
      setIsGenerating(false);
    }
  };

  const advanceToNextPatient = () => {
    if (triageQueue.length > 0) {
      const nextCase = triageQueue[0];
      setTriageQueue(triageQueue.slice(1));
      setCurrentCase(nextCase);
      setSelectedAnswer(null);
      setRevealed(false);
      setAttempts(0);
      setVitalStatus("active");
      setIsCritical(false);
      setTimeSpentSeconds(0);
    } else {
      endShift();
    }
  };

  const handlePatientFlatline = (reason: string) => {
    sound.flatlineAlert();
    if (timerRef.current) clearInterval(timerRef.current);
    setVitalStatus("flatlined");
    setRevealed(true);
    setIsCritical(false);
    if (currentCase) {
        setSessionHistory(prev => [...prev, { case: currentCase, success: false }]);
    }
    modifyStats((prev) => {
      const next = logActivity({ ...prev, patientsFlatlined: prev.patientsFlatlined + 1, patientHealth: Math.max(0, prev.patientHealth - 25), shiftStreak: 0 }, { cases: 1 });
      return next;
    });
    if (currentCase) {
      const newLog: EmergencyLog = { id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), patientName: currentCase.patientName, specialty: currentCase.specialty, result: "FLATLINED", vignette: currentCase.clinicalVignette, userAnswer: selectedAnswer || ("-" as any), correctAnswer: currentCase.correctAnswer, pearl: currentCase.highYieldPearl };
      updateLogs([newLog, ...logs]);
    }
  };

  const submitRemedy = () => {
    if (!currentCase || !selectedAnswer || revealed) return;
    if (selectedAnswer === currentCase.correctAnswer) {
      sound.stabilizationChime();
      if (timerRef.current) clearInterval(timerRef.current);
      setVitalStatus("stabilized");
      setRevealed(true);
      setIsCritical(false);
      const performance = { ...(stats.subjectPerformance || {}) };
      const sub = currentCase.specialty;
      if (!performance[sub]) performance[sub] = { total: 0, correct: 0 };
      performance[sub].total += 1;
      performance[sub].correct += 1;
      const newStreak = stats.shiftStreak + 1;
      const streakBonusCredits = Math.floor(newStreak / 5);
      const streakBonusXP = Math.floor(newStreak / 2) * 10;
      const earnedCredits = 2 + streakBonusCredits;
      const earnedXP = 150 + streakBonusXP;

      modifyStats((prev) => {
        const next = logActivity({ ...prev, xp: (prev.xp || 0) + earnedXP, credits: (prev.credits || 0) + earnedCredits, patientHealth: Math.min(100, prev.patientHealth + 30), patientsSaved: prev.patientsSaved + 1, shiftStreak: prev.shiftStreak + 1, unlockedPearlsCount: prev.unlockedPearlsCount + 1, subjectPerformance: performance }, { cases: 1 });
        return next;
      });
      const newLog: EmergencyLog = { id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), patientName: currentCase.patientName, specialty: currentCase.specialty, result: "STABILIZED", vignette: currentCase.clinicalVignette, userAnswer: selectedAnswer, correctAnswer: currentCase.correctAnswer, pearl: currentCase.highYieldPearl };
      updateLogs([newLog, ...logs]);
      setSessionHistory(prev => [...prev, { case: currentCase, success: true }]);
      const mcqM = missions.find(m => m.category === "MCQ");
      if (mcqM && mcqM.status === "Pending") {
        handleUpdateMissionProgress(mcqM.id, 1);
      }
      spawnParticles("STABILIZED (+30%)");
      spawnParticles(`+${earnedXP} XP / +${earnedCredits} CRDT`);
      if (streakBonusCredits > 0 || streakBonusXP > 0) {
        setTimeout(() => spawnParticles(`STREAK BONUS!`), 600);
      }
    } else {
      sound.flatlineAlert();
      if (attempts === 0) {
        setAttempts(1);
        setIsCritical(true);
      } else {
        handlePatientFlatline("Incorrect medical judgment. Case flatlined.");
      }
    }
  };

  const dismissPatient = () => {
    setCurrentCase(null);
    setTriageQueue([]);
    setSelectedAnswer(null);
    setRevealed(false);
    setAttempts(0);
    setIsCritical(false);
    setVitalStatus("active");
  };

  const endShift = async () => {
    if (sessionHistory.length > 0) {
      dismissPatient();
      setIsFetchingSuggestions(true);
      
      const today = new Date().toISOString().split("T")[0];
      const casesPlayedToday = stats.triageCasesLogs?.[today] || 0;
      
      if (casesPlayedToday >= 5) {
        const triageM = missions.find(m => m.id === "m-04-triage");
        if (triageM && triageM.status === "Pending") {
          handleUpdateMissionProgress(triageM.id, 1);
        }
      }

      try {
        const response = await fetch("/api/cases/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionHistory }) });
        if (response.ok) {
          const data = await response.json();
          setShiftSuggestions(data.suggestions);
        } else {
          setShiftSuggestions(["Review basic clinical reasoning", "Consult medical literature on difficult cases"]);
        }
      } catch {
         setShiftSuggestions(["Review basic clinical reasoning", "Consult medical literature on difficult cases"]);
      } finally {
         setIsFetchingSuggestions(false);
      }
    } else {
      dismissPatient();
    }
  };

  return (
    <motion.div
      key="triage"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 w-full max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-xl">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Emergency Triage Board</h3>
          <p className="text-sm font-medium text-slate-500">Review clinical vignettes to restore patient stability.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none hover:border-slate-300 dark:border-slate-700 transition-colors"
            disabled={vitalStatus === "active" && currentCase !== null}
          >
            {specialtyList.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
          {currentCase && (
            <motion.button whileTap={{ scale: 0.95 }}
              disabled={true}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600/50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all shrink-0 cursor-not-allowed cursor-default"
            >
              Session Active
            </motion.button>
          )}
        </div>
      </div>

      {!currentCase && !shiftSuggestions && !isFetchingSuggestions && (
         <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-xl flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 shadow-sm flex justify-center items-center mb-6">
                 <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-2xl uppercase tracking-tight mb-2">Initiate Shift</h4>
              <p className="text-sm font-medium text-slate-500 mb-8 max-w-md">Begin a rigorous 5-case clinical triage session. Answer emergencies back-to-back to stabilize the patient health meter.</p>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={startTriageSession}
                disabled={isGenerating}
                className="flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 dark:bg-white dark:hover:bg-slate-200 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:text-slate-900 text-white text-sm font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all shrink-0 uppercase tracking-widest"
              >
                {isGenerating ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Paging Specialists...</>
                ) : (
                  <><ShieldAlert className="w-5 h-5" /> Start Morning Shift (5 Cases)</>
                )}
              </motion.button>
            </div>
         </div>
      )}

      {!currentCase && (shiftSuggestions || isFetchingSuggestions) && (
         <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-xl flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center py-10">
               <h4 className="font-black text-slate-900 dark:text-slate-100 text-2xl uppercase tracking-tight mb-6">Shift Debrief & Insights</h4>
               {isFetchingSuggestions ? (
                  <div className="flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400">
                     <RefreshCw className="w-8 h-8 animate-spin" />
                     <p className="font-semibold">Consulting Chief Medical Officer...</p>
                  </div>
               ) : (
                  <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left shadow-inner">
                     <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest text-center">Recommended Reading Topics</p>
                     <ul className="space-y-4">
                       {shiftSuggestions?.map((s, idx) => (
                         <li key={idx} className="flex gap-3 items-start">
                           <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{idx + 1}</div>
                           <p className="text-slate-700 dark:text-slate-300 font-medium">{s}</p>
                         </li>
                       ))}
                     </ul>
                     <div className="mt-8 flex justify-center">
                        <motion.button whileTap={{ scale: 0.95 }}
                           onClick={() => { setShiftSuggestions(null); setSessionHistory([]); }}
                           className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow transition-all uppercase tracking-wide text-sm"
                        >
                           Accept Recommendations
                        </motion.button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {errorMessage && (
        <div className="p-5 bg-orange-50 border border-orange-200 text-orange-700 rounded-2xl flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500 mt-0.5" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {currentCase && (
        <div className={`p-6 md:p-8 rounded-3xl border transition-all duration-500 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-xl ${
          vitalStatus === "flatlined" ? "border-red-200 bg-red-50/30" : 
          vitalStatus === "stabilized" ? "border-emerald-200 bg-emerald-50/30" : 
          "border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-8">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentCase.specialty}</span>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{currentCase.patientName} <span className="text-slate-400 font-medium">| {currentCase.ageGender}</span></h4>
            </div>
            
            {!revealed && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-lg font-mono font-bold shadow-sm border bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Clock className="w-5 h-5 text-slate-400" />
                {Math.floor(timeSpentSeconds / 60).toString().padStart(2, '0')}:{(timeSpentSeconds % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          <div className="text-slate-700 dark:text-slate-300 text-base font-medium leading-relaxed mb-10 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {currentCase.clinicalVignette}
          </div>

          <div className="flex flex-col gap-4">
            {currentCase.options && Object.entries(currentCase.options).map(([key, text]) => {
              const isSelected = selectedAnswer === key;
              const isCorrect = key === currentCase.correctAnswer;
              let optionStyle = "border-white/60 bg-white dark:bg-slate-900/60 backdrop-blur-md hover:border-blue-300 hover:bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300";
              
              if (revealed) {
                if (isCorrect) optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm border-2";
                else if (isSelected) optionStyle = "border-red-300 bg-red-50 text-red-800";
                else optionStyle = "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 opacity-60";
              } else if (isSelected) {
                optionStyle = "border-blue-500 bg-blue-50 text-blue-900 border-2 shadow-sm";
              }

              return (
                <motion.button whileTap={{ scale: 0.95 }}
                  key={key}
                  onClick={() => !revealed && setSelectedAnswer(key as any)}
                  disabled={revealed}
                  className={`p-5 rounded-2xl border text-left transition-all flex gap-4 disabled:cursor-default font-medium ${optionStyle}`}
                >
                  <span className={`font-bold shrink-0 w-6 text-center ${revealed && isCorrect ? 'text-emerald-600' : isSelected && !revealed ? 'text-blue-600' : 'text-slate-400'}`}>{key}.</span>
                  <span className="leading-snug">{text}</span>
                </motion.button>
              );
            })}
          </div>

          {!revealed ? (
            <div className="mt-10 flex justify-end">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={submitRemedy}
                disabled={!selectedAnswer}
                className="px-10 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 dark:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all text-sm tracking-wide uppercase"
              >
                Submit Medical Diagnosis
              </motion.button>
            </div>
          ) : (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-sm ${vitalStatus === 'stabilized' ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${vitalStatus === 'stabilized' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {vitalStatus === 'stabilized' ? <Check className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                  </div>
                  <div>
                    <h5 className={`text-xl font-bold tracking-tight ${vitalStatus === 'stabilized' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {vitalStatus === 'stabilized' ? 'Patient Stabilized Successfully' : 'Patient Flatlined'}
                    </h5>
                    <p className={`text-sm font-bold ${vitalStatus === 'stabilized' ? 'text-emerald-600/80' : 'text-red-600/80'}`}>
                      {vitalStatus === 'stabilized' ? '+150 XP & CRDT / +30% PREP HEALTH EARNED' : 'CRITICAL HEALTH PENALTY APPLIED'}
                    </p>
                  </div>
                </div>
                {currentCase.explanation && (
                  <div className="text-slate-700 dark:text-slate-300 text-sm font-medium mt-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed shadow-sm">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2 tracking-wide uppercase text-xs">Clinical Explanation:</span>
                    {currentCase.explanation}
                  </div>
                )}
                <div className="text-blue-800 text-sm font-medium mt-2 flex items-start gap-3 bg-blue-50/80 p-5 rounded-2xl border border-blue-100 shadow-sm">
                  <Lightbulb className="w-5 h-5 shrink-0 text-blue-500" />
                  <p><span className="font-bold block mb-1 tracking-wide uppercase text-xs text-blue-600">High-Yield Pearl Unlocked</span> {currentCase.highYieldPearl}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                {triageQueue.length > 0 ? (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={advanceToNextPatient}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm tracking-wide uppercase flex items-center justify-center gap-2"
                  >
                    Next Emergency <ChevronRight className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={endShift}
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm tracking-wide uppercase"
                  >
                    End Shift
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!currentCase && (
        <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-950/50">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 shadow-sm">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Triage Bay Empty</h4>
          <p className="text-sm text-slate-500 font-medium max-w-md mt-3">
            Admit a new emergency case to test your diagnostics. Success heavily restores patient stability and yields major XP and Credits.
          </p>
        </div>
      )}
    </motion.div>
  );
}
