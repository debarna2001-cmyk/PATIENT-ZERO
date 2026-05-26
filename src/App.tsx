import { useState, useEffect, useRef, FormEvent } from "react";
import { PatientVitals, ClinicalCase, UserStats, EmergencyLog, Mission, MoodLog } from "./types";
import { fallbackCases } from "./fallbackCases";
import VitalsMonitor from "./components/VitalsMonitor";
import ShiftLog from "./components/ShiftLog";
import ProtocolFormulary from "./components/ProtocolFormulary";
import HelpManual from "./components/HelpManual";
import { sound } from "./lib/audio";

import MissionsPanel from "./components/MissionsPanel";
import ProgressPanel from "./components/ProgressPanel";
import JourneyMap from "./components/JourneyMap";
import Heatmap from "./components/Heatmap";
import RewardsPanel from "./components/RewardsPanel";
import RewardStore from "./components/RewardStore";
import SettingsPanel from "./components/SettingsPanel";

import { motion, AnimatePresence } from "motion/react";
import {
  Stethoscope, ShieldAlert, Award, Clock, BookOpen, AlertOctagon, ChevronRight, User,
  Compass, RefreshCw, Check, X, Sparkles, Zap, Activity, Heart, TrendingUp, Brain, Smile,
  AlertTriangle, Lightbulb, Volume2, VolumeX, Menu, LogOut, FileText, BarChart3, Settings, Calendar, Flame,
  Medal, Gift, Trophy, ShoppingBag, Gamepad2, Ticket, Pizza, Music, Cpu
} from "lucide-react";

const DEFAULT_STATS: UserStats = {
  studentName: "Dr. Candidate",
  targetSpecialty: "Emergency Medicine",
  targetExamYear: 2027,
  daysToExam: 154,
  patientHealth: 88,
  burnoutIndex: 22,
  isStabilizing: false,
  shiftStreak: 3,
  patientsSaved: 4,
  patientsFlatlined: 0,
  unlockedPearlsCount: 2,
  xp: 350,
  credits: 0,
  subjectPerformance: {},
  activityLogs: {},
};

