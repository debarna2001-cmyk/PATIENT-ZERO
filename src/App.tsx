import { useState, useEffect, useRef, FormEvent } from "react";
import { PatientVitals, ClinicalCase, UserStats, EmergencyLog, Mission, MoodLog } from "./types";
import { fallbackCases } from "./fallbackCases";
import VitalsMonitor from "./components/VitalsMonitor";
import TriageSession from "./components/TriageSession";
import ShiftLog from "./components/ShiftLog";
import ProtocolFormulary from "./components/ProtocolFormulary";
import HelpManual from "./components/HelpManual";
import { sound } from "./lib/audio";
import { registerServiceWorker, triggerNotification } from "./lib/notifications";
import { getNarrativeState, NarrativeState } from './lib/narrative';
import { auth, db, signInWithGoogle, signOut, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";

import MissionsPanel from "./components/MissionsPanel";
import ProgressPanel from "./components/ProgressPanel";
import JourneyMap from "./components/JourneyMap";
import Heatmap from "./components/Heatmap";
import RewardsPanel from "./components/RewardsPanel";
import RewardStore from "./components/RewardStore";
import SettingsPanel from "./components/SettingsPanel";

import { motion, AnimatePresence } from "motion/react";
import {
  Stethoscope, ShieldAlert, Award, Clock, BookOpen, AlertOctagon, ChevronRight, ChevronDown, User,
  Compass, RefreshCw, Check, X, Sparkles, Zap, Activity, Heart, TrendingUp, Brain, Smile,
  AlertTriangle, Lightbulb, Volume2, VolumeX, Menu, LogOut, FileText, BarChart3, Settings, Calendar, Flame,
  Medal, Gift, Trophy, ShoppingBag, Gamepad2, Ticket, Pizza, Music, Cpu, LogIn
} from "lucide-react";

const AVAILABLE_SUBJECTS = [
  "Medicine",
  "Surgery",
  "Obstetrics & Gynecology",
  "Pediatrics",
  "Pathology",
  "Pharmacology",
  "Microbiology",
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Forensic Medicine",
  "Ophthalmology",
  "ENT",
  "Social & Preventive Medicine",
  "Dermatology",
  "Psychiatry",
  "Orthopedics",
  "Radiology",
  "Anesthesia"
];

const DEFAULT_STATS: UserStats = {
  studentName: "Dr. Candidate",
  targetSpecialty: "Emergency Medicine",
  targetExamYear: 2027,
  targetExamDate: "2027-03-01",
  daysToExam: 365,
  lastMissionResetDate: new Date().toISOString().split("T")[0],
  patientHealth: 100,
  burnoutIndex: 0,
  isStabilizing: false,
  shiftStreak: 0,
  patientsSaved: 0,
  patientsFlatlined: 0,
  unlockedPearlsCount: 0,
  xp: 0,
  credits: 0,
  subjectPerformance: {},
  activityLogs: {},
  sleepLogs: {},
  studyMode: 'Normal',
  dutyDaysUsed: 0,
  restDaysUsed: 0,
  currentWeekStart: new Date().toISOString().slice(0, 10),
};

const DEFAULT_MISSIONS: Mission[] = [
  { id: "m-04-triage", title: "Daily Triage Completion", category: "Triage", target: 1, current: 0, unit: "Session", xpReward: 300, creditReward: 3, stabilizeValue: 50, status: "Pending", period: "daily" },
  { id: "m-01-mcqs", title: "Complete daily Marrow MCQs", category: "MCQ", target: 50, current: 0, unit: "Questions", xpReward: 100, creditReward: 1, stabilizeValue: 25, status: "Pending", period: "daily" },
  { id: "m-02-lectures", title: "Watch Marrow video modules", category: "Lectures", target: 4, current: 0, unit: "Hours", xpReward: 200, creditReward: 1, stabilizeValue: 35, status: "Pending", period: "daily" },
  { id: "m-05-review", title: "1 Hour Review Session", category: "Revision", target: 1, current: 0, unit: "Hour", xpReward: 80, creditReward: 0.5, stabilizeValue: 15, status: "Pending", period: "daily" },
  { id: "m-03-gt", title: "Defeat the Weekly Grand Test (GT)", category: "Tests", target: 1, current: 0, unit: "GT", xpReward: 500, creditReward: 5, stabilizeValue: 100, status: "Pending", period: "weekly" }
];

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
     const unsub = onAuthStateChanged(auth, (u) => {
         setAuthUser(u);
         setAuthLoading(false);
     });
     return unsub;
  }, []);

  const [activeTab, setActiveTab] = useState<"dashboard" | "missions" | "triage" | "progress" | "avatar" | "achievements" | "rewards" | "settings" | "vault">("dashboard");
  const [vaultView, setVaultView] = useState<"pearls" | "history">("pearls");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("patient_zero_v2_theme");
    return saved ? saved === "dark" : true;
  });
  
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [manualLogModalOpen, setManualLogModalOpen] = useState(false);
  const [manualLogType, setManualLogType] = useState<'QuickMCQ' | 'FullStudy' | 'QuickBreak' | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("patient_zero_v2_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("patient_zero_v2_theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Register Service Worker for maximum mobile PWA / background notification reliability
    registerServiceWorker();

    // Request Notification Permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const checkTime = () => {
      const now = new Date();
      const todayString = now.toISOString().split("T")[0];
      const lastTrigger = localStorage.getItem("patient_zero_morning_notif");
      
      if (now.getHours() >= 8 && lastTrigger !== todayString) {
        localStorage.setItem("patient_zero_morning_notif", todayString);
        triggerNotification("0800 HRS: Morning Shift", {
          body: "Your 5-case Triage Session is ready. Engage to stabilize the patient.",
          tag: "morning-shift-reminder"
        });
      }
    };
    // Check every minute instead of 10s is sufficient, but 10s is fine
    const timerId = setInterval(checkTime, 10000);
    // Call it once immediately as well in case they open the app after 8am
    checkTime();
    return () => clearInterval(timerId);
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);

  const [particles, setParticles] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [moodRating, setMoodRating] = useState<number>(3);
  const [moodTrigger, setMoodTrigger] = useState<string>("");
  const [showSleepModal, setShowSleepModal] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number>(8);


  useEffect(() => {
    if (!authUser) return;
    
    // Stats fetch
    const statsUnsub = onSnapshot(doc(db, "users", authUser.uid), (docSnap) => {
        if (docSnap.exists()) {
             const loadedStats = { ...DEFAULT_STATS, ...docSnap.data() } as UserStats;
             const today = new Date().toISOString().split("T")[0];
             
             const now = new Date();
             const day = now.getDay() || 7; 
             now.setHours(0,0,0,0);
             const wkStart = new Date(now);
             wkStart.setDate(now.getDate() - day + 1);
             const currentMondayStr = wkStart.toISOString().slice(0, 10);
             
             const isNewWeek = loadedStats.currentWeekStart !== currentMondayStr;

             if (loadedStats.lastMissionResetDate !== today) {
                 loadedStats.lastMissionResetDate = today;
                 
                 if (isNewWeek) {
                     loadedStats.currentWeekStart = currentMondayStr;
                     loadedStats.dutyDaysUsed = 0;
                     loadedStats.restDaysUsed = 0;
                 }
                 
                 setDoc(doc(db, "users", authUser.uid), loadedStats, { merge: true });
                 
                 import("firebase/firestore").then(({ getDocs, collection, setDoc, doc }) => {
                     getDocs(collection(db, "users", authUser.uid, "missions")).then(msnap => {
                         msnap.docs.forEach(mdoc => {
                             const mData = mdoc.data() as Mission;
                             const period = mData.period || 'daily';
                             const shouldReset = (period === 'daily') || (period === 'weekly' && isNewWeek);
                             
                             if (shouldReset && (mData.current > 0 || mData.status !== "Pending")) {
                                 setDoc(doc(db, "users", authUser.uid, "missions", mData.id), { ...mData, current: 0, status: "Pending" });
                             }
                         });
                     }).catch(console.error);
                 });
             } else if (isNewWeek) {
                 loadedStats.currentWeekStart = currentMondayStr;
                 loadedStats.dutyDaysUsed = 0;
                 loadedStats.restDaysUsed = 0;
                 setDoc(doc(db, "users", authUser.uid), loadedStats, { merge: true });
                 
                 import("firebase/firestore").then(({ getDocs, collection, setDoc, doc }) => {
                     getDocs(collection(db, "users", authUser.uid, "missions")).then(msnap => {
                         msnap.docs.forEach(mdoc => {
                             const mData = mdoc.data() as Mission;
                             if (mData.period === 'weekly' && (mData.current > 0 || mData.status !== "Pending")) {
                                 setDoc(doc(db, "users", authUser.uid, "missions", mData.id), { ...mData, current: 0, status: "Pending" });
                             }
                         });
                     }).catch(console.error);
                 });
             }
             
             setStats(loadedStats);
        } else {
             // init
             setDoc(doc(db, "users", authUser.uid), DEFAULT_STATS).catch(e => handleFirestoreError(e, OperationType.CREATE, "users"));
        }
    }, (error) => handleFirestoreError(error, OperationType.GET, "users"));

    const missionsUnsub = onSnapshot(collection(db, "users", authUser.uid, "missions"), (snapshot) => {
        if (!snapshot.empty) {
            const loaded = snapshot.docs.map(d => d.data() as Mission);
            const currentIds = loaded.map(m => m.id);
            
            // Check if any default missions are missing or have outdated titles
            const missingMissions = DEFAULT_MISSIONS.filter(dm => !currentIds.includes(dm.id));
            const outdatedMissions = loaded.filter(m => {
              const dm = DEFAULT_MISSIONS.find(d => d.id === m.id);
              if (dm && dm.title !== m.title) return true;
              return false;
            });
            
            // Deprecated missions and duplicates
            const deprecatedIds = ["m-03-revision", "m-04-mock", "m-04-gt-biweekly"];
            
            // We want to remove deprecatedIds AND any old GTs that we used to generate.
            const isDeprecated = (m: Mission) => {
               if (deprecatedIds.includes(m.id)) return true;
               // Any system mission that is not in DEFAULT_MISSIONS
               if (m.id.startsWith("m-") && !DEFAULT_MISSIONS.find(dm => dm.id === m.id)) return true;
               return false;
            };

            const hasDeprecated = loaded.some(isDeprecated);
            
            if (missingMissions.length > 0 || hasDeprecated || outdatedMissions.length > 0) {
               const updated = loaded.filter(m => !isDeprecated(m)).map(m => {
                 const dm = DEFAULT_MISSIONS.find(d => d.id === m.id);
                 if (dm && dm.title !== m.title) {
                   return { ...m, title: dm.title };
                 }
                 return m;
               });
               
               missingMissions.forEach(m => {
                 updated.push(m);
                 setDoc(doc(db, "users", authUser.uid, "missions", m.id), m);
               });
               
               outdatedMissions.forEach(m => {
                  const dm = DEFAULT_MISSIONS.find(d => d.id === m.id);
                  if (dm) setDoc(doc(db, "users", authUser.uid, "missions", m.id), { ...m, title: dm.title }, { merge: true });
               });
               
               updated.sort((a, b) => {
                 const aIndex = DEFAULT_MISSIONS.findIndex(dm => dm.id === a.id);
                 const bIndex = DEFAULT_MISSIONS.findIndex(dm => dm.id === b.id);
                 const aIdx = aIndex === -1 ? 99 : aIndex;
                 const bIdx = bIndex === -1 ? 99 : bIndex;
                 if (aIdx === bIdx) return a.id.localeCompare(b.id);
                 return aIdx - bIdx;
               });
               setMissions(updated);
               
               if (hasDeprecated) {
                 loaded.filter(isDeprecated).forEach(m => {
                   deleteDoc(doc(db, "users", authUser.uid, "missions", m.id)).catch(() => {});
                 });
               }
            } else {
               const sortedLoaded = [...loaded].sort((a, b) => {
                 const aIndex = DEFAULT_MISSIONS.findIndex(dm => dm.id === a.id);
                 const bIndex = DEFAULT_MISSIONS.findIndex(dm => dm.id === b.id);
                 const aIdx = aIndex === -1 ? 99 : aIndex;
                 const bIdx = bIndex === -1 ? 99 : bIndex;
                 if (aIdx === bIdx) return a.id.localeCompare(b.id);
                 return aIdx - bIdx;
               });
               setMissions(sortedLoaded);
            }
        }
        else {
           // generate initial default missions
           Promise.all(DEFAULT_MISSIONS.map(m => setDoc(doc(db, "users", authUser.uid, "missions", m.id), m))).catch(e => handleFirestoreError(e, OperationType.CREATE, "missions"));
        }
    }, (e) => handleFirestoreError(e, OperationType.GET, "missions"));

    const logsUnsub = onSnapshot(collection(db, "users", authUser.uid, "logs"), (snapshot) => {
        setLogs(snapshot.docs.map(d => {
            const data = d.data() as EmergencyLog;
            return { ...data, id: d.id };
        }).sort((a,b) => new Date(`1970/01/01 ${b.timestamp}`).getTime() - new Date(`1970/01/01 ${a.timestamp}`).getTime()));
    }, (e) => handleFirestoreError(e, OperationType.GET, "logs"));

    const moodsUnsub = onSnapshot(collection(db, "users", authUser.uid, "moods"), (snapshot) => {
        setMoodLogs(snapshot.docs.map(d => d.data() as MoodLog).sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
    }, (e) => handleFirestoreError(e, OperationType.GET, "moods"));

    // We can still keep activeCase in localStorage for offline caching or simplicity since it's transient
    const activeCase = localStorage.getItem("patient_zero_v2_active_case");
    if (activeCase && activeCase !== "null") try { setCurrentCase(JSON.parse(activeCase)); } catch (e) {}

    return () => {
       statsUnsub();
       missionsUnsub();
       logsUnsub();
       moodsUnsub();
    }
  }, [authUser]);

  const computedDaysToExam = (() => {
    if (stats.targetExamDate) {
      const target = new Date(stats.targetExamDate);
      const now = new Date();
      const diffTime = target.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    return stats.daysToExam;
  })();

  const updateStats = (newStats: UserStats) => {
    setStats(newStats);
    const currentUser = auth.currentUser;
    if (currentUser) setDoc(doc(db, "users", currentUser.uid), newStats).catch(e => handleFirestoreError(e, OperationType.UPDATE, "users"));
    else localStorage.setItem("patient_zero_v2_stats", JSON.stringify(newStats));
  };

  const modifyStats = (modifier: (prev: UserStats) => UserStats) => {
     setStats(prev => {
         const mergedPrev = { ...DEFAULT_STATS, ...(prev || {}) };
         const next = modifier(mergedPrev);
         const currentUser = auth.currentUser;
         if (currentUser) {
            setDoc(doc(db, "users", currentUser.uid), next, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, "users"));
         } else {
            localStorage.setItem("patient_zero_v2_stats", JSON.stringify(next));
         }
         return next;
     });
  };

  const logActivity = (prev: UserStats, options: { mcqs?: number, videos?: number, cases?: number } = {}) => {
    const today = new Date().toISOString().split("T")[0];
    const newLogs = { ...(prev.activityLogs || {}) };
    newLogs[today] = (newLogs[today] || 0) + 1;
    let nextPrev = { ...prev, activityLogs: newLogs };
    if (options.mcqs) {
      const copyM = { ...(nextPrev.mcqLogs || {}) };
      copyM[today] = (copyM[today] || 0) + options.mcqs;
      nextPrev.mcqLogs = copyM;
    }
    if (options.videos) {
      const copyV = { ...(nextPrev.videoLogs || {}) };
      copyV[today] = (copyV[today] || 0) + options.videos;
      nextPrev.videoLogs = copyV;
    }
    if (options.cases) {
      const copyC = { ...(nextPrev.triageCasesLogs || {}) };
      copyC[today] = (copyC[today] || 0) + options.cases;
      nextPrev.triageCasesLogs = copyC;
    }
    return nextPrev;
  };

  const updateMissions = (newMissions: Mission[]) => {
    setMissions(newMissions);
    if (authUser) {
      newMissions.forEach(m => {
        setDoc(doc(db, "users", authUser.uid, "missions", m.id), m).catch(e => handleFirestoreError(e, OperationType.UPDATE, "missions"));
      });
    } else {
      localStorage.setItem("patient_zero_v2_missions", JSON.stringify(newMissions));
    }
  };

  const updateLogs = (newLogs: EmergencyLog[]) => {
    setLogs(newLogs);
    if (authUser) {
      newLogs.forEach(l => {
        setDoc(doc(db, "users", authUser.uid, "logs", l.id), l).catch(e => handleFirestoreError(e, OperationType.UPDATE, "logs"));
      });
    } else {
      localStorage.setItem("patient_zero_v2_logs", JSON.stringify(newLogs));
    }
  };

  const updateMoodLogs = (newLogs: MoodLog[]) => {
    setMoodLogs(newLogs);
    if (authUser) {
      // For simplicity in UI logic that expects array append, we'll just write the newly added mood log.
      // But let's follow the shape of rewriting array elements for simplicity.
      newLogs.forEach((l, i) => {
        setDoc(doc(db, "users", authUser.uid, "moods", `mood-${l.timestamp.replace(/[:\/ ]/g, '-')}`), l).catch(e => handleFirestoreError(e, OperationType.UPDATE, "moods"));
      });
    } else {
      localStorage.setItem("patient_zero_v2_mood", JSON.stringify(newLogs));
    }
  };

  useEffect(() => {
    const idleInterval = setInterval(() => {
      modifyStats((prev) => {
        const decayValue = prev.burnoutIndex > 50 ? 1.5 : 0.8;
        const rawHealth = prev.patientHealth - decayValue;
        const finalHealth = Math.max(0, parseFloat(rawHealth.toFixed(1)));
        const addedStress = prev.daysToExam < 60 ? 0.3 : 0.1;
        const rawBurnout = prev.burnoutIndex + addedStress;
        const finalBurnout = Math.min(100, parseFloat(rawBurnout.toFixed(1)));
        const nextStats = { ...prev, patientHealth: finalHealth, burnoutIndex: finalBurnout };
        localStorage.setItem("patient_zero_v2_stats", JSON.stringify(nextStats));
        return nextStats;
      });
    }, 180000);
    return () => clearInterval(idleInterval);
  }, []);


  const getSimulatedVitals = (): PatientVitals => {
    const safeStats = stats || DEFAULT_STATS;
    const baseHR = 72;
    const stressAddition = Math.floor((safeStats.burnoutIndex || 0) * 0.7);
    const criticalAddition = (safeStats.patientHealth || 100) < 35 ? 30 : 0;
    const finalHR = Math.min(150, Math.max(0, baseHR + stressAddition + criticalAddition));
    const finalSPO2 = Math.min(100, Math.max(0, 85 + Math.floor((safeStats.patientHealth || 100) * 0.15)));
    const bpSys = 110 + Math.floor((safeStats.burnoutIndex || 0) * 0.5);
    const bpDias = 70 + Math.floor((safeStats.burnoutIndex || 0) * 0.3);
    const finalBP = (safeStats.patientHealth || 100) < 30 ? "82/46" : `${bpSys}/${bpDias}`;
    const finalTemp = 97.8 + parseFloat(((safeStats.burnoutIndex || 0) * 0.04).toFixed(1));
    return { hr: finalHR, bp: finalBP, spo2: finalSPO2, temp: finalTemp };
  };

  const currentVitals = getSimulatedVitals();
  const isSimulationCritical = (stats || DEFAULT_STATS).patientHealth < 35;

  const spawnParticles = (text: string) => {
    const id = `particle-${Date.now()}-${Math.random()}`;
    const x = Math.random() * 120 + 80;
    const y = Math.random() * 80 + 120;
    setParticles((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1500);
  };

  const triggerManualStabilize = (type: 'QuickMCQ' | 'FullStudy' | 'QuickBreak', subjects: string[] = []) => {
    modifyStats((prev) => {
      let hpReward = 15; let xpReward = 50; let crdtReward = 1;
      if (type === 'FullStudy') { hpReward = 35; xpReward = 150; crdtReward = 3; }
      else if (type === 'QuickBreak') { hpReward = 10; xpReward = 10; crdtReward = 0; }
      const rawHealth = prev.patientHealth + hpReward;
      const rawBurnout = prev.burnoutIndex - (type === 'QuickBreak' ? 30 : 10);
      
      let nextBase = { ...prev, patientHealth: Math.min(100, rawHealth), burnoutIndex: Math.max(1, rawBurnout), xp: (prev.xp || 0) + xpReward, credits: (prev.credits || 0) + crdtReward };
      const dateStr = new Date().toISOString().split("T")[0];
      
      if (type === 'QuickMCQ') {
        const copyM = { ...(nextBase.mcqLogs || {}) };
        copyM[dateStr] = (copyM[dateStr] || 0) + 10;
        nextBase.mcqLogs = copyM;
      } else if (type === 'FullStudy') {
        const copyV = { ...(nextBase.videoLogs || {}) };
        copyV[dateStr] = (copyV[dateStr] || 0) + 1;
        nextBase.videoLogs = copyV;
      }

      if (subjects.length > 0 && type !== 'QuickBreak') {
        const subPer = { ...(nextBase.subjectPerformance || {}) };
        const qty = type === 'QuickMCQ' ? 10 : 1;
        subjects.forEach(sub => {
          if (sub !== 'All') {
            subPer[sub] = subPer[sub] || { total: 0, correct: 0 };
            subPer[sub].total += qty;
            subPer[sub].correct += type === 'QuickMCQ' ? Math.floor(qty * 0.7) : qty;
          }
        });
        nextBase.subjectPerformance = subPer;
      }
      
      const next = logActivity(nextBase);
      return next;
    });

    let hs = "+15% Stability";
    let xs = "+50 XP / +1 CRDT";
    if (type === 'FullStudy') { hs = "+35% Stability"; xs = "+150 XP / +3 CRDT"; }
    else if (type === 'QuickBreak') { hs = "RESTING"; xs = "+10 XP"; }
    spawnParticles(hs);
    spawnParticles(xs);

    if (type === 'QuickMCQ') {
      const targetM = missions.find(m => m.category === "MCQ");
      if (targetM && targetM.status === "Pending") {
        handleUpdateMissionProgress(targetM.id, 10);
      }
    } else if (type === 'FullStudy') {
      const targetM = missions.find(m => m.category === "Lectures");
      if (targetM && targetM.status === "Pending") {
        handleUpdateMissionProgress(targetM.id, 1);
      }
    }
  };

  const handleSleepSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split("T")[0];
    modifyStats((prev) => {
      let burnoutRedux = sleepHours * 10;
      let hpReward = sleepHours * 4;
      const rawHealth = prev.patientHealth + hpReward;
      const rawBurnout = prev.burnoutIndex - burnoutRedux;
      const nextSleepLogs = { ...prev.sleepLogs };
      nextSleepLogs[dateStr] = (nextSleepLogs[dateStr] || 0) + sleepHours;
      return logActivity({ ...prev, patientHealth: Math.min(100, rawHealth), burnoutIndex: Math.max(1, rawBurnout), sleepLogs: nextSleepLogs });
    });
    spawnParticles(`RESTORED (${sleepHours}h Sleep)`);
    spawnParticles(`-${Math.floor(sleepHours * 10)}% Burnout`);
    setSleepHours(8);
    setShowSleepModal(false);
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
    updateMoodLogs(copyLogs);
    modifyStats((prev) => {
      const rawHp = prev.patientHealth + 12;
      const next = { ...prev, patientHealth: Math.min(100, rawHp), burnoutIndex: Math.max(1, prev.burnoutIndex - 15) };
      
      return next;
    });
    spawnParticles("Resilience Restored (+12%)");
    setMoodTrigger("");
  };

  const handleSimulateSlip = (reason: string) => {
    spawnParticles("Alert: Attention Slip!");
    spawnParticles("-15% Stability");
    modifyStats((prev) => {
      const finalHealth = Math.max(0, prev.patientHealth - 15);
      const finalBurnout = Math.min(100, prev.burnoutIndex + 20);
      const next = { ...prev, patientHealth: finalHealth, burnoutIndex: finalBurnout };
      
      return next;
    });
  };

  const handleAddCustomMission = (title: string, category: 'MCQ' | 'Revision' | 'Lectures' | 'Tests' | 'Custom', target: number, unit: string, period?: 'daily' | 'weekly') => {
    const freshM: Mission = { 
      id: `custom-m-${Date.now()}`, 
      title, 
      category, 
      target, 
      current: 0, 
      unit, 
      xpReward: category === "Tests" ? 200 : 80, 
      creditReward: category === "Tests" ? 3 : 1, 
      stabilizeValue: category === "Tests" ? 40 : 15, 
      status: "Pending",
      period: period || (category === "Tests" ? "weekly" : "daily")
    };
    updateMissions([freshM, ...missions]);
  };

  const handleUpdateMissionProgress = (id: string, amount?: number) => {
    const copy = missions.map(m => ({ ...m }));
    const item = copy.find(m => m.id === id);
    if (!item || item.status === "Completed") return;
    const adjustedTarget = stats.studyMode === 'Duty' ? Math.max(1, Math.ceil(item.target / 2)) : 
                           stats.studyMode === 'Rest' ? 0 : item.target;
    
    const delta = amount !== undefined ? amount : 1;
    item.current = Math.min(adjustedTarget, item.current + delta);
    sound.click();
    spawnParticles(`+${delta} ${item.unit}`);
    updateMissions(copy);
  };

  const handleClaimMissionReward = (id: string, overrideCompletion: boolean = false) => {
    const copy = missions.map(m => ({ ...m }));
    const item = copy.find(m => m.id === id);
    if (!item || item.status === "Completed") return;
    const adjustedTarget = stats.studyMode === 'Duty' ? Math.max(1, Math.ceil(item.target / 2)) : 
                           stats.studyMode === 'Rest' ? 0 : item.target;
    
    if (!overrideCompletion && item.current < adjustedTarget) {
      return; 
    }

    item.current = adjustedTarget;
    item.status = "Completed";
    modifyStats((prev) => {
      const nextXp = (prev.xp || 0) + item.xpReward;
      const next = logActivity({ ...prev, xp: nextXp, credits: (prev.credits || 0) + (item.creditReward || 0), patientHealth: Math.min(100, prev.patientHealth + item.stabilizeValue), burnoutIndex: Math.max(4, prev.burnoutIndex - 8) });
      
      return next;
    });
    sound.stabilizationChime();
    spawnParticles(`+${item.xpReward} XP & +${item.creditReward} CRDT`);
    updateMissions(copy);
  };

  const handleClearLogs = () => {
    const logsToDelete = [...logs];
    if (authUser) {
       logsToDelete.forEach(l => {
          if (l.id) {
             deleteDoc(doc(db, "users", authUser.uid, "logs", l.id)).catch(console.error);
          }
       });
    } else {
       localStorage.removeItem("patient_zero_v2_logs");
    }
    setLogs([]);
  };

  const handleUpdateProfile = (name: string, specialty: string, year: number) => {
    modifyStats((prev) => {
      const next = { ...prev, studentName: name, targetSpecialty: specialty, targetExamYear: year };
      
      return next;
    });
  };

  const handleUpdateDate = (dateStr: string) => {
    modifyStats((prev) => {
      const next = { ...prev, targetExamDate: dateStr };
      return next;
    });
  };

  const handleHardReset = () => {
    localStorage.clear();
    setStats(DEFAULT_STATS);
    setMissions(DEFAULT_MISSIONS.map(m => ({ ...m })));
    setLogs([]);
    setMoodLogs([]);
    setCurrentCase(null);
    setActiveTab("dashboard");
    
    if (authUser) {
      // Overwrite the stats completely without { merge: true } so older logs are destroyed
      setDoc(doc(db, "users", authUser.uid, "stats", "current"), DEFAULT_STATS).catch(console.error);
      setDoc(doc(db, "users", authUser.uid), DEFAULT_STATS).catch(console.error);
      
      // Delete any missions that aren't in DEFAULT_MISSIONS
      missions.forEach(m => {
        if (!DEFAULT_MISSIONS.find(dm => dm.id === m.id)) {
          deleteDoc(doc(db, "users", authUser.uid, "missions", m.id)).catch(console.error);
        }
      });
      
      DEFAULT_MISSIONS.forEach(m => setDoc(doc(db, "users", authUser.uid, "missions", m.id), { ...m }));
      
      logs.forEach(l => deleteDoc(doc(db, "users", authUser.uid, "logs", l.id)).catch(console.error));
      moodLogs.forEach(m => deleteDoc(doc(db, "users", authUser.uid, "moods", m.id)).catch(console.error));
    }
    
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
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "missions", label: "Protocols", icon: <Calendar className="w-5 h-5" /> },
    { id: "triage", label: "Triage", icon: <Activity className="w-5 h-5" /> },
    { id: "progress", label: "Analytics", icon: <FileText className="w-5 h-5" /> },
    { id: "avatar", label: "My Journey", icon: <Compass className="w-5 h-5" /> },
    { id: "rewards", label: "Rewards", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
  ];

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans tracking-tight text-slate-800 dark:text-slate-200">
        <Activity className="w-8 h-8 animate-spin text-cyan-600 mb-4" />
        <span className="ml-4 font-bold tracking-widest uppercase">Initializing Medical Frame...</span>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans tracking-tight">
         <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-800 overflow-hidden">
               <img src="/logo.svg" alt="Patient Zero Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
               <Heart className="w-8 h-8 text-cyan-400 hidden" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight text-center mb-2">Patient Zero</h1>
            <p className="text-sm font-medium text-slate-500 text-center mb-8">Access the secure clinical simulation and sync your progress to the cloud.</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={signInWithGoogle} className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
               <LogIn className="w-5 h-5" />
               Sign in with Google
            </motion.button>
         </div>
      </div>
    )
  }

  const narrativeState = getNarrativeState(stats);

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
               <div className={`w-8 h-8 rounded shrink-0 flex justify-center items-center shadow-sm border font-black overflow-hidden ${
                  isSimulationCritical ? "bg-red-50 dark:bg-red-950 border-red-200 text-red-600" : "bg-slate-900 border-slate-800 text-cyan-400"
               }`}>
                  <img src="/logo.svg" alt="Patient Zero Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                  <span className="hidden">P₀</span>
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-wide leading-none">Patient Zero</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[120px]">Dr. {stats.studentName}</span>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                  <Activity className="w-4 h-4" />
               </motion.button>
               <div className="relative">
                 <motion.button whileTap={{ scale: 0.95 }} 
                   onClick={() => setModeMenuOpen(m => !m)}
                   className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-between min-w-[140px] gap-2 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                 >
                   <span className="flex items-center gap-1.5 whitespace-nowrap">
                     {stats.studyMode === 'Rest' && <Heart className="w-3 h-3 text-rose-500" />}
                     {stats.studyMode === 'Duty' && <ShieldAlert className="w-3 h-3 text-orange-500" />}
                     {(!stats.studyMode || stats.studyMode === 'Normal') && <TrendingUp className="w-3 h-3 text-blue-500" />}
                     {stats.studyMode === 'Rest' ? 'Recovery' : stats.studyMode === 'Duty' ? 'Intensive On-Call' : 'Regular Shift'}
                   </span>
                   <ChevronDown className="w-3 h-3" />
                 </motion.button>
                 <AnimatePresence>
                   {modeMenuOpen && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setModeMenuOpen(false)} />
                       <motion.div 
                         initial={{opacity: 0, y: -5, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -5, scale: 0.95}}
                         transition={{ duration: 0.15 }}
                         className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col py-1"
                       >
                         {[ 
                           {id: 'Normal', label: 'Regular Shift', icon: <TrendingUp className="w-4 h-4 text-blue-500" />},
                           {id: 'Duty', label: 'Intensive On-Call', icon: <ShieldAlert className="w-4 h-4 text-orange-500" />},
                           {id: 'Rest', label: 'Recovery Shift', icon: <Heart className="w-4 h-4 text-rose-500" />}
                         ].map(mode => (
                           <motion.button whileTap={{ scale: 0.95 }} key={mode.id}
                             onClick={() => {
                               const nextMode = mode.id as 'Normal' | 'Duty' | 'Rest';
                               modifyStats(prev => {
                                 const now = new Date();
                                 const day = now.getDay() || 7; 
                                 now.setHours(0,0,0,0);
                                 const wkStart = new Date(now);
                                 wkStart.setDate(now.getDate() - day + 1);
                                 const wkStr = wkStart.toISOString().slice(0, 10);
                                 
                                 let duties = prev.currentWeekStart === wkStr ? (prev.dutyDaysUsed || 0) : 0;
                                 let rests = prev.currentWeekStart === wkStr ? (prev.restDaysUsed || 0) : 0;
                                 
                                 if (nextMode === 'Duty' && prev.studyMode !== 'Duty') {
                                     if (duties >= 3) {
                                         setTimeout(() => alert("Intensive On-Call limit reached (3 shifts/week)."), 100);
                                         return prev;
                                     }
                                     duties++;
                                 }
                                 if (nextMode === 'Rest' && prev.studyMode !== 'Rest') {
                                     if (rests >= 1) {
                                         setTimeout(() => alert("Recovery Shift limit reached (1/week)."), 100);
                                         return prev;
                                     }
                                     rests++;
                                 }
                                 
                                 let alertMsg = "";
                                 if (nextMode === 'Duty') alertMsg = `Intensive Shift active. Remaining this week: ${3 - duties}`; 
                                 if (nextMode === 'Rest') alertMsg = "Recovery Shift active.";
                                 if (nextMode === 'Normal') alertMsg = "Regular Shift active.";
                                 setTimeout(() => alert(alertMsg), 100);
            
                                 return {
                                   ...prev,
                                   studyMode: nextMode,
                                   currentWeekStart: wkStr,
                                   dutyDaysUsed: duties,
                                   restDaysUsed: rests
                                 };
                               });
                               setModeMenuOpen(false);
                             }}
                             className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors w-full border-b border-transparent last:border-0"
                           >
                              <div className="flex items-center gap-3">
                                {mode.icon}
                                <span className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">{mode.label}</span>
                              </div>
                              {stats.studyMode === mode.id && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                           </motion.button>
                         ))}
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>
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
              {narrativeState.activeNarrativeEvent && (
                <div className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-sm font-bold tracking-wide">
                  {narrativeState.activeNarrativeEvent}
                </div>
              )}
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
                        <p className="text-sm text-slate-400 font-medium">{narrativeState.missionBriefing}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded border shadow-sm tracking-widest uppercase ${
                        isSimulationCritical 
                          ? "bg-red-900/50 text-red-400 border-red-500/50" 
                          : "bg-emerald-900/50 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      }`}>
                        {narrativeState.phaseLabel}
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
                          {computedDaysToExam} d
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 border-r border-slate-700 pr-4 pl-0 sm:pl-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">CREDITS</span>
                        <span className="font-bold text-lg text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                          {stats.credits}
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

                  <Heatmap activityLogs={stats.activityLogs || {}} />

                  {/* Actions Deck */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">Immediate Interventions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setActiveTab("triage"); startTriageSession(); }}
                        disabled={isGenerating}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-rose-300 hover:shadow-lg text-left rounded-3xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShieldAlert className="w-7 h-7 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Morning Triage</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Solve 5 back-to-back emergencies.
                        </p>
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setManualLogType("QuickMCQ"); setManualLogModalOpen(true); setSelectedSubjects([]); }}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-orange-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <BookOpen className="w-7 h-7 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">QBank Session</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Log 10 practice MCQs. (+15% Health)
                        </p>
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setManualLogType("FullStudy"); setManualLogModalOpen(true); setSelectedSubjects([]); }}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-purple-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <Activity className="w-7 h-7 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Video Session</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Log 1 hour video study. (+35% Health)
                        </p>
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => { setActiveTab("vault"); }}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-blue-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <BookOpen className="w-7 h-7 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">High-Yield Vault</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Review clinical pearls from past cases.
                        </p>
                      </motion.button>

                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSleepModal(true)}
                        className="p-6 border border-white/50 backdrop-blur-md bg-white dark:bg-slate-900/40 hover:bg-white dark:bg-slate-900/60 hover:border-emerald-300 hover:shadow-lg text-left rounded-3xl transition-all group"
                      >
                        <Smile className="w-7 h-7 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Sleep / Rest</span>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Reset exhaustion and rest your brain.
                        </p>
                      </motion.button>
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
                            <motion.button whileTap={{ scale: 0.95 }}
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
                            </motion.button>
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

                      <motion.button whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="py-4 w-full bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-purple-600/20 transition-all"
                      >
                        Submit Adjustment Report
                      </motion.button>
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
                      {computedDaysToExam}
                    </span>
                    <span className="text-base font-bold text-slate-400 mt-2">Days Remaining</span>
                  </div>

                  {/* Quick Protocol list */}
                  <div className="border border-white/60 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 flex flex-col flex-1 shadow-xl h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Active Protocols</h4>
                      <motion.button whileTap={{ scale: 0.95 }} 
                        onClick={() => handleTabChange("missions")}
                        className="text-blue-600 text-sm hover:text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Manage
                      </motion.button>
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
                onClaimReward={handleClaimMissionReward}
                onAddMission={handleAddCustomMission}
                onSimulateSlip={handleSimulateSlip}
                studyMode={stats.studyMode}
              />
            </motion.div>
          )}

                    {activeTab === "triage" && (
            <TriageSession
              stats={stats}
              missions={missions}
              logs={logs}
              modifyStats={modifyStats}
              updateLogs={updateLogs}
              logActivity={logActivity}
              handleUpdateMissionProgress={handleUpdateMissionProgress}
              spawnParticles={spawnParticles}
              onExit={() => setActiveTab("dashboard")}
            />
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
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleClearLogs} className="text-xs font-bold text-rose-600 hover:text-rose-700 transition px-4 py-2 rounded-xl bg-rose-50 border border-rose-200">Purge Logs</motion.button>
                </div>
                <ShiftLog logs={logs} />
              </div>
            </motion.div>
          )}

          {activeTab === "vault" && (
             <motion.div
              key="vault"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/10 dark:border-slate-800">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                       <BookOpen className="w-6 h-6" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Clinical Records</h2>
                       <p className="text-slate-500 text-sm">Review clinical pearls and operation history.</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                     <button onClick={() => setVaultView("pearls")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${vaultView === 'pearls' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>High-Yield Pearls</button>
                     <button onClick={() => setVaultView("history")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${vaultView === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Operation History</button>
                   </div>
                 </div>

                 {logs.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/30">
                       <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
                       <p className="text-slate-500 dark:text-slate-400 font-medium">No clinical records acquired yet.<br/>Complete Triage cases to populate this vault.</p>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-6">
                      {vaultView === "pearls" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {logs.filter(l => l.result === "STABILIZED").map((log, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-lg transition-all shadow border-b-4 border-b-slate-200 dark:border-b-white/10 flex flex-col h-full group">
                               <div className="flex justify-between items-start mb-4">
                                  <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full">{log.specialty}</span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">{log.timestamp}</span>
                               </div>
                               <p className="font-bold text-slate-800 dark:text-slate-100 mb-4 text-sm leading-relaxed">{log.pearl}</p>
                               <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 space-y-2 mt-auto">
                                  <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-300">Vignette Context:</span> <span className="line-clamp-2 mt-1">{log.vignette}</span></p>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-2 pt-2 border-t border-slate-200 dark:border-white/5">Diagnosed: <span className="text-emerald-600 dark:text-emerald-400">{log.correctAnswer}</span></p>
                               </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {logs.map((log, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-all ${log.result === 'STABILIZED' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50'}`}>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md ${log.result === 'STABILIZED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'}`}>
                                    {log.result}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{log.timestamp}</span>
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{log.specialty}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{log.vignette}</p>
                              </div>
                              <div className="flex flex-col sm:items-end gap-1 min-w-[150px] shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                                <span className="text-xs text-slate-500 font-bold uppercase">Your Action</span>
                                <span className={`text-sm font-bold ${log.result === 'STABILIZED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>{log.userAnswer || "No Action"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                 )}
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
              className="flex flex-col gap-8"
            >
              <JourneyMap stats={stats} />
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
                credits={stats.credits || 0} 
                onRedeem={(cost) => {
                  modifyStats(prev => {
                    const currentCredits = prev.credits || 0;
                    const next = { ...prev, credits: Math.max(0, currentCredits - cost) };
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
                targetExamDate={stats.targetExamDate || ""}
                onUpdateDate={handleUpdateDate} 
                onUpdateProfile={handleUpdateProfile}
                onHardReset={handleHardReset} 
                onSignOut={signOut}
              />
            </motion.div>
          )}

        </AnimatePresence>
           </div>
        </main>

        {/* Sleep Logging Modal */}
        <AnimatePresence>
          {showSleepModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-slate-800"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 mx-auto">
                    <Smile className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-center tracking-tight mb-2">Log Recovery Session</h3>
                <p className="text-center text-slate-500 mb-8 text-sm">Sleep is vital for cognition. Logging sleep dramatically reduces burnout and restores the health multiplier.</p>
                
                <form onSubmit={handleSleepSubmit} className="flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-sm tracking-wide text-slate-700 dark:text-slate-300">Duration (Hours)</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">{sleepHours}h</span>
                    </div>
                    <input 
                      type="range" min="1" max="14" step="1" 
                      value={sleepHours} 
                      onChange={(e) => setSleepHours(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer" 
                    />
                    <div className="flex justify-between mt-2 text-[10px] uppercase font-bold text-slate-400">
                      <span>1h (Napp)</span>
                      <span>14h (Coma)</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowSleepModal(false)} className="flex-1 py-4 font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition uppercase text-sm tracking-widest whitespace-nowrap">Cancel</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="flex-[2] py-4 font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition uppercase text-sm tracking-widest">Execute Rest</motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Universal Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-around max-w-lg mx-auto w-full px-2 py-1">
             {NAV_TABS.map(tab => (
                 <motion.button whileTap={{ scale: 0.95 }}
                   key={tab.id}
                   onClick={() => {
                     handleTabChange(tab.id as any);
                     if ((tab as any).onClick) (tab as any).onClick();
                   }}
                   className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
                     activeTab === tab.id
                        ? "text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 dark:shadow-[inset_0_0_15px_rgba(34,211,238,0.2)]"
                        : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                   }`}
                 >
                    <div className={`${activeTab === tab.id ? 'animate-bounce drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`}>{tab.icon}</div>
                    <span className="text-[9px] font-black tracking-widest uppercase">{tab.label}</span>
                 </motion.button>
             ))}
           </div>
        </nav>

        <AnimatePresence>
          {manualLogModalOpen && manualLogType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-slate-800"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${manualLogType === "QuickMCQ" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"}`}>
                    {manualLogType === "QuickMCQ" ? <BookOpen className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
                </div>
                <h3 className="text-2xl font-black text-center tracking-tight mb-2">Log {manualLogType === "QuickMCQ" ? "QBank Session" : "Video Session"}</h3>
                <p className="text-center text-slate-500 mb-8 text-sm">Please specify the subject(s) studied.</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedSubjects.length === 0) { alert('Please select at least one subject (or "General / All")'); return; }
                  triggerManualStabilize(manualLogType, selectedSubjects);
                  setManualLogModalOpen(false);
                }} className="flex flex-col gap-6">
                  <div className="flex flex-wrap gap-2">
                    {["General / All", ...AVAILABLE_SUBJECTS].map(sub => {
                       const isSelected = selectedSubjects.includes(sub);
                       return (
                         <motion.button whileTap={{ scale: 0.95 }}
                           type="button"
                           key={sub}
                           onClick={() => {
                             if (sub === "General / All") {
                               setSelectedSubjects(["General / All"]);
                             } else {
                               const next = selectedSubjects.filter(s => s !== "General / All");
                               if (next.includes(sub)) {
                                 setSelectedSubjects(next.filter(s => s !== sub));
                               } else {
                                 setSelectedSubjects([...next, sub]);
                               }
                             }
                           }}
                           className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                         >
                            {sub}
                         </motion.button>
                       )
                    })}
                  </div>
                  
                  <div className="flex gap-4">
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setManualLogModalOpen(false)} className="flex-1 py-4 font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition uppercase text-sm tracking-widest whitespace-nowrap">Cancel</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="flex-[2] py-4 font-bold rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition uppercase text-sm tracking-widest">Save Log</motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