const DEFAULT_MISSIONS: Mission[] = [
  { id: "m-01-mcqs", title: "Solve high-yield clinical MCQs", category: "MCQ", target: 50, current: 10, unit: "Questions", xpReward: 100, stabilizeValue: 25, status: "Pending" },
  { id: "m-02-lectures", title: "Review high-yield video lecturers", category: "Lectures", target: 4, current: 1, unit: "Hours", xpReward: 200, stabilizeValue: 35, status: "Pending" },
  { id: "m-03-revision", title: "Perform pharmacology flashcards", category: "Revision", target: 30, current: 15, unit: "Cards", xpReward: 80, stabilizeValue: 15, status: "Pending" },
  { id: "m-04-mock", title: "Engage in ICU diagnosis triage trial", category: "Tests", target: 1, current: 0, unit: "Trial", xpReward: 150, stabilizeValue: 40, status: "Pending" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "missions" | "triage" | "progress" | "avatar" | "achievements" | "rewards" | "settings">("dashboard");
  const [globalSound, setGlobalSound] = useState<boolean>(() => localStorage.getItem("patient_zero_global_audio") === "true");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("patient_zero_theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("patient_zero_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("patient_zero_theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Request Notification Permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0 && now.getSeconds() < 10) {
        if ("Notification" in window && Notification.permission === "granted") {
           new Notification("0800 HRS: Clinical Protocols Active", {
             body: "Your daily sim targets are ready. Engage to earn XP.",
             icon: "/icon.png"
           });
        }
      }
    };
    const timerId = setInterval(checkTime, 10000);
    return () => clearInterval(timerId);
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    sound.click();
    setActiveTab(tab);
  };

  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);

  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Emergency Medicine / ICU");
  const [vitalStatus, setVitalStatus] = useState<"active" | "stabilized" | "flatlined">("active");
  const [isCritical, setIsCritical] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [moodRating, setMoodRating] = useState<number>(3);
  const [moodTrigger, setMoodTrigger] = useState<string>("");

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedStats = localStorage.getItem("patient_zero_stats");
    const savedMissions = localStorage.getItem("patient_zero_missions");
    const savedLogs = localStorage.getItem("patient_zero_logs");
    const savedMoodLogs = localStorage.getItem("patient_zero_mood");
    const activeCase = localStorage.getItem("patient_zero_active_case");
    const activeTime = localStorage.getItem("patient_zero_active_time");

    if (savedStats) try { setStats(JSON.parse(savedStats)); } catch (e) {}
    if (savedMissions) try { setMissions(JSON.parse(savedMissions)); } catch (e) {}
    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    if (savedMoodLogs) try { setMoodLogs(JSON.parse(savedMoodLogs)); } catch (e) {}
    if (activeCase && activeCase !== "null") try { setCurrentCase(JSON.parse(activeCase)); } catch (e) {}
    if (activeTime) setTimeLeft(parseInt(activeTime, 10));
  }, []);

  const updateStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem("patient_zero_stats", JSON.stringify(newStats));
  };

  const logActivity = (prev: UserStats) => {
    const today = new Date().toISOString().split("T")[0];
    const newLogs = { ...(prev.activityLogs || {}) };
    newLogs[today] = (newLogs[today] || 0) + 1;
    return { ...prev, activityLogs: newLogs };
  };

  const updateMissions = (newMissions: Mission[]) => {
    setMissions(newMissions);
    localStorage.setItem("patient_zero_missions", JSON.stringify(newMissions));
  };

  const updateLogs = (newLogs: EmergencyLog[]) => {
    setLogs(newLogs);
    localStorage.setItem("patient_zero_logs", JSON.stringify(newLogs));
  };

  useEffect(() => {
    const idleInterval = setInterval(() => {
      setStats((prev) => {
        const decayValue = prev.burnoutIndex > 50 ? 1.5 : 0.8;
        const rawHealth = prev.patientHealth - decayValue;
        const finalHealth = Math.max(0, parseFloat(rawHealth.toFixed(1)));
        const addedStress = prev.daysToExam < 60 ? 0.3 : 0.1;
        const rawBurnout = prev.burnoutIndex + addedStress;
        const finalBurnout = Math.min(100, parseFloat(rawBurnout.toFixed(1)));
        const nextStats = { ...prev, patientHealth: finalHealth, burnoutIndex: finalBurnout };
        localStorage.setItem("patient_zero_stats", JSON.stringify(nextStats));
        return nextStats;
      });
    }, 180000);
    return () => clearInterval(idleInterval);
  }, []);

  useEffect(() => {
    if (currentCase && vitalStatus === "active" && !revealed && activeTab === "triage") {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          localStorage.setItem("patient_zero_active_time", nextTime.toString());
          if (nextTime <= 0) {
            handlePatientFlatline("Golden hour window expired.");
            return 0;
          }
          return nextTime;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentCase, vitalStatus, revealed, activeTab]);

  const getSimulatedVitals = (): PatientVitals => {
    const baseHR = 72;
    const stressAddition = Math.floor(stats.burnoutIndex * 0.7);
    const criticalAddition = stats.patientHealth < 35 ? 30 : 0;
    const finalHR = Math.min(150, Math.max(0, baseHR + stressAddition + criticalAddition));
    const finalSPO2 = Math.min(100, Math.max(0, 85 + Math.floor(stats.patientHealth * 0.15)));
    const bpSys = 110 + Math.floor(stats.burnoutIndex * 0.5);
    const bpDias = 70 + Math.floor(stats.burnoutIndex * 0.3);
    const finalBP = stats.patientHealth < 30 ? "82/46" : `${bpSys}/${bpDias}`;
    const finalTemp = 97.8 + parseFloat((stats.burnoutIndex * 0.04).toFixed(1));
    return { hr: finalHR, bp: finalBP, spo2: finalSPO2, temp: finalTemp };
  };

  const currentVitals = getSimulatedVitals();
  const isSimulationCritical = stats.patientHealth < 35;

  useEffect(() => {
    localStorage.setItem("patient_zero_global_audio", globalSound ? "true" : "false");
    sound.enable(globalSound);
    if (globalSound) {
      if (activeTab === "triage" && currentCase && vitalStatus === "active") sound.startHeartbeat(currentVitals.hr);
      else sound.startHeartbeat(65);
    } else {
      sound.stopHeartbeat();
    }
    return () => sound.stopHeartbeat();
  }, [globalSound, activeTab, currentCase, vitalStatus, currentVitals.hr]);

  const spawnParticles = (text: string) => {
    const id = `particle-${Date.now()}-${Math.random()}`;
    const x = Math.random() * 120 + 80;
    const y = Math.random() * 80 + 120;
    setParticles((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1500);
  };

  const triggerManualStabilize = (type: 'QuickMCQ' | 'FullStudy' | 'QuickBreak') => {
    spawnParticles("+15% Stability");
    spawnParticles("+80 XP");
    setStats((prev) => {
      let hpReward = 15; let xpReward = 50; let fatigueRedux = 5;
      if (type === 'FullStudy') { hpReward = 35; xpReward = 150; fatigueRedux = 12; }
      else if (type === 'QuickBreak') { hpReward = 10; xpReward = 10; fatigueRedux = 30; }
      const rawHealth = prev.patientHealth + hpReward;
      const rawBurnout = prev.burnoutIndex - fatigueRedux;
      const next = logActivity({ ...prev, patientHealth: Math.min(100, rawHealth), burnoutIndex: Math.max(1, rawBurnout), xp: prev.xp + xpReward, credits: prev.credits + xpReward });
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
      return next;
    });

    if (type === 'QuickMCQ') {
      const copyMissions = [...missions];
      const targetM = copyMissions.find(m => m.category === "MCQ");
      if (targetM && targetM.status === "Pending") {
        targetM.current = Math.min(targetM.target, targetM.current + 10);
        if (targetM.current >= targetM.target) targetM.status = "Completed";
        updateMissions(copyMissions);
      }
    }
  };

  const handleMoodSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newLog: MoodLog = {
      timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ratingValue: moodRating,
      burnoutObserved: stats.burnoutIndex > 50,
      procrastinationTrigger: moodTrigger
    };
    const copyLogs = [newLog, ...moodLogs];
    setMoodLogs(copyLogs);
    localStorage.setItem("patient_zero_mood", JSON.stringify(copyLogs));
    setStats((prev) => {
      const rawHp = prev.patientHealth + 12;
      const next = { ...prev, patientHealth: Math.min(100, rawHp), burnoutIndex: Math.max(1, prev.burnoutIndex - 15) };
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
      return next;
    });
    spawnParticles("Resilience Restored (+12%)");
    setMoodTrigger("");
  };

  const handleSimulateSlip = (reason: string) => {
    spawnParticles("Alert: Attention Slip!");
    spawnParticles("-15% Stability");
    setStats((prev) => {
      const finalHealth = Math.max(0, prev.patientHealth - 15);
      const finalBurnout = Math.min(100, prev.burnoutIndex + 20);
      const next = { ...prev, patientHealth: finalHealth, burnoutIndex: finalBurnout };
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
      return next;
    });
  };

  const handleAddCustomMission = (title: string, category: 'MCQ' | 'Revision' | 'Lectures' | 'Tests' | 'Custom', target: number, unit: string) => {
    const freshM: Mission = { id: `custom-m-${Date.now()}`, title, category, target, current: 0, unit, xpReward: category === "Tests" ? 200 : 80, stabilizeValue: category === "Tests" ? 40 : 15, status: "Pending" };
    updateMissions([freshM, ...missions]);
  };

  const handleUpdateMissionProgress = (id: string, amount?: number) => {
    const copy = [...missions];
    const item = copy.find(m => m.id === id);
    if (!item || item.status === "Completed") return;
    const delta = amount || 1;
    item.current = Math.min(item.target, item.current + delta);
    if (item.current >= item.target) {
      item.status = "Completed";
      setStats((prev) => {
        const nextXp = prev.xp + item.xpReward;
        const next = logActivity({ ...prev, xp: nextXp, credits: prev.credits + item.xpReward, patientHealth: Math.min(100, prev.patientHealth + item.stabilizeValue), burnoutIndex: Math.max(4, prev.burnoutIndex - 8) });
        localStorage.setItem("patient_zero_stats", JSON.stringify(next));
        return next;
      });
      sound.stabilizationChime();
      spawnParticles(`+${item.xpReward} XP COMPLETE`);
    } else {
      sound.click();
      spawnParticles(`+1 ${item.unit}`);
    }
    updateMissions(copy);
  };

  const admitNewPatient = async () => {
    sound.charge();
    setIsGenerating(true);
    setErrorMessage(null);
    setSelectedAnswer(null);
    setRevealed(false);
    setAttempts(0);
    setVitalStatus("active");
    setIsCritical(false);
    setTimeLeft(60);
    try {
      const response = await fetch("/api/cases/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ specialty: selectedSpecialty }) });
      if (!response.ok) throw new Error("Network corrupted. Admitting fallback clinical case.");
      const freshCase: ClinicalCase = await response.json();
      setCurrentCase(freshCase);
    } catch (err) {
      const filtered = fallbackCases.filter((c) => c.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      const options = filtered.length > 0 ? filtered : fallbackCases;
      const randomCase = options[Math.floor(Math.random() * options.length)];
      setCurrentCase({ ...randomCase, id: `offline-${Date.now()}` });
      setErrorMessage("OFFLINE BACKUP DEPLOYED: Simulation is running on internal local firmware.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePatientFlatline = (reason: string) => {
    sound.flatlineAlert();
    if (timerRef.current) clearInterval(timerRef.current);
    setVitalStatus("flatlined");
    setRevealed(true);
    setIsCritical(false);
    setStats((prev) => {
      const next = logActivity({ ...prev, patientsFlatlined: prev.patientsFlatlined + 1, patientHealth: Math.max(0, prev.patientHealth - 25), shiftStreak: 1 });
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
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
      const performance = { ...stats.subjectPerformance };
      const sub = currentCase.specialty;
      if (!performance[sub]) performance[sub] = { total: 0, correct: 0 };
      performance[sub].total += 1;
      performance[sub].correct += 1;
      setStats((prev) => {
        const next = logActivity({ ...prev, xp: prev.xp + 150, credits: prev.credits + 150, patientHealth: Math.min(100, prev.patientHealth + 30), patientsSaved: prev.patientsSaved + 1, shiftStreak: prev.shiftStreak + 1, unlockedPearlsCount: prev.unlockedPearlsCount + 1, subjectPerformance: performance });
        localStorage.setItem("patient_zero_stats", JSON.stringify(next));
        return next;
      });
      const newLog: EmergencyLog = { id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), patientName: currentCase.patientName, specialty: currentCase.specialty, result: "STABILIZED", vignette: currentCase.clinicalVignette, userAnswer: selectedAnswer, correctAnswer: currentCase.correctAnswer, pearl: currentCase.highYieldPearl };
      updateLogs([newLog, ...logs]);
      const copyM = [...missions];
      const testM = copyM.find(m => m.category === "Tests");
      if (testM && testM.status === "Pending") {
        testM.current = Math.min(testM.target, testM.current + 1);
        if (testM.current >= testM.target) testM.status = "Completed";
        updateMissions(copyM);
      }
      spawnParticles("STABILIZED (+30%)");
      spawnParticles("+150 XP");
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
    setSelectedAnswer(null);
    setRevealed(false);
    setAttempts(0);
    setIsCritical(false);
    setVitalStatus("active");
  };

  const handleClearLogs = () => updateLogs([]);

  const handleUpdateProfile = (name: string, specialty: string, year: number) => {
    setStats((prev) => {
      const next = { ...prev, studentName: name, targetSpecialty: specialty, targetExamYear: year };
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateDays = (days: number) => {
    setStats((prev) => {
      const next = { ...prev, daysToExam: days };
      localStorage.setItem("patient_zero_stats", JSON.stringify(next));
      return next;
    });
  };

  const handleHardReset = () => {
    localStorage.clear();
    setStats(DEFAULT_STATS);
    setMissions(DEFAULT_MISSIONS);
    setLogs([]);
    setMoodLogs([]);
    setCurrentCase(null);
    setActiveTab("dashboard");
    alert("Emergency override initiated. Local database reset complete.");
  };

  const specialtyList = [
    "Emergency Medicine / ICU",
    "Cardiology",
    "Obstetrics & Gynecology",
    "Pharmacology & Toxicology",
    "Pediatrics",
    "Internal Medicine",
    "General Surgery"
  ];

  const NAV_TABS = [
    { id: "dashboard", label: "Main Hub", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "missions", label: "Missions", icon: <Calendar className="w-5 h-5" /> },
    { id: "triage", label: "Triage", icon: <Activity className="w-5 h-5" />, onClick: admitNewPatient },
    { id: "progress", label: "Data Logs", icon: <FileText className="w-5 h-5" /> },
    { id: "avatar", label: "Route Map", icon: <Compass className="w-5 h-5" /> },
    { id: "achievements", label: "Badges", icon: <Medal className="w-5 h-5" /> },
    { id: "rewards", label: "Rewards", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <div className="h-screen w-full font-sans flex selection:bg-cyan-500/30 overflow-hidden dark:bg-slate-950 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 relative">
      <div className="absolute inset-0 pointer-events-none hidden dark:block bg-cyber-grid z-0"></div>
      
      {isSimulationCritical && (
        <div className="fixed inset-0 pointer-events-none border-[4px] border-red-500/40 dark:border-red-500/60 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)] animate-pulse z-50"></div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[100]">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: p.y, x: p.x, scale: 0.8 }}
              animate={{ opacity: 0, y: p.y - 120, x: p.x + (Math.random() - 0.5) * 40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute font-sans text-sm font-black tracking-widest uppercase text-cyan-600 bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-500/50 px-3 py-1.5 rounded shadow-lg pointer-events-none"
            >
              {p.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative dark:bg-slate-950 bg-slate-50 dark:bg-slate-950/50">

        {/* Universal Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded flex justify-center items-center shadow-sm border font-black ${
                  isSimulationCritical ? "bg-red-50 dark:bg-red-950 border-red-200 text-red-600" : "bg-slate-900 border-slate-800 text-cyan-400"
               }`}>
                  P₀
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-wide leading-none">Patient Zero</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[120px]">Dr. {stats.studentName}</span>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                  <Activity className="w-4 h-4" />
               </button>
               <button onClick={() => {
                   const next = !globalSound;
                   setGlobalSound(next);
                   if (next) setTimeout(() => sound.click(), 50);
                 }}
                 className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700"
               >
                 {globalSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
               </button>
            </div>
        </header>

        {/* Dashboard Main View */}
        <main className="flex-1 overflow-y-auto w-full pb-28">
           <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
             <AnimatePresence mode="wait">
               {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {/* Top Row: Vitals Monitor */}
              <div className="w-full">
                <VitalsMonitor
                  vitals={currentVitals}
                  status={stats.patientHealth <= 0 ? "flatlined" : vitalStatus === "stabilized" ? "stabilized" : "active"}
                  isCritical={isSimulationCritical}
                />
              </div>

              {/* Tactical Action deck */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column (8 units): Patient Status and Action Controls */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                  
                  {/* System Integrity Core */}
                  <div className={`rounded-3xl p-8 relative overflow-hidden transition-colors border shadow-xl ${
                    isSimulationCritical 
                      ? "bg-red-50/50 border-red-200/80" 
                      : "bg-slate-900/40 backdrop-blur-xl border-slate-700/50"
                  }`}>
                    {/* Minor cyber theme styles applied here */}
                    <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                       <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(103, 232, 249, 0.4) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-start mb-8 border-b border-slate-700/50 pb-5 relative z-10">
                      <div>
                        <h3 className="font-bold text-slate-100 text-xl tracking-wide flex items-center gap-2"><Cpu className="w-5 h-5 text-cyan-400" /> Bio-Sim Core</h3>
                        <p className="text-sm text-slate-400 font-medium">Clinical readiness & neural load tracking</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded border shadow-sm tracking-widest uppercase ${
                        isSimulationCritical 
                          ? "bg-red-900/50 text-red-400 border-red-500/50" 
                          : "bg-emerald-900/50 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      }`}>
                        {isSimulationCritical ? "CRITICAL NEURAL LOAD" : "VITALS SECURE"}
                      </span>
                    </div>

                    <div className="mb-8 relative z-10">
                      <div className="flex justify-between mb-3 text-sm font-semibold">
                        <span className="text-slate-300">Resilience Score</span>
                        <span className={isSimulationCritical ? "text-red-400 font-black" : "text-cyan-400 font-black"}>
                          {stats.patientHealth}%
                        </span>
                      </div>
                      <div className="h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-700/50">
                        <div
                          style={{ width: `${stats.patientHealth}%` }}
                          className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor] ${
                            isSimulationCritical 
                              ? "bg-red-500 text-red-500" 
                              : "bg-cyan-500 text-cyan-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 relative z-10">
                      <div className="flex flex-col gap-1.5 border-r border-slate-700 pr-4">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">COG-LOAD</span>
                        <span className={`font-bold text-lg ${stats.burnoutIndex > 60 ? "text-rose-400" : "text-slate-200"}`}>
                          {stats.burnoutIndex}%
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 border-r border-slate-700 pr-4 pl-0 sm:pl-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">EXAM T-MINUS</span>
                        <span className="font-bold text-lg text-slate-200">
                          {stats.daysToExam} d
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 border-r border-slate-700 pr-4 pl-0 sm:pl-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">XP YIELD</span>
                        <span className="font-bold text-lg text-blue-400">
                          {Math.floor(stats.xp * 0.05) || 2} kXP
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 pl-0 sm:pl-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">MED-RANK</span>
                        <span className="font-bold text-lg text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                          Lvl {Math.floor(stats.xp / 1000) + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Heatmap activityLogs={stats.activityLogs} />

                  {/* Actions Deck */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">Execute Clinical Protocols</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <button
                        onClick={() => { setActiveTab("triage"); admitNewPatient(); }}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-rose-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <ShieldAlert className="w-7 h-7 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Acute Rescue</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Solve a high-stakes vignette to heal the patient.
                        </p>
                      </button>

                      <button
                        onClick={() => triggerManualStabilize("QuickMCQ")}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-indigo-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <BookOpen className="w-7 h-7 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Study Report</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Log 10 MCQs completed in real life right now.
                        </p>
                      </button>

                      <button
                        onClick={() => triggerManualStabilize("QuickBreak")}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-emerald-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <Smile className="w-7 h-7 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Sleep Routine</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Reset exhaustion and rest your brain.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Mood / Burnout Logger */}
                  <div className="border border-white/60 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
                        <Brain className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight">Biocompatibility Log</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">Track clinical exhaustion to optimize learning.</p>
                      </div>
                    </div>

                    <form onSubmit={handleMoodSubmit} className="flex flex-col gap-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 block">Current Resilience (1: Exhausted, 5: Radiant)</label>
                        <div className="flex items-center gap-4">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setMoodRating(val)}
                              className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                                moodRating === val
                                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-110"
                                  : "bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">Trigger Notes (Distractions)</label>
                        <input
                          type="text"
                          value={moodTrigger}
                          placeholder="e.g. Spent 2 hours on Instagram..."
                          onChange={(e) => setMoodTrigger(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-slate-800 dark:text-slate-200 font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-4 w-full bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 transition-all"
                      >
                        Submit Adjustment Report
                      </button>
                    </form>

                    {moodLogs.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-3">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Recent Logs</span>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                          {moodLogs.map((ml, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-slate-50 dark:bg-slate-950/50 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-400">
                              <span className="text-xs text-slate-400">{ml.timestamp}</span>
                              <span className="font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">LVL {ml.ratingValue}</span>
                              <span className="truncate italic flex-1 max-w-xs">{ml.procrastinationTrigger || "No trigger specified"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (4 units) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                  
                  {/* Countdown Horizon */}
                  <div className="border border-white/60 bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[220px] text-center">
                    <span className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-4">NEET PG Horizon</span>
                    <span className="text-7xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
                      {stats.daysToExam}
                    </span>
                    <span className="text-base font-bold text-slate-400 mt-2">Days Remaining</span>
                  </div>

                  {/* Quick Directive list */}
                  <div className="border border-white/60 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 flex flex-col flex-1 shadow-xl h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Active Directives</h4>
                      <button 
                        onClick={() => handleTabChange("missions")}
                        className="text-blue-600 text-sm hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Manage
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {missions.slice(0, 4).map(m => {
                        const pct = Math.floor((m.current / m.target) * 100);
                        return (
                          <div key={m.id} className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-950/50 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 group transition hover:border-slate-300 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-slate-700 dark:text-slate-300 line-clamp-1">{m.title}</span>
                              {m.status === "Completed" ? (
                                <Check className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">{m.current}/{m.target}</span>
                              )}
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full transition-all duration-500 ${m.status === "Completed" ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "missions" && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MissionsPanel
                missions={missions}
                patientHealth={stats.patientHealth}
                onUpdateProgress={handleUpdateMissionProgress}
                onAddMission={handleAddCustomMission}
                onSimulateSlip={handleSimulateSlip}
              />
            </motion.div>
          )}

          {activeTab === "triage" && (
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
                  <button
                    onClick={admitNewPatient}
                    disabled={isGenerating || (vitalStatus === "active" && currentCase !== null)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 dark:bg-slate-800/50 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all shrink-0"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Admit Case"}
                  </button>
                </div>
              </div>

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
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-8`}>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentCase.specialty}</span>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{currentCase.patientName} <span className="text-slate-400 font-medium">| Age {currentCase.age}</span></h4>
                    </div>
                    
                    {!revealed && (
                      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-lg font-mono font-bold shadow-sm border ${timeLeft < 15 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <Clock className="w-5 h-5" />
                        00:{timeLeft.toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  <div className="text-slate-700 dark:text-slate-300 text-base font-medium leading-relaxed mb-10 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {currentCase.clinicalVignette}
                  </div>

                  <div className="flex flex-col gap-4">
                    {Object.entries(currentCase.options).map(([key, text]) => {
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
                        <button
                          key={key}
                          onClick={() => !revealed && setSelectedAnswer(key as any)}
                          disabled={revealed}
                          className={`p-5 rounded-2xl border text-left transition-all flex gap-4 disabled:cursor-default font-medium ${optionStyle}`}
                        >
                          <span className={`font-bold shrink-0 w-6 text-center ${revealed && isCorrect ? 'text-emerald-600' : isSelected && !revealed ? 'text-blue-600' : 'text-slate-400'}`}>{key}.</span>
                          <span className="leading-snug">{text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!revealed ? (
                    <div className="mt-10 flex justify-end">
                      <button
                        onClick={submitRemedy}
                        disabled={!selectedAnswer}
                        className="px-10 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 dark:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 transition-all text-sm tracking-wide uppercase"
                      >
                        Submit Medical Diagnosis
                      </button>
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
                              {vitalStatus === 'stabilized' ? '+150 XP / +30% PREP HEALTH EARNED' : 'CRITICAL HEALTH PENALTY APPLIED'}
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
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={dismissPatient}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all text-sm tracking-wide uppercase"
                        >
                          Clear Bay for Next Patient
                        </button>
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
                    Admit a new emergency case to test your diagnostics. Success heavily restores patient stability and yields major EXP.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "progress" && (
             <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProgressPanel stats={stats} />
              <div className="mt-10 pt-10 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight">Clinical Operation History</h3>
                  <button onClick={handleClearLogs} className="text-xs font-bold text-rose-600 hover:text-rose-700 transition px-4 py-2 rounded-xl bg-rose-50 border border-rose-200">Purge Logs</button>
                </div>
                <ShiftLog logs={logs} />
              </div>
            </motion.div>
          )}

          {activeTab === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <JourneyMap stats={stats} />
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RewardsPanel xp={stats.xp} patientsSaved={stats.patientsSaved} shiftStreak={stats.shiftStreak} />
            </motion.div>
          )}

          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RewardStore 
                credits={stats.credits} 
                onRedeem={(cost) => {
                  setStats(prev => {
                    const next = { ...prev, credits: prev.credits - cost };
                    localStorage.setItem("patient_zero_stats", JSON.stringify(next));
                    return next;
                  });
                }} 
              />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsPanel 
                studentName={stats.studentName}
                targetSpecialty={stats.targetSpecialty}
                daysToExam={stats.daysToExam} 
                onUpdateDays={handleUpdateDays} 
                onUpdateProfile={handleUpdateProfile}
                onHardReset={handleHardReset} 
              />
            </motion.div>
          )}

        </AnimatePresence>
           </div>
        </main>

        {/* Universal Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-around max-w-lg mx-auto w-full px-2 py-1">
             {NAV_TABS.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => {
                     handleTabChange(tab.id as any);
                     if (tab.onClick) tab.onClick();
                   }}
                   className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
                     activeTab === tab.id
                        ? "text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 dark:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]"
                        : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                   }`}
                 >
                    <div className={`${activeTab === tab.id ? 'animate-bounce drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`}>{tab.icon}</div>
                    <span className="text-[9px] font-black tracking-widest uppercase">{tab.label}</span>
                 </button>
             ))}
           </div>
        </nav>

      </div>
    </div>
  );
}
