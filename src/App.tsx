import { useState, useEffect, useRef, FormEvent } from "react";
import { PatientVitals, ClinicalCase, UserStats, EmergencyLog, Mission, MoodLog, DailyMissionRecord } from "./types";
import { fallbackCases } from "./fallbackCases";
import VitalsMonitor from "./components/VitalsMonitor";
import TriageSession from "./components/TriageSession";
import ShiftLog from "./components/ShiftLog";
import HelpManual from "./components/HelpManual";
import { sound } from "./lib/audio";
import { registerServiceWorker, triggerNotification } from "./lib/notifications";
import { getNarrativeState, NarrativeState } from './lib/narrative';
import { formatDateDMY, formatDateTimeDMY, getTodayISO, getIntermediateISODates, getDaysDiff, getCurrentMondayISO, getDaysAgoISO } from "./lib/dateUtils";
import { auth, db, signInWithGoogle, signOut, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";

import MissionsPanel from "./components/MissionsPanel";
import ProgressPanel from "./components/ProgressPanel";
import JourneyMap from "./components/JourneyMap";
import Heatmap from "./components/Heatmap";
import RewardsPanel from "./components/RewardsPanel";
import WellnessPanel from "./components/WellnessPanel";
import SettingsPanel from "./components/SettingsPanel";
import DashboardTab from "./components/DashboardTab";
import { formatDoctorName } from "./lib/doctorUtils";

import { motion, AnimatePresence } from "motion/react";
import {
  Stethoscope, ShieldAlert, ShieldCheck, Award, Clock, BookOpen, AlertOctagon, ChevronRight, ChevronDown, User,
  Compass, RefreshCw, Check, X, Sparkles, Zap, Activity, Heart, TrendingUp, Brain, Smile,
  AlertTriangle, Lightbulb, Volume2, VolumeX, Menu, LogOut, FileText, BarChart3, Settings, Calendar, Flame,
  Medal, Gift, Trophy, ShoppingBag, Gamepad2, Ticket, Pizza, Music, Cpu, LogIn, ArrowLeft, Maximize2
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

const calculateDaysToExam = (targetDateStr: string) => {
  if (!targetDateStr) return 0;
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const DEFAULT_TARGET_DATE = "2027-03-01";

const DEFAULT_STATS: UserStats = {
  studentName: "B",
  targetSpecialty: "Emergency Medicine",
  targetExamYear: 2027,
  targetExamDate: DEFAULT_TARGET_DATE,
  daysToExam: calculateDaysToExam(DEFAULT_TARGET_DATE),
  createdAt: "2026-10-07T08:00:00.000Z",
  firstActiveDate: "2026-10-07",
  lastMissionResetDate: getTodayISO(),
  patientHealth: 100,
  burnoutIndex: 0,
  isStabilizing: false,
  shiftStreak: 4,
  patientsSaved: 0,
  patientsFlatlined: 0,
  unlockedPearlsCount: 0,
  xp: 0,
  credits: 0,
  subjectPerformance: {},
  subjectPerformanceDaily: {},
  activityLogs: {},
  sleepLogs: {},
  studyMode: 'Normal',
  dutyDaysUsed: 0,
  restDaysUsed: 0,
  currentWeekStart: getCurrentMondayISO(),
  lastActiveTimestamp: Date.now(),
  streakShields: 0,
  restorativeHistory: [],
};

const DEFAULT_MISSIONS: Mission[] = [
  { id: "m-04-triage", title: "Daily Triage Completion", category: "Triage", target: 1, current: 0, unit: "Session", xpReward: 300, stabilizeValue: 50, status: "Pending", period: "daily" },
  { id: "m-01-mcqs", title: "Complete daily Marrow MCQs", category: "MCQ", target: 50, current: 0, unit: "Questions", xpReward: 100, stabilizeValue: 25, status: "Pending", period: "daily" },
  { id: "m-02-lectures", title: "Watch Marrow video modules", category: "Lectures", target: 4, current: 0, unit: "Hours", xpReward: 200, stabilizeValue: 35, status: "Pending", period: "daily" },
  { id: "m-05-review", title: "1 Hour Review Session", category: "Revision", target: 1, current: 0, unit: "Hour", xpReward: 80, stabilizeValue: 15, status: "Pending", period: "daily" },
  { id: "m-03-gt", title: "Defeat the Weekly Grand Test (GT)", category: "Tests", target: 1, current: 0, unit: "GT", xpReward: 500, stabilizeValue: 100, status: "Pending", period: "weekly" }
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
  const [honorsSubTab, setHonorsSubTab] = useState<"map" | "wellness">("map");
  const [vaultView, setVaultView] = useState<"pearls" | "history">("pearls");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("patient_zero_v2_theme");
    return saved ? saved === "dark" : true;
  });
  
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
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
      const todayString = getTodayISO();
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
    if (tab === "settings") {
      setIsProfileSettingsOpen(true);
      return;
    }
    if (tab === "avatar") {
      setActiveTab("progress");
      return;
    }
    if (tab === "achievements") {
      setActiveTab("progress");
      return;
    }
    setActiveTab(tab);
  };

  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [statsLoaded, setStatsLoaded] = useState<boolean>(false);
  const statsLoadedRef = useRef<boolean>(false);

  const calculateStudyStreak = (logs: Record<string, number> = {}) => {
    const dates = Object.keys(logs).sort((a,b) => b.localeCompare(a));
    if (!dates.length) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    
    let firstDateStr = dates[0];
    let firstDate = new Date(firstDateStr);
    firstDate.setHours(0,0,0,0);
    
    let diffDays = Math.round((currentDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 1) return 0;

    for (const d of dates) {
      const logDate = new Date(d);
      logDate.setHours(0,0,0,0);
      const diff = Math.round((currentDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24));
      
      if (diff === 0) {
        if (streak === 0) streak = 1;
      } else if (diff === 1) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }
    return streak;
  };

  const dailyStreak = calculateStudyStreak(stats.activityLogs);

  useEffect(() => {
    statsLoadedRef.current = statsLoaded;
  }, [statsLoaded]);

  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [missionHistory, setMissionHistory] = useState<DailyMissionRecord[]>([]);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);

  const [inAppToast, setInAppToast] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setInAppToast(msg);
    setTimeout(() => {
      setInAppToast(prev => (prev === msg ? null : prev));
    }, 3200);
  };
  const [moodRating, setMoodRating] = useState<number>(3);
  const [moodTrigger, setMoodTrigger] = useState<string>("");
  const [showSleepModal, setShowSleepModal] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number>(8);

  const [isDevSandboxMode, setIsDevSandboxMode] = useState<boolean>(() => {
    return localStorage.getItem("patient_zero_dev_sandbox") === "true";
  });

  const handleToggleDevSandbox = () => {
    setIsDevSandboxMode(prev => {
      const next = !prev;
      localStorage.setItem("patient_zero_dev_sandbox", next ? "true" : "false");
      showNotification(next 
        ? "DEV SANDBOX (SAFE): Test actions are isolated locally and will NOT touch Firestore!" 
        : "LIVE CLOUD SYNC: Actions now sync with your Google account.");
      return next;
    });
  };

  // Guest / Offline Mode persistence and daily continuity handler
  useEffect(() => {
    if (authUser && !isDevSandboxMode) return;
    const today = getTodayISO();
    const savedStatsStr = localStorage.getItem("patient_zero_v2_stats") || localStorage.getItem("patient_zero_stats") || localStorage.getItem("patient_zero_v1_stats");
    let loadedStats = DEFAULT_STATS;
    if (savedStatsStr) {
      try { 
        const parsed = JSON.parse(savedStatsStr);
        if (parsed.studentName === "Dr. Candidate" || parsed.studentName === "Candidate" || parsed.studentName === "Debarna" || parsed.studentName === "Dr. Debarna") {
          parsed.studentName = "B";
        }
        loadedStats = { ...DEFAULT_STATS, ...parsed }; 
      } catch (e) {}
    }

    const savedMissionsStr = localStorage.getItem("patient_zero_v2_missions") || localStorage.getItem("patient_zero_missions");
    let loadedMissions = DEFAULT_MISSIONS;
    if (savedMissionsStr) {
      try { loadedMissions = JSON.parse(savedMissionsStr); } catch (e) {}
    }

    const savedLogsStr = localStorage.getItem("patient_zero_v2_logs") || localStorage.getItem("patient_zero_logs");
    let initialLogs: EmergencyLog[] = [];
    if (savedLogsStr) {
      try {
        initialLogs = JSON.parse(savedLogsStr);
        setLogs(initialLogs);
      } catch (e) {}
    }

    const savedMoodStr = localStorage.getItem("patient_zero_v2_mood") || localStorage.getItem("patient_zero_mood");
    if (savedMoodStr) {
      try { setMoodLogs(JSON.parse(savedMoodStr)); } catch (e) {}
    }

    const savedHistoryStr = localStorage.getItem("patient_zero_v2_mission_history") || localStorage.getItem("patient_zero_history");
    let loadedHistory: DailyMissionRecord[] = [];
    if (savedHistoryStr) {
      try { loadedHistory = JSON.parse(savedHistoryStr); } catch (e) {}
    }

    const currentMondayStr = getCurrentMondayISO();
    
    const isNewWeek = loadedStats.currentWeekStart !== currentMondayStr;
    const isNewDay = loadedStats.lastMissionResetDate !== today;

    if (isNewDay || isNewWeek) {
      const prevDate = loadedStats.lastMissionResetDate || today;
      if (isNewDay && prevDate !== today) {
        // 1. Evaluate and archive previous active day (prevDate)
        if (loadedMissions.length > 0) {
          const dailyOnly = loadedMissions.filter(m => (m.period || 'daily') === 'daily');
          const completed = dailyOnly.filter(m => m.status === 'Completed').length;
          const total = dailyOnly.length;
          const isRestDay = loadedStats.studyMode === 'Rest';
          const isCleared = isRestDay || (total > 0 && completed === total);
          const isPartial = !isRestDay && completed > 0 && !isCleared;
          const status: DailyMissionRecord['status'] = isRestDay ? 'Target Cleared' : isCleared ? 'Target Cleared' : isPartial ? 'Partially Met' : 'Goals Not Met';
          const archiveRecord: DailyMissionRecord = {
            date: prevDate,
            completedCount: isRestDay ? total : completed,
            totalCount: total,
            completedRate: isRestDay ? 100 : (total > 0 ? Math.round((completed / total) * 100) : 0),
            status,
            note: isRestDay ? 'Recovery Rest Day Completed (Objectives Excused)' : isCleared ? 'All daily objectives cleared' : isPartial ? 'Shift partially completed' : 'Daily objectives not met',
            missions: loadedMissions.map(m => ({ ...m })),
            archivedAt: new Date().toISOString()
          };
          const idx = loadedHistory.findIndex(r => r.date === prevDate);
          if (idx >= 0) loadedHistory[idx] = archiveRecord;
          else loadedHistory.unshift(archiveRecord);

          // Scientifically grounded allostatic adaptation model:
          // Long-term preparation is a marathon governed by allostasis and habit preservation.
          // Small daily variances apply gentle, realistic adjustments rather than demoralizing crashes.
          const yesterdaySleep = loadedStats.sleepLogs?.[prevDate] || 0;
          const sleepBonus = yesterdaySleep >= 7 ? 3 : yesterdaySleep > 0 && yesterdaySleep < 5 ? -3 : 0;
          const sleepBurnoutBonus = yesterdaySleep >= 7 ? -5 : yesterdaySleep > 0 && yesterdaySleep < 5 ? 4 : 0;

          if (isRestDay) {
            loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth + 8 + sleepBonus));
            loadedStats.burnoutIndex = Math.min(100, Math.max(0, loadedStats.burnoutIndex - 18 + sleepBurnoutBonus));
            loadedStats.shiftStreak = (loadedStats.shiftStreak || 0) + 1;
            loadedStats.studyMode = 'Normal';
          } else if (isCleared) {
            loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth + 6 + sleepBonus));
            loadedStats.burnoutIndex = Math.min(100, Math.max(0, loadedStats.burnoutIndex - 8 + sleepBurnoutBonus));
            loadedStats.shiftStreak = (loadedStats.shiftStreak || 0) + 1;
          } else if (isPartial) {
            // Partial completion acknowledges effort, keeping behavioral momentum alive
            loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth + 2 + sleepBonus));
            loadedStats.burnoutIndex = Math.min(100, Math.max(0, loadedStats.burnoutIndex - 2 + sleepBurnoutBonus));
            loadedStats.shiftStreak = Math.max(1, (loadedStats.shiftStreak || 0));
          } else {
            // Unmet shift: gentle allostatic strain (-3% health, +4% burnout)
            loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth - 3 + sleepBonus));
            loadedStats.burnoutIndex = Math.min(65, loadedStats.burnoutIndex + 4 + sleepBurnoutBonus);
            // 1-day grace buffer: step down by 1 rather than wiping out weeks of work
            loadedStats.shiftStreak = Math.max(0, (loadedStats.shiftStreak || 0) - 1);
          }
        }

        // 2. Generate archive records & gentle allostatic adjustment for intermediate days
        const intermediateMissedDates = getIntermediateISODates(prevDate, today);
        intermediateMissedDates.forEach(missedDate => {
          const existingIdx = loadedHistory.findIndex(r => r.date === missedDate);
          if (existingIdx === -1) {
            const dailyDefaults = DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily');
            const missedRecord: DailyMissionRecord = {
              date: missedDate,
              completedCount: 0,
              totalCount: dailyDefaults.length,
              completedRate: 0,
              status: 'Shift Missed',
              note: 'Shift Missed — Goals Not Met',
              missions: dailyDefaults.map(m => ({ ...m, current: 0, status: 'Pending' })),
              archivedAt: new Date().toISOString()
            };
            loadedHistory.push(missedRecord);
          }
          // Gentle allostatic calibration for missed days: -3% reserve and +3% burnout per missed day,
          // with a minimum floor of 35% so the user is never demoralized or trapped in panic.
          loadedStats.patientHealth = Math.max(35, loadedStats.patientHealth - 3);
          loadedStats.burnoutIndex = Math.min(65, loadedStats.burnoutIndex + 3);
          loadedStats.shiftStreak = Math.max(0, (loadedStats.shiftStreak || 0) - 1);
          if (!loadedStats.activityLogs) loadedStats.activityLogs = {};
          if (loadedStats.activityLogs[missedDate] === undefined) {
            loadedStats.activityLogs[missedDate] = 0;
          }
        });

        loadedHistory.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem("patient_zero_v2_mission_history", JSON.stringify(loadedHistory));
      }

      loadedMissions = loadedMissions.map(m => {
        const period = m.period || 'daily';
        const shouldReset = (isNewDay && period === 'daily') || (isNewWeek && period === 'weekly');
        if (shouldReset) {
          return { ...m, current: 0, status: 'Pending' };
        }
        return m;
      });
      localStorage.setItem("patient_zero_v2_missions", JSON.stringify(loadedMissions));

      loadedStats.lastMissionResetDate = today;
      if (isNewWeek) {
        loadedStats.currentWeekStart = currentMondayStr;
        loadedStats.dutyDaysUsed = 0;
        loadedStats.restDaysUsed = 0;
      }
      localStorage.setItem("patient_zero_v2_stats", JSON.stringify(loadedStats));
    }

    // Ensure firstActiveDate is permanently established so "system active" is never stuck on 1 day
    if (!loadedStats.firstActiveDate) {
      const candidates = [
        ...(loadedStats.createdAt ? [loadedStats.createdAt.slice(0, 10)] : []),
        ...Object.keys(loadedStats.activityLogs || {}),
        ...loadedHistory.map(h => h.date),
        today
      ].filter(Boolean).sort();
      loadedStats.firstActiveDate = (candidates[0] && candidates[0] !== today) ? candidates[0] : "2026-10-07";
      loadedStats.createdAt = loadedStats.createdAt || new Date(loadedStats.firstActiveDate).toISOString();
      localStorage.setItem("patient_zero_v2_stats", JSON.stringify(loadedStats));
    }

    setStats(loadedStats);
    setMissions(loadedMissions);
    setMissionHistory(loadedHistory);
    setStatsLoaded(true);
  }, [authUser]);


  useEffect(() => {
    if (!authUser) return;
    
    // Stats fetch
    const statsUnsub = onSnapshot(doc(db, "users", authUser.uid), (docSnap) => {
        if (docSnap.exists()) {
             const loadedStats = { ...DEFAULT_STATS, ...docSnap.data() } as UserStats;
             loadedStats.daysToExam = calculateDaysToExam(loadedStats.targetExamDate);
             const today = getTodayISO();
             const currentMondayStr = getCurrentMondayISO();
             
             const isNewWeek = loadedStats.currentWeekStart !== currentMondayStr;
             const isNewDay = loadedStats.lastMissionResetDate !== today;

             let needsUpdate = false;
             const updates: any = {};

             if (!loadedStats.firstActiveDate) {
                 const firstDate = loadedStats.createdAt ? loadedStats.createdAt.slice(0, 10) : "2026-10-07";
                 loadedStats.firstActiveDate = firstDate;
                 updates.firstActiveDate = firstDate;
                 needsUpdate = true;
             }

             if (isNewDay) {
                 loadedStats.lastMissionResetDate = today;
                 updates.lastMissionResetDate = today;
                 needsUpdate = true;
             }
             
             if (isNewWeek) {
                 loadedStats.currentWeekStart = currentMondayStr;
                 loadedStats.dutyDaysUsed = 0;
                 loadedStats.restDaysUsed = 0;
                 updates.currentWeekStart = currentMondayStr;
                 updates.dutyDaysUsed = 0;
                 updates.restDaysUsed = 0;
                 needsUpdate = true;
             }

             if (needsUpdate && !docSnap.metadata.fromCache) {
                 import("firebase/firestore").then(({ updateDoc, getDocs, collection, setDoc, doc: fDoc }) => {
                     getDocs(collection(db, "users", authUser.uid, "missions")).then(msnap => {
                         const prevMissions = msnap.docs.map(d => d.data() as Mission);
                         const prevDate = docSnap.data().lastMissionResetDate;
                         if (isNewDay && prevDate && prevDate !== today) {
                             if (prevMissions.length > 0) {
                                 const dailyOnly = prevMissions.filter(m => (m.period || 'daily') === 'daily');
                                 const completed = dailyOnly.filter(m => m.status === 'Completed').length;
                                 const total = dailyOnly.length;
                                 const isCleared = total > 0 && completed === total;
                                 const isPartial = completed > 0 && !isCleared;
                                 const status: DailyMissionRecord['status'] = isCleared ? 'Target Cleared' : isPartial ? 'Partially Met' : 'Goals Not Met';
                                 const archiveRecord: DailyMissionRecord = {
                                     date: prevDate,
                                     completedCount: completed,
                                     totalCount: total,
                                     completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                                     status,
                                     note: isCleared ? 'All daily objectives cleared' : isPartial ? 'Shift partially completed' : 'Daily objectives not met',
                                     missions: prevMissions.map(m => ({
                                         id: m.id,
                                         title: m.title,
                                         category: m.category,
                                         target: m.target,
                                         current: m.current,
                                         unit: m.unit,
                                         status: m.status,
                                         period: m.period || 'daily'
                                     })),
                                     archivedAt: new Date().toISOString()
                                 };
                                 setDoc(fDoc(db, "users", authUser.uid, "mission_history", prevDate), archiveRecord).catch(console.error);

                                 if (isCleared) {
                                     loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth + 6));
                                     loadedStats.burnoutIndex = Math.max(0, loadedStats.burnoutIndex - 8);
                                     loadedStats.shiftStreak = (loadedStats.shiftStreak || 0) + 1;
                                 } else if (isPartial) {
                                     loadedStats.patientHealth = Math.min(100, Math.max(35, loadedStats.patientHealth + 2));
                                     loadedStats.burnoutIndex = Math.max(0, loadedStats.burnoutIndex - 2);
                                     loadedStats.shiftStreak = Math.max(1, (loadedStats.shiftStreak || 0));
                                 } else {
                                     loadedStats.patientHealth = Math.max(35, loadedStats.patientHealth - 3);
                                     loadedStats.burnoutIndex = Math.min(65, loadedStats.burnoutIndex + 4);
                                     loadedStats.shiftStreak = Math.max(0, (loadedStats.shiftStreak || 0) - 1);
                                 }
                             }

                             // Backfill any intermediate days when app was not opened
                             const intermediateMissed = getIntermediateISODates(prevDate, today);
                             intermediateMissed.forEach(missedDate => {
                                 const dailyDefaults = DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily');
                                 const missedRecord: DailyMissionRecord = {
                                     date: missedDate,
                                     completedCount: 0,
                                     totalCount: dailyDefaults.length,
                                     completedRate: 0,
                                     status: 'Shift Missed',
                                     note: 'Shift Missed — Goals Not Met',
                                     missions: dailyDefaults.map(m => ({ ...m, current: 0, status: 'Pending' })),
                                     archivedAt: new Date().toISOString()
                                 };
                                 setDoc(fDoc(db, "users", authUser.uid, "mission_history", missedDate), missedRecord).catch(console.error);
                                 
                                 loadedStats.patientHealth = Math.max(35, loadedStats.patientHealth - 3);
                                 loadedStats.burnoutIndex = Math.min(65, loadedStats.burnoutIndex + 3);
                                 loadedStats.shiftStreak = Math.max(0, (loadedStats.shiftStreak || 0) - 1);
                             });

                             updates.patientHealth = loadedStats.patientHealth;
                             updates.burnoutIndex = loadedStats.burnoutIndex;
                             updates.shiftStreak = loadedStats.shiftStreak;
                         }

                         updateDoc(fDoc(db, "users", authUser.uid), updates).catch(console.error);

                         msnap.docs.forEach(mdoc => {
                             const mData = mdoc.data() as Mission;
                             const period = mData.period || 'daily';
                             // If it's a new day, we reset daily missions.
                             // If it's a new week, we reset weekly missions.
                             const shouldReset = (isNewDay && period === 'daily') || (isNewWeek && period === 'weekly');
                             
                             if (shouldReset && (mData.current > 0 || mData.status !== "Pending")) {
                                 setDoc(fDoc(db, "users", authUser.uid, "missions", mData.id), { ...mData, current: 0, status: "Pending" });
                             }
                         });
                     }).catch(console.error);
                 });
             }
             
             setStats(loadedStats);
             setStatsLoaded(true);
        } else {
             // init
             setDoc(doc(db, "users", authUser.uid), DEFAULT_STATS).then(() => setStatsLoaded(true)).catch(e => handleFirestoreError(e, OperationType.CREATE, "users"));
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
        }).sort((a,b) => b.id.localeCompare(a.id)));
    }, (e) => handleFirestoreError(e, OperationType.GET, "logs"));

    const moodsUnsub = onSnapshot(collection(db, "users", authUser.uid, "moods"), (snapshot) => {
        setMoodLogs(snapshot.docs.map(d => d.data() as MoodLog).sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
    }, (e) => handleFirestoreError(e, OperationType.GET, "moods"));

    const historyUnsub = onSnapshot(collection(db, "users", authUser.uid, "mission_history"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as DailyMissionRecord);
        list.sort((a,b) => b.date.localeCompare(a.date));
        setMissionHistory(list);
    }, (e) => handleFirestoreError(e, OperationType.GET, "mission_history"));

    return () => {
       statsUnsub();
       missionsUnsub();
       logsUnsub();
       moodsUnsub();
       historyUnsub();
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
    if (currentUser && !isDevSandboxMode) {
      setDoc(doc(db, "users", currentUser.uid), newStats).catch(e => handleFirestoreError(e, OperationType.UPDATE, "users"));
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_stats" : "patient_zero_v2_stats";
      localStorage.setItem(storageKey, JSON.stringify(newStats));
    }
  };

  const modifyStats = (modifier: (prev: UserStats) => UserStats) => {
     setStats(prev => {
         const mergedPrev = { ...DEFAULT_STATS, ...(prev || {}) };
         const next = modifier(mergedPrev);
         const currentUser = auth.currentUser;
         if (currentUser && !isDevSandboxMode) {
            if (statsLoadedRef.current) {
               setDoc(doc(db, "users", currentUser.uid), next, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, "users"));
            }
         } else {
            const storageKey = isDevSandboxMode ? "patient_zero_sandbox_stats" : "patient_zero_v2_stats";
            localStorage.setItem(storageKey, JSON.stringify(next));
         }
         return next;
     });
  };

  const logActivity = (prev: UserStats, options: { mcqs?: number, videos?: number, cases?: number } = {}) => {
    const today = getTodayISO();
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

  const syncMissionHistoryToday = (currentMissions: Mission[]) => {
    const today = getTodayISO();
    const dailyOnly = currentMissions.filter(m => (m.period || 'daily') === 'daily');
    const completed = dailyOnly.filter(m => m.status === 'Completed').length;
    const total = dailyOnly.length;
    const todayRecord: DailyMissionRecord = {
      date: today,
      completedCount: completed,
      totalCount: total,
      completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      missions: currentMissions.map(m => ({
        id: m.id,
        title: m.title,
        category: m.category,
        target: m.target,
        current: m.current,
        unit: m.unit,
        status: m.status,
        period: m.period || 'daily'
      })),
      archivedAt: new Date().toISOString()
    };

    setMissionHistory(prev => {
      const idx = prev.findIndex(r => r.date === today);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = todayRecord;
      } else {
        updated = [todayRecord, ...prev];
      }
      return updated;
    });

    if (authUser && !isDevSandboxMode) {
      setDoc(doc(db, "users", authUser.uid, "mission_history", today), todayRecord, { merge: true }).catch(console.error);
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_mission_history" : "patient_zero_v2_mission_history";
      const existingStr = localStorage.getItem(storageKey);
      let list: DailyMissionRecord[] = [];
      if (existingStr) {
        try { list = JSON.parse(existingStr); } catch (e) {}
      }
      const idx = list.findIndex(r => r.date === today);
      if (idx >= 0) list[idx] = todayRecord;
      else list.unshift(todayRecord);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  };

  const updateMissions = (newMissions: Mission[]) => {
    setMissions(newMissions);
    syncMissionHistoryToday(newMissions);
    if (authUser && !isDevSandboxMode) {
      newMissions.forEach(m => {
        const oldM = missions.find(om => om.id === m.id);
        if (!oldM || JSON.stringify(oldM) !== JSON.stringify(m)) {
          setDoc(doc(db, "users", authUser.uid, "missions", m.id), m).catch(e => handleFirestoreError(e, OperationType.UPDATE, "missions"));
        }
      });
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_missions" : "patient_zero_v2_missions";
      localStorage.setItem(storageKey, JSON.stringify(newMissions));
    }
  };

  const updateLogs = (newLogs: EmergencyLog[]) => {
    setLogs(newLogs);
    if (authUser && !isDevSandboxMode) {
      newLogs.forEach(l => {
        const oldL = logs.find(ol => ol.id === l.id);
        if (!oldL) {
          setDoc(doc(db, "users", authUser.uid, "logs", l.id), l).catch(e => handleFirestoreError(e, OperationType.UPDATE, "logs"));
        }
      });
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_logs" : "patient_zero_v2_logs";
      localStorage.setItem(storageKey, JSON.stringify(newLogs));
    }
  };

  const updateMoodLogs = (newLogs: MoodLog[]) => {
    setMoodLogs(newLogs);
    if (authUser && !isDevSandboxMode) {
      newLogs.forEach((l) => {
        const oldL = moodLogs.find(ol => ol.timestamp === l.timestamp);
        if (!oldL) {
          setDoc(doc(db, "users", authUser.uid, "moods", `mood-${l.timestamp.replace(/[:\/ ]/g, '-')}`), l).catch(e => handleFirestoreError(e, OperationType.UPDATE, "moods"));
        }
      });
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_mood" : "patient_zero_v2_mood";
      localStorage.setItem(storageKey, JSON.stringify(newLogs));
    }
  };

  // Performance-Driven Engine: parameters adjust strictly based on clinical triage outcomes,
  // daily/weekly objectives met/missed, and actual shift compliance, NOT passive app screen time.
  const getInitialLastActive = (): number => {
    const saved = localStorage.getItem("patient_zero_last_active");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return Date.now();
  };

  const lastActiveRef = useRef<number>(getInitialLastActive());

  const handleSessionActivityCheck = () => {
    const now = Date.now();
    const today = getTodayISO();
    lastActiveRef.current = now;
    localStorage.setItem("patient_zero_last_active", now.toString());

    // Check if calendar day rolled over while session was open or tab was refocused
    if (statsLoaded && stats.lastMissionResetDate && stats.lastMissionResetDate !== today) {
      const prevDate = stats.lastMissionResetDate;
      const dailyOnly = missions.filter(m => (m.period || 'daily') === 'daily');
      const completed = dailyOnly.filter(m => m.status === 'Completed').length;
      const total = dailyOnly.length;
      const isCleared = total > 0 && completed === total;
      const isPartial = completed > 0 && !isCleared;
      const status: DailyMissionRecord['status'] = isCleared ? 'Target Cleared' : isPartial ? 'Partially Met' : 'Goals Not Met';

      const prevArchive: DailyMissionRecord = {
        date: prevDate,
        completedCount: completed,
        totalCount: total,
        completedRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        status,
        note: isCleared ? 'All daily objectives cleared' : isPartial ? 'Shift partially completed' : 'Daily objectives not met',
        missions: missions.map(m => ({ ...m })),
        archivedAt: new Date().toISOString()
      };

      // Missed days between prevDate and today
      const missedDates = getIntermediateISODates(prevDate, today);
      const newHistoryRecords: DailyMissionRecord[] = [prevArchive];
      let missedDaysPenalty = 0;

      missedDates.forEach(missedDate => {
        const defaultDaily = DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily');
        newHistoryRecords.push({
          date: missedDate,
          completedCount: 0,
          totalCount: defaultDaily.length,
          completedRate: 0,
          status: 'Shift Missed',
          note: 'Shift Missed — Goals Not Met',
          missions: defaultDaily.map(m => ({ ...m, current: 0, status: 'Pending' })),
          archivedAt: new Date().toISOString()
        });
        missedDaysPenalty += 4;
      });

      // Update history
      setMissionHistory(prev => {
        const updated = [...prev];
        newHistoryRecords.forEach(rec => {
          const idx = updated.findIndex(r => r.date === rec.date);
          if (idx >= 0) updated[idx] = rec;
          else updated.push(rec);
        });
        updated.sort((a, b) => b.date.localeCompare(a.date));
        return updated;
      });

      // Reset today's daily missions
      const resetMissions = missions.map(m => (m.period || 'daily') === 'daily' ? { ...m, current: 0, status: 'Pending' as const } : m);
      setMissions(resetMissions);

      // Evaluate health and burnout based on goals met / missed
      modifyStats(prev => {
        let newHealth = prev.patientHealth;
        let newBurnout = prev.burnoutIndex;
        let newStreak = prev.shiftStreak;

        if (isCleared) {
          newHealth = Math.min(100, Math.max(35, newHealth + 6));
          newBurnout = Math.max(0, newBurnout - 8);
          newStreak += 1;
        } else if (isPartial) {
          newHealth = Math.min(100, Math.max(35, newHealth + 2));
          newBurnout = Math.max(0, newBurnout - 2);
          newStreak = Math.max(1, newStreak);
        } else {
          newHealth = Math.max(35, newHealth - 3);
          newBurnout = Math.min(65, newBurnout + 4);
          newStreak = Math.max(0, newStreak - 1);
        }

        if (missedDaysPenalty > 0) {
          newHealth = Math.max(35, newHealth - Math.min(8, missedDaysPenalty));
          newBurnout = Math.min(65, newBurnout + Math.min(8, missedDaysPenalty));
          newStreak = Math.max(0, newStreak - Math.round(missedDaysPenalty / 4));
        }

        return {
          ...prev,
          patientHealth: newHealth,
          burnoutIndex: newBurnout,
          shiftStreak: newStreak,
          lastMissionResetDate: today,
          lastActiveTimestamp: now
        };
      });

      if (!isCleared) {
        showNotification("Daily Shift Concluded: Pace Calibrated (-3%)");
      } else {
        showNotification("Daily Shift Cleared: Objectives Met (+6% Vitals)");
      }
    }
  };

  useEffect(() => {
    // 1. Check session activity and day continuity on mount
    handleSessionActivityCheck();

    // 2. Tab focus & visibility change handlers
    const handleVisibilityOrFocus = () => {
      handleSessionActivityCheck();
      if (document.visibilityState === "hidden") {
        const now = Date.now();
        lastActiveRef.current = now;
        localStorage.setItem("patient_zero_last_active", now.toString());
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("blur", () => {
      const now = Date.now();
      lastActiveRef.current = now;
      localStorage.setItem("patient_zero_last_active", now.toString());
    });
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("beforeunload", () => {
      const now = Date.now();
      localStorage.setItem("patient_zero_last_active", now.toString());
    });

    // 3. User interaction listener (throttled): updates active timestamp
    let lastThrottledUpdate = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottledUpdate > 15000) {
        lastThrottledUpdate = now;
        lastActiveRef.current = now;
        localStorage.setItem("patient_zero_last_active", now.toString());
      }
    };

    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    // 4. Active interval timer (every 60s)
    const activeInterval = setInterval(() => {
      handleSessionActivityCheck();
    }, 60000);

    return () => {
      clearInterval(activeInterval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [statsLoaded, stats.lastMissionResetDate]);

  const getSimulatedVitals = (): PatientVitals => {
    const safeStats = stats || DEFAULT_STATS;
    const today = getTodayISO();
    const todaySleep = safeStats.sleepLogs?.[today] || 0;
    
    // Scientifically grounded ambulatory resting physiology:
    // Adult human resting HR: 64-84 bpm. Cognitive workload and mild sleep deficit
    // subtly elevate resting autonomic sympathetic tone (subtle +3 to +6 bpm), never acute arrhythmia.
    const sleepAdjustment = todaySleep >= 7 ? -2 : todaySleep > 0 && todaySleep < 6 ? 3 : 0;
    const restModeAdjustment = safeStats.studyMode === 'Rest' ? -4 : safeStats.studyMode === 'Duty' ? 3 : 0;
    
    // Biocompatibility resilience modulation
    const latestMood = moodLogs.length > 0 ? moodLogs[0] : null;
    const moodHRAdjustment = latestMood ? (3 - latestMood.ratingValue) * 1.5 : 0;
    const procrastinationHR = (latestMood && latestMood.procrastinationTrigger) ? 2 : 0;

    const baseHR = 70 + sleepAdjustment + restModeAdjustment + moodHRAdjustment + procrastinationHR;
    const allostaticAddition = Math.min(10, Math.floor((safeStats.burnoutIndex || 0) * 0.1));
    const finalHR = Math.min(88, Math.max(64, Math.round(baseHR + allostaticAddition)));

    // Oxygenation: Always healthy normal room-air pulse oximetry (97% - 99%)
    const sleepO2Bonus = todaySleep >= 7 ? 1 : 0;
    const finalSPO2 = Math.min(99, Math.max(97, 98 + sleepO2Bonus));

    // Blood pressure: Normotensive resting range (116/74 to 126/80 mmHg). Never hypotensive shock.
    const stressSys = Math.min(10, Math.floor((safeStats.burnoutIndex || 0) * 0.1));
    const stressDias = Math.min(6, Math.floor((safeStats.burnoutIndex || 0) * 0.06));
    const finalBP = `${118 + stressSys}/${76 + stressDias}`;

    // Core temperature: standard human normothermia (98.4°F - 98.7°F)
    const finalTemp = 98.4 + parseFloat((Math.min(0.3, (safeStats.burnoutIndex || 0) * 0.003)).toFixed(1));
    return { hr: finalHR, bp: finalBP, spo2: finalSPO2, temp: finalTemp };
  };

  const currentVitals = getSimulatedVitals();
  const isRestorativeBuffer = (stats || DEFAULT_STATS).patientHealth < 40;

  const triggerManualStabilize = (type: 'QuickMCQ' | 'FullStudy' | 'QuickBreak', subjects: string[] = []) => {
    modifyStats((prev) => {
      let hpReward = 15; let xpReward = 50;
      if (type === 'FullStudy') { hpReward = 35; xpReward = 150; }
      else if (type === 'QuickBreak') { hpReward = 10; xpReward = 10; }
      const rawHealth = prev.patientHealth + hpReward;
      const rawBurnout = prev.burnoutIndex - (type === 'QuickBreak' ? 30 : 10);
      
      let nextBase = { ...prev, patientHealth: Math.min(100, rawHealth), burnoutIndex: Math.max(1, rawBurnout), xp: (prev.xp || 0) + xpReward };
      const dateStr = getTodayISO();
      
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
        const dailyPer = { ...(nextBase.subjectPerformanceDaily || {}) };
        if (!dailyPer[dateStr]) dailyPer[dateStr] = {};

        const qty = type === 'QuickMCQ' ? 10 : 1;
        subjects.forEach(sub => {
          if (sub !== 'All') {
            subPer[sub] = subPer[sub] || { total: 0, correct: 0 };
            const correctQty = type === 'QuickMCQ' ? Math.floor(qty * 0.7) : qty;
            subPer[sub].total += qty;
            subPer[sub].correct += correctQty;

            if (!dailyPer[dateStr][sub]) dailyPer[dateStr][sub] = { total: 0, correct: 0 };
            dailyPer[dateStr][sub].total += qty;
            dailyPer[dateStr][sub].correct += correctQty;
          }
        });
        nextBase.subjectPerformance = subPer;
        nextBase.subjectPerformanceDaily = dailyPer;
      }
      
      const next = logActivity(nextBase);
      return next;
    });

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
    const dateStr = getTodayISO();
    modifyStats((prev) => {
      let burnoutRedux = sleepHours * 10;
      let hpReward = sleepHours * 4;
      const rawHealth = prev.patientHealth + hpReward;
      const rawBurnout = prev.burnoutIndex - burnoutRedux;
      const nextSleepLogs = { ...prev.sleepLogs };
      nextSleepLogs[dateStr] = (nextSleepLogs[dateStr] || 0) + sleepHours;
      return logActivity({ ...prev, patientHealth: Math.min(100, rawHealth), burnoutIndex: Math.max(1, rawBurnout), sleepLogs: nextSleepLogs });
    });
    sound.stabilizationChime();
    setSleepHours(8);
    setShowSleepModal(false);
  };

  const handleMoodSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formattedTimestamp = formatDateTimeDMY(new Date());
    const isProcrastinating = Boolean(moodTrigger.trim());

    // Scientifically grounded allostatic support:
    // Acknowledging fatigue is metacognitive self-regulation (Yerkes-Dodson, Polivy & Herman).
    // The system supports the student rather than panic-punishing them.
    let hpDelta = 0;
    let burnoutDelta = 0;

    switch (moodRating) {
      case 1:
        // Exhausted: Preserve baseline health, relieve allostatic pressure, activate protective pacing
        hpDelta = 0;
        burnoutDelta = -6;
        break;
      case 2:
        // Fatigued: Gentle replenishment
        hpDelta = +1;
        burnoutDelta = -4;
        break;
      case 3:
        // Baseline equilibrium
        hpDelta = +3;
        burnoutDelta = -6;
        break;
      case 4:
        // High focus
        hpDelta = +5;
        burnoutDelta = -10;
        break;
      case 5:
        // Radiant flow
        hpDelta = +7;
        burnoutDelta = -15;
        break;
      default:
        hpDelta = 0;
        burnoutDelta = 0;
    }

    // Procrastination trigger: compassionate observation without punitive panic
    if (isProcrastinating) {
      burnoutDelta += 2;
    }

    const newLog: MoodLog = {
      timestamp: formattedTimestamp,
      ratingValue: moodRating,
      burnoutObserved: stats.burnoutIndex > 60 || moodRating <= 2,
      procrastinationTrigger: moodTrigger.trim()
    };
    const copyLogs = [newLog, ...moodLogs];
    updateMoodLogs(copyLogs);

    modifyStats((prev) => {
      const finalHealth = Math.min(100, Math.max(35, prev.patientHealth + hpDelta));
      const finalBurnout = Math.min(100, Math.max(0, prev.burnoutIndex + burnoutDelta));
      return {
        ...prev,
        patientHealth: finalHealth,
        burnoutIndex: finalBurnout
      };
    });

    sound.click();
    setMoodTrigger("");
  };

  const handleSimulateSlip = (reason: string) => {
    sound.click();
    modifyStats((prev) => {
      const finalHealth = Math.max(35, prev.patientHealth - 2);
      const finalBurnout = Math.min(65, prev.burnoutIndex + 2);
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
      stabilizeValue: category === "Tests" ? 40 : 15, 
      status: "Pending",
      period: period || (category === "Tests" ? "weekly" : "daily")
    };
    updateMissions([freshM, ...missions]);
  };

  // Ensure today's triage and daily missions remain uncompleted if not actually completed by the user today
  useEffect(() => {
    if (!statsLoaded) return;
    const today = getTodayISO();
    const hasTriageToday = logs.some(l => l.date === today);
    const triageM = missions.find(m => m.id === "m-04-triage");
    
    // If triage mission or today's triage cases logs were marked completed despite 0 actual cases played today:
    if (!hasTriageToday && (triageM?.status === "Completed" || (stats.triageCasesLogs?.[today] || 0) > 0)) {
      const resetMissions = missions.map(m => (m.id === "m-04-triage" ? { ...m, current: 0, status: "Pending" as const } : m));
      setMissions(resetMissions);
      modifyStats(prev => {
        const copyTriage = { ...(prev.triageCasesLogs || {}) };
        delete copyTriage[today];
        return {
          ...prev,
          lastMissionResetDate: today,
          triageCasesLogs: copyTriage
        };
      });
      setMissionHistory(prev => prev.map(rec => {
        if (rec.date === today && rec.completedCount > 0 && !hasTriageToday && (stats.mcqLogs?.[today] || 0) === 0) {
          return {
            ...rec,
            completedCount: 0,
            completedRate: 0,
            status: 'Pending',
            note: 'Current Shift in Progress',
            missions: rec.missions.map(m => (m.id === 'm-04-triage' ? { ...m, current: 0, status: 'Pending' as const } : m))
          };
        }
        return rec;
      }));

      if (authUser && !isDevSandboxMode) {
        import("firebase/firestore").then(({ setDoc, doc: fDoc }) => {
          setDoc(fDoc(db, "users", authUser.uid, "missions", "m-04-triage"), {
            id: "m-04-triage",
            title: "Daily Triage Completion",
            category: "Triage",
            target: 1,
            current: 0,
            unit: "Session",
            xpReward: 300,
            stabilizeValue: 50,
            status: "Pending",
            period: "daily"
          }, { merge: true }).catch(console.error);
        });
      }
    }
  }, [statsLoaded, logs, authUser]);

  const handleLogPastShift = (date: string, mcqs: number, modules: number, sleep: number, note?: string) => {
    sound.click();
    // 1. Update stats with the retrospective logs
    modifyStats(prev => {
      const nextActivityLogs = { ...(prev.activityLogs || {}) };
      nextActivityLogs[date] = Math.max(1, (nextActivityLogs[date] || 0), (mcqs > 0 || modules > 0) ? 1 : 0);

      const nextMcqLogs = { ...(prev.mcqLogs || {}) };
      nextMcqLogs[date] = mcqs;

      const nextVideoLogs = { ...(prev.videoLogs || {}) };
      nextVideoLogs[date] = modules;

      const nextSleepLogs = { ...(prev.sleepLogs || {}) };
      nextSleepLogs[date] = sleep;

      const activeDaysCount = Object.keys(nextActivityLogs).filter(k => (nextActivityLogs[k] || 0) > 0 || (nextMcqLogs[k] || 0) > 0).length;

      // Adjust health & burnout positively if shift was completed
      const wasCleared = mcqs >= 50 && modules >= 4;
      const newHealth = wasCleared ? Math.min(100, Math.max(prev.patientHealth, prev.patientHealth + 6)) : prev.patientHealth;
      const newBurnout = wasCleared ? Math.max(0, prev.burnoutIndex - 6) : prev.burnoutIndex;

      return {
        ...prev,
        activityLogs: nextActivityLogs,
        mcqLogs: nextMcqLogs,
        videoLogs: nextVideoLogs,
        sleepLogs: nextSleepLogs,
        patientHealth: newHealth,
        burnoutIndex: newBurnout,
        shiftStreak: Math.max(prev.shiftStreak || 0, activeDaysCount)
      };
    });

    // 2. Build DailyMissionRecord for that date
    const isCleared = mcqs >= 50 && modules >= 4;
    const isPartial = !isCleared && (mcqs > 0 || modules > 0 || sleep >= 6);
    const completedCount = isCleared ? 4 : isPartial ? 2 : 0;
    const completedRate = isCleared ? 100 : isPartial ? 50 : 0;
    const status: DailyMissionRecord['status'] = isCleared ? 'Target Cleared' : isPartial ? 'Partially Met' : 'Goals Not Met';

    const retroRecord: DailyMissionRecord = {
      date,
      completedCount,
      totalCount: 4,
      completedRate,
      status,
      note: note?.trim() || (isCleared ? `Shift Cleared: Retrospective Protocol on ${formatDateDMY(date)}` : isPartial ? `Shift Partially Met: ${mcqs} MCQs, ${modules}h Modules` : `Shift Logged on ${formatDateDMY(date)}`),
      missions: [
        { id: "m-04-triage", title: "Daily Triage Completion", category: "Triage", target: 1, current: isCleared ? 1 : 0, unit: "Session", status: isCleared ? "Completed" : "Pending", period: "daily" },
        { id: "m-01-mcqs", title: "Complete daily Marrow MCQs", category: "MCQ", target: 50, current: mcqs, unit: "Questions", status: mcqs >= 50 ? "Completed" : "Pending", period: "daily" },
        { id: "m-02-lectures", title: "Watch Marrow video modules", category: "Lectures", target: 4, current: modules, unit: "Hours", status: modules >= 4 ? "Completed" : "Pending", period: "daily" },
        { id: "m-05-review", title: "1 Hour Review Session", category: "Revision", target: 1, current: isCleared ? 1 : 0, unit: "Hour", status: isCleared ? "Completed" : "Pending", period: "daily" }
      ],
      archivedAt: new Date().toISOString()
    };

    setMissionHistory(prev => {
      const idx = prev.findIndex(r => r.date === date);
      let updated: DailyMissionRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = retroRecord;
      } else {
        updated = [retroRecord, ...prev];
      }
      updated.sort((a, b) => b.date.localeCompare(a.date));
      return updated;
    });

    // Persist to Firestore or localStorage
    if (authUser && !isDevSandboxMode) {
      setDoc(doc(db, "users", authUser.uid, "mission_history", date), retroRecord, { merge: true }).catch(console.error);
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_mission_history" : "patient_zero_v2_mission_history";
      const existingStr = localStorage.getItem(storageKey);
      let list: DailyMissionRecord[] = [];
      if (existingStr) {
        try { list = JSON.parse(existingStr); } catch (e) {}
      }
      const idx = list.findIndex(r => r.date === date);
      if (idx >= 0) list[idx] = retroRecord;
      else list.unshift(retroRecord);
      list.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(storageKey, JSON.stringify(list));
    }

    showNotification(`✓ Shift logged for ${formatDateDMY(date)} (${mcqs} MCQs, ${modules}h modules, ${sleep}h sleep)`);
  };

  const handleDeleteArchivedShift = (date: string) => {
    sound.click();
    if (!confirm(`Delete archived shift for ${formatDateDMY(date)}?`)) return;
    setMissionHistory(prev => prev.filter(r => r.date !== date));
    if (authUser && !isDevSandboxMode) {
      deleteDoc(doc(db, "users", authUser.uid, "mission_history", date)).catch(console.error);
    } else {
      const storageKey = isDevSandboxMode ? "patient_zero_sandbox_mission_history" : "patient_zero_v2_mission_history";
      const existingStr = localStorage.getItem(storageKey);
      if (existingStr) {
        try {
          const list: DailyMissionRecord[] = JSON.parse(existingStr);
          localStorage.setItem(storageKey, JSON.stringify(list.filter(r => r.date !== date)));
        } catch (e) {}
      }
    }
    showNotification(`Archived shift for ${formatDateDMY(date)} removed.`);
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
      const next = logActivity({ ...prev, xp: nextXp, patientHealth: Math.min(100, prev.patientHealth + item.stabilizeValue), burnoutIndex: Math.max(4, prev.burnoutIndex - 8) });
      
      return next;
    });
    sound.stabilizationChime();
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
      const next = { ...prev, targetExamDate: dateStr, daysToExam: calculateDaysToExam(dateStr) };
      return next;
    });
  };

  const handleUpdateInitiatedDate = (dateStr: string) => {
    modifyStats((prev) => {
      const next = { ...prev, firstActiveDate: dateStr };
      return next;
    });
    showNotification(`Simulation start date updated to ${formatDateDMY(dateStr)}.`);
  };

  const handleSaveCustomActivity = (
    customMap?: Record<string, { mcqs: number; actions: number; hours: number }>,
    forceCloudSync: boolean = false
  ) => {
    const today = getTodayISO();
    
    const day07 = customMap?.["2026-10-07"] || { mcqs: 45, actions: 8, hours: 7.5 };
    const day08 = customMap?.["2026-10-08"] || { mcqs: 50, actions: 7, hours: 7.0 };
    const day09 = customMap?.["2026-10-09"] || { mcqs: 60, actions: 9, hours: 8.0 };
    const day10 = customMap?.["2026-10-10"] || { mcqs: 35, actions: 6, hours: 7.0 };

    // Historical shifts from 07/10/2026 through today
    const restoredHistory: DailyMissionRecord[] = [
      {
        date: "2026-10-07",
        completedCount: 4,
        totalCount: 4,
        completedRate: 100,
        status: "Target Cleared",
        note: "Shift Cleared: Clinical Induction & Emergency Triage Foundation",
        missions: DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily').map(m => ({ ...m, current: m.target, status: 'Completed' as const })),
        archivedAt: "2026-10-07T21:00:00.000Z"
      },
      {
        date: "2026-10-08",
        completedCount: 4,
        totalCount: 4,
        completedRate: 100,
        status: "Target Cleared",
        note: "Shift Cleared: ICU Pharmacology & High-Yield Rounds",
        missions: DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily').map(m => ({ ...m, current: m.target, status: 'Completed' as const })),
        archivedAt: "2026-10-08T21:00:00.000Z"
      },
      {
        date: "2026-10-09",
        completedCount: 4,
        totalCount: 4,
        completedRate: 100,
        status: "Target Cleared",
        note: "Shift Cleared: Differential Diagnostics & Pathophysiology Protocol",
        missions: DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily').map(m => ({ ...m, current: m.target, status: 'Completed' as const })),
        archivedAt: "2026-10-09T21:00:00.000Z"
      },
      {
        date: "2026-10-10",
        completedCount: 4,
        totalCount: 4,
        completedRate: 100,
        status: "Target Cleared",
        note: "Active Shift: Full Daily Study Cadence Cleared",
        missions: DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily').map(m => ({ ...m, current: m.target, status: 'Completed' as const })),
        archivedAt: new Date().toISOString()
      }
    ];

    if (customMap) {
      Object.keys(customMap).forEach(dKey => {
        if (!restoredHistory.some(h => h.date === dKey)) {
          restoredHistory.push({
            date: dKey,
            completedCount: 4,
            totalCount: 4,
            completedRate: 100,
            status: "Target Cleared",
            note: `Shift Cleared: Clinical Operations on ${formatDateDMY(dKey)}`,
            missions: DEFAULT_MISSIONS.filter(m => (m.period || 'daily') === 'daily').map(m => ({ ...m, current: m.target, status: 'Completed' as const })),
            archivedAt: new Date().toISOString()
          });
        }
      });
      restoredHistory.sort((a, b) => b.date.localeCompare(a.date));
    }

    const restoredLogs: EmergencyLog[] = [
      {
        id: "log-1728288000000",
        patientName: "Marcus Vance",
        specialty: "Cardiology",
        result: "STABILIZED",
        vignette: "Acute Coronary Syndrome / Anterolateral STEMI presentation managed with emergency PCI.",
        userAnswer: "B",
        correctAnswer: "B",
        pearl: "Door-to-balloon time <90 minutes drastically reduces myocardial infarct size in anterior STEMI.",
        timestamp: "07/10/2026, 09:30 AM",
        date: "2026-10-07"
      },
      {
        id: "log-1728374400000",
        patientName: "Elena Rostova",
        specialty: "Internal Medicine",
        result: "STABILIZED",
        vignette: "Severe Diabetic Ketoacidosis with high anion gap metabolic acidosis successfully resuscitated.",
        userAnswer: "A",
        correctAnswer: "A",
        pearl: "Correct hypokalemia prior to or alongside IV insulin to avoid fatal cardiac arrhythmias.",
        timestamp: "08/10/2026, 11:15 AM",
        date: "2026-10-08"
      },
      {
        id: "log-1728460800000",
        patientName: "Devon Reed",
        specialty: "Emergency Medicine",
        result: "STABILIZED",
        vignette: "Tension Pneumothorax secondary to blunt thoracic trauma decompressed with needle thoracostomy.",
        userAnswer: "C",
        correctAnswer: "C",
        pearl: "Tension pneumothorax is a clinical diagnosis. Do not delay needle decompression for chest imaging.",
        timestamp: "09/10/2026, 02:45 PM",
        date: "2026-10-09"
      },
      {
        id: "log-1728547200000",
        patientName: "Sophia Lin",
        specialty: "Pharmacology & Toxicology",
        result: "STABILIZED",
        vignette: "Acute Acetaminophen toxicity managed with N-acetylcysteine within 8-hour Rumack-Matthew nomogram window.",
        userAnswer: "B",
        correctAnswer: "B",
        pearl: "N-acetylcysteine replenishes hepatic glutathione stores and prevents acute centrilobular necrosis.",
        timestamp: "10/10/2026, 10:15 AM",
        date: "2026-10-10"
      }
    ];

    modifyStats(prev => {
      const mergedActivityLogs = { ...(prev.activityLogs || {}) };
      const mergedMcqLogs = { ...(prev.mcqLogs || {}) };
      const mergedSleepLogs = { ...(prev.sleepLogs || {}) };

      if (customMap && Object.keys(customMap).length > 0) {
        Object.entries(customMap).forEach(([dateKey, val]) => {
          mergedActivityLogs[dateKey] = val.actions;
          mergedMcqLogs[dateKey] = val.mcqs;
          mergedSleepLogs[dateKey] = val.hours;
        });
      } else {
        mergedActivityLogs["2026-10-07"] = day07.actions;
        mergedActivityLogs["2026-10-08"] = day08.actions;
        mergedActivityLogs["2026-10-09"] = day09.actions;
        mergedActivityLogs["2026-10-10"] = day10.actions;

        mergedMcqLogs["2026-10-07"] = day07.mcqs;
        mergedMcqLogs["2026-10-08"] = day08.mcqs;
        mergedMcqLogs["2026-10-09"] = day09.mcqs;
        mergedMcqLogs["2026-10-10"] = day10.mcqs;

        mergedSleepLogs["2026-10-07"] = day07.hours;
        mergedSleepLogs["2026-10-08"] = day08.hours;
        mergedSleepLogs["2026-10-09"] = day09.hours;
        mergedSleepLogs["2026-10-10"] = day10.hours;
      }

      const activeDaysCount = Object.keys(mergedActivityLogs).filter(k => (mergedActivityLogs[k] || 0) > 0 || (mergedMcqLogs[k] || 0) > 0).length;

      const next: UserStats = {
        ...prev,
        studentName: prev.studentName || "B",
        firstActiveDate: "2026-10-07",
        createdAt: "2026-10-07T08:00:00.000Z",
        patientHealth: 100,
        burnoutIndex: 0,
        shiftStreak: Math.max(prev.shiftStreak || 0, activeDaysCount, 4),
        patientsSaved: Math.max(prev.patientsSaved, 14),
        xp: Math.max(prev.xp, 1600),
        activityLogs: mergedActivityLogs,
        mcqLogs: mergedMcqLogs,
        sleepLogs: mergedSleepLogs,
        triageCasesLogs: {
          ...(prev.triageCasesLogs || {}),
          "2026-10-07": 5,
          "2026-10-08": 5,
          "2026-10-09": 5,
          "2026-10-10": 4
        },
        lastMissionResetDate: today
      };

      const shouldWriteFirestore = authUser && (!isDevSandboxMode || forceCloudSync);
      if (shouldWriteFirestore && authUser) {
        import("firebase/firestore").then(({ setDoc, doc: fDoc }) => {
          setDoc(fDoc(db, "users", authUser.uid), next, { merge: true }).catch(console.error);
          restoredHistory.forEach(h => {
            setDoc(fDoc(db, "users", authUser.uid, "mission_history", h.date), h, { merge: true }).catch(console.error);
          });
          restoredLogs.forEach(l => {
            setDoc(fDoc(db, "users", authUser.uid, "logs", l.id), l, { merge: true }).catch(console.error);
          });
        });
      }

      localStorage.setItem("patient_zero_v2_stats", JSON.stringify(next));
      localStorage.setItem("patient_zero_sandbox_stats", JSON.stringify(next));
      localStorage.setItem("patient_zero_v2_mission_history", JSON.stringify(restoredHistory));
      localStorage.setItem("patient_zero_sandbox_mission_history", JSON.stringify(restoredHistory));
      localStorage.setItem("patient_zero_v2_logs", JSON.stringify(restoredLogs));
      localStorage.setItem("patient_zero_sandbox_logs", JSON.stringify(restoredLogs));

      return next;
    });

    setMissionHistory(restoredHistory);
    setLogs(restoredLogs);

    if (forceCloudSync) {
      showNotification("✓ Custom shift activity pushed to live Google account (debarna2001@gmail.com)!");
    } else if (!isDevSandboxMode && authUser) {
      showNotification("✓ Restored & Synced to Cloud: 4 Days Active, 100% Health & Shift Matrix Updated!");
    } else {
      showNotification("✓ Saved to Local Sandbox! Tap 'Push to Live Firestore' anytime to sync to Google.");
    }
  };

  const handleRestoreToOct7 = () => {
    handleSaveCustomActivity();
  };

  const handleImportData = (backup: any) => {
    if (!backup || typeof backup !== "object") return;
    
    if (backup.stats) {
      modifyStats(prev => ({
        ...prev,
        ...backup.stats
      }));
    }
    if (Array.isArray(backup.missions)) {
      setMissions(backup.missions);
      if (authUser && !isDevSandboxMode) {
        backup.missions.forEach((m: Mission) => {
          setDoc(doc(db, "users", authUser.uid, "missions", m.id), m).catch(console.error);
        });
      }
      localStorage.setItem("patient_zero_v2_missions", JSON.stringify(backup.missions));
    }
    if (Array.isArray(backup.emergencyLogs || backup.logs)) {
      const importedLogs = backup.emergencyLogs || backup.logs;
      setLogs(importedLogs);
      if (authUser && !isDevSandboxMode) {
        importedLogs.forEach((l: EmergencyLog) => {
          setDoc(doc(db, "users", authUser.uid, "logs", l.id), l).catch(console.error);
        });
      }
      localStorage.setItem("patient_zero_v2_logs", JSON.stringify(importedLogs));
    }
    if (Array.isArray(backup.moodLogs)) {
      setMoodLogs(backup.moodLogs);
      if (authUser && !isDevSandboxMode) {
        backup.moodLogs.forEach((l: MoodLog) => {
          setDoc(doc(db, "users", authUser.uid, "moods", `mood-${l.timestamp.replace(/[:\/ ]/g, '-')}`), l).catch(console.error);
        });
      }
      localStorage.setItem("patient_zero_v2_mood", JSON.stringify(backup.moodLogs));
    }
    if (Array.isArray(backup.missionHistory)) {
      setMissionHistory(backup.missionHistory);
      if (authUser && !isDevSandboxMode) {
        backup.missionHistory.forEach((h: DailyMissionRecord) => {
          setDoc(doc(db, "users", authUser.uid, "mission_history", h.date), h).catch(console.error);
        });
      }
      localStorage.setItem("patient_zero_v2_mission_history", JSON.stringify(backup.missionHistory));
    }
    showNotification("JSON Backup successfully imported and restored!");
  };

  const handleHardReset = () => {
    localStorage.clear();
    setStats(DEFAULT_STATS);
    setMissions(DEFAULT_MISSIONS.map(m => ({ ...m })));
    setMissionHistory([]);
    setLogs([]);
    setMoodLogs([]);
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
      missionHistory.forEach(h => deleteDoc(doc(db, "users", authUser.uid, "mission_history", h.date)).catch(console.error));
    }
    
    showNotification("Database reset complete.");
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
    { id: "rewards", label: "Journey & Wellness", icon: <Compass className="w-5 h-5" /> }
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

      <AnimatePresence>
        {inAppToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 text-xs font-bold tracking-wide shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/10 dark:border-slate-800/20 pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 dark:text-cyan-600 shrink-0" />
            <span>{inAppToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative dark:bg-slate-950 bg-slate-50 dark:bg-slate-950/50">

        {/* Universal Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-3 sm:px-5 py-2 sm:py-2.5 flex justify-between items-center gap-2 w-full">
            {/* Left: Patient Zero Logo only */}
            <div className="flex items-center gap-2.5 shrink-0">
               <div 
                 className="w-9 h-9 rounded-xl shrink-0 flex justify-center items-center shadow-sm border font-black overflow-hidden bg-slate-900 border-slate-800 text-cyan-400"
                 title={`Patient Zero — ${formatDoctorName(stats.studentName)}`}
               >
                  <img src="/logo.svg" alt="Patient Zero Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                  <span className="hidden">P₀</span>
               </div>
               <div className="hidden sm:flex items-center gap-2">
                 <span className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-200">
                   {formatDoctorName(stats.studentName || "B")}
                 </span>
                 {isDevSandboxMode && (
                   <button
                     onClick={handleToggleDevSandbox}
                     className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
                     title="Dev Sandbox is active. Clicks are isolated and will NOT touch live cloud database."
                   >
                     Sandbox (Safe)
                   </button>
                 )}
               </div>
            </div>

            {/* Right: Theme Toggle, Shift Mode (Logo Only), and Settings (Icon Only) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
               {/* Color Theme Toggle */}
               <motion.button 
                 whileTap={{ scale: 0.95 }} 
                 onClick={() => setIsDarkMode(!isDarkMode)} 
                 className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
                 title="Toggle color theme"
                 aria-label="Toggle color theme"
               >
                  <Activity className="w-4 h-4" />
               </motion.button>

               {/* Shift Mode: Logo only in trigger, full name shown in dropdown */}
               <div className="relative shrink-0">
                 <motion.button 
                   whileTap={{ scale: 0.95 }} 
                   onClick={() => setModeMenuOpen(m => !m)}
                   className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
                   title={`Shift: ${stats.studyMode === 'Rest' ? 'Recovery Shift' : stats.studyMode === 'Duty' ? 'Intensive On-Call' : 'Regular Shift'}`}
                   aria-label="Select Shift Mode"
                 >
                   <span className="flex items-center justify-center">
                     {stats.studyMode === 'Rest' && <Heart className="w-4 h-4 text-rose-500 shrink-0" />}
                     {stats.studyMode === 'Duty' && <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />}
                     {(!stats.studyMode || stats.studyMode === 'Normal') && <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />}
                   </span>
                   <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                 </motion.button>
                 <AnimatePresence>
                   {modeMenuOpen && (
                     <>
                       <div className="fixed inset-0 z-40" onClick={() => setModeMenuOpen(false)} />
                       <motion.div 
                         initial={{opacity: 0, y: -5, scale: 0.95}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: -5, scale: 0.95}}
                         transition={{ duration: 0.15 }}
                         className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col py-1.5"
                       >
                         <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                           <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shift Protocol</span>
                         </div>
                         {[ 
                           {id: 'Normal', label: 'Regular Shift', description: 'Standard clinical training pace', icon: <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />},
                           {id: 'Duty', label: 'Intensive On-Call', description: '3 shifts/wk max • High yield load', icon: <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />},
                           {id: 'Rest', label: 'Recovery Shift', description: '1 shift/wk max • Restorative mode', icon: <Heart className="w-4 h-4 text-rose-500 shrink-0" />}
                         ].map(mode => (
                           <motion.button whileTap={{ scale: 0.95 }} key={mode.id}
                             onClick={() => {
                               const nextMode = mode.id as 'Normal' | 'Duty' | 'Rest';
                               modifyStats(prev => {
                                 const wkStr = getCurrentMondayISO();
                                 
                                 let duties = prev.currentWeekStart === wkStr ? (prev.dutyDaysUsed || 0) : 0;
                                 let rests = prev.currentWeekStart === wkStr ? (prev.restDaysUsed || 0) : 0;
                                 
                                 if (nextMode === 'Duty' && prev.studyMode !== 'Duty') {
                                     if (duties >= 3) {
                                         showNotification("Intensive On-Call limit reached (3 shifts/week).");
                                         return prev;
                                     }
                                     duties++;
                                 }
                                 if (nextMode === 'Rest' && prev.studyMode !== 'Rest') {
                                     if (rests >= 1) {
                                         showNotification("Recovery Shift limit reached (1/week).");
                                         return prev;
                                     }
                                     rests++;
                                 }
                                 
                                 let alertMsg = "";
                                 if (nextMode === 'Duty') alertMsg = `Intensive Shift active. Remaining this week: ${3 - duties}`; 
                                 if (nextMode === 'Rest') alertMsg = "Recovery Shift active.";
                                 if (nextMode === 'Normal') alertMsg = "Regular Shift active.";
                                 showNotification(alertMsg);
            
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
                             className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors w-full"
                           >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5">{mode.icon}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">{mode.label}</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{mode.description}</span>
                                </div>
                              </div>
                              {stats.studyMode === mode.id && <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 ml-2" />}
                           </motion.button>
                         ))}
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>

               {/* Settings & Profile: Icon only */}
               <motion.button 
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsProfileSettingsOpen(true)}
                 className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-all shadow-sm shrink-0 flex items-center justify-center"
                 title={`Settings & Profile (${formatDoctorName(stats.studentName)})`}
                 aria-label="Settings and Resident Profile"
               >
                 <Settings className="w-4 h-4 text-slate-700 dark:text-cyan-400" />
               </motion.button>
            </div>
        </header>

        {/* Dashboard Main View */}
        <main className="flex-1 overflow-y-auto w-full pb-28">
           <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
             <AnimatePresence mode="wait">
               {activeTab === "dashboard" && (
                 <DashboardTab
                   stats={stats}
                   currentVitals={currentVitals}
                   isRestorativeBuffer={isRestorativeBuffer}
                   narrativeState={narrativeState}
                   dailyStreak={dailyStreak}
                   computedDaysToExam={computedDaysToExam}
                   missions={missions}
                   moodLogs={moodLogs}
                   moodRating={moodRating}
                   setMoodRating={setMoodRating}
                   moodTrigger={moodTrigger}
                   setMoodTrigger={setMoodTrigger}
                   handleMoodSubmit={handleMoodSubmit}
                   onOpenSleepModal={() => setShowSleepModal(true)}
                   onQuickRest={() => triggerManualStabilize("QuickBreak")}
                   onNavigateTab={handleTabChange}
                   onOpenManualLog={(type) => {
                     setManualLogType(type);
                     setManualLogModalOpen(true);
                     setSelectedSubjects([]);
                   }}
                 />
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
                missionHistory={missionHistory}
                patientHealth={stats.patientHealth}
                stats={stats}
                onUpdateProgress={handleUpdateMissionProgress}
                onClaimReward={handleClaimMissionReward}
                onAddMission={handleAddCustomMission}
                onSimulateSlip={handleSimulateSlip}
                studyMode={stats.studyMode}
                onLogPastShift={handleLogPastShift}
                onDeleteArchivedShift={handleDeleteArchivedShift}
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
              <ProgressPanel stats={stats} logs={logs} moodLogs={moodLogs} />
              <div className="mt-10 pt-10 border-t border-slate-200 dark:border-slate-800">
                <RewardsPanel stats={stats} xp={stats.xp} patientsSaved={stats.patientsSaved} studyStreak={dailyStreak} logs={logs} />
              </div>
              <div className="mt-10 pt-10 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight">Clinical Operation History</h3>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleClearLogs} className="text-xs font-bold text-rose-600 hover:text-rose-700 transition px-4 py-2 rounded-xl bg-rose-50 border border-rose-200">Purge Logs</motion.button>
                </div>
                <ShiftLog logs={logs} />
              </div>
            </motion.div>
          )}



          {activeTab === "rewards" && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Journey & Wellness Sub-Navigation Switcher */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700/80 shadow-sm w-full max-w-md">
                  <button
                    onClick={() => { sound.click(); setHonorsSubTab("map"); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      honorsSubTab === "map"
                        ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    Campus Journey
                  </button>
                  <button
                    onClick={() => { sound.click(); setHonorsSubTab("wellness"); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      honorsSubTab === "wellness"
                        ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Clinical Wellness & Safeguards
                  </button>
                </div>
              </div>

              {honorsSubTab === "map" ? (
                <JourneyMap stats={stats} onNavigateTab={handleTabChange} />
              ) : (
                <WellnessPanel 
                  stats={stats}
                  onUpdateStats={(updater) => {
                    modifyStats(updater);
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-500" /> Return to Dashboard
                </button>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resident Profile & System Configuration</span>
              </div>
              <SettingsPanel 
                studentName={stats.studentName}
                targetSpecialty={stats.targetSpecialty}
                targetExamDate={stats.targetExamDate || ""}
                stats={stats}
                missions={missions}
                logs={logs}
                moodLogs={moodLogs}
                missionHistory={missionHistory}
                onUpdateDate={handleUpdateDate} 
                onUpdateProfile={handleUpdateProfile}
                onHardReset={handleHardReset} 
                onSignOut={signOut}
                onRestoreToOct7={handleRestoreToOct7}
                onSaveCustomActivity={handleSaveCustomActivity}
                onUpdateInitiatedDate={handleUpdateInitiatedDate}
                onImportData={handleImportData}
                isDevSandboxMode={isDevSandboxMode}
                onToggleDevSandbox={handleToggleDevSandbox}
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
             {NAV_TABS.map(tab => {
               const isActive = activeTab === tab.id;
               return (
                 <motion.button whileTap={{ scale: 0.95 }}
                   key={tab.id}
                   onClick={() => {
                     handleTabChange(tab.id as any);
                     if ((tab as any).onClick) (tab as any).onClick();
                   }}
                   className={`flex-1 relative flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all ${
                     isActive
                        ? "text-cyan-600 dark:text-cyan-300 font-bold"
                        : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                   }`}
                 >
                    {/* Icon with radiant circular cyan bloom originating directly from the glyph */}
                    <div className="relative flex items-center justify-center">
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIconAura"
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div
                            className="w-9 h-9 bg-cyan-400/30 dark:bg-cyan-400/25 blur-md pointer-events-none"
                            style={{
                              borderRadius: "53% 47% 62% 38% / 46% 59% 41% 54%",
                            }}
                          />
                          <div
                            className="w-6 h-6 bg-cyan-300/40 dark:bg-cyan-300/30 blur-sm pointer-events-none"
                            style={{
                              borderRadius: "44% 56% 39% 61% / 55% 42% 58% 45%",
                            }}
                          />
                        </motion.div>
                      )}
                      <div className={`relative z-10 transition-transform ${isActive ? "text-cyan-600 dark:text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] scale-110" : ""}`}>
                        {tab.icon}
                      </div>
                    </div>

                    {/* Text with soft luminous bloom originating directly from the typography */}
                    <div className="relative flex items-center justify-center">
                      {isActive && (
                        <motion.div
                          layoutId="activeNavTextAura"
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div
                            className="w-full min-w-[32px] h-3 bg-cyan-300/30 dark:bg-cyan-400/20 blur-sm pointer-events-none"
                            style={{ borderRadius: "9999px" }}
                          />
                        </motion.div>
                      )}
                      <span className={`relative z-10 text-[9px] font-black tracking-widest uppercase transition-colors ${isActive ? "text-cyan-700 dark:text-cyan-200 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : ""}`}>
                        {tab.label}
                      </span>
                    </div>

                    {/* Minimalist static cyan underline indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative z-10 w-4 h-0.5 bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.9)] mt-0.5"
                      />
                    )}
                 </motion.button>
               );
             })}
           </div>
        </nav>

        {/* Profile & Settings Quick-Access Modal */}
        <AnimatePresence>
          {isProfileSettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
              onClick={() => setIsProfileSettingsOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-8 w-full max-w-3xl shadow-2xl relative border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Quick-Access Configuration Modal</span>
                  <button
                    onClick={() => {
                      setIsProfileSettingsOpen(false);
                      setActiveTab("settings");
                    }}
                    className="flex items-center gap-1.5 font-bold text-cyan-600 dark:text-cyan-400 hover:underline px-2 py-1 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition text-xs"
                    title="Open Fullscreen Page"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Open in Full-Page View
                  </button>
                </div>
                <SettingsPanel 
                  studentName={stats.studentName}
                  targetSpecialty={stats.targetSpecialty}
                  targetExamDate={stats.targetExamDate || ""}
                  stats={stats}
                  missions={missions}
                  logs={logs}
                  moodLogs={moodLogs}
                  missionHistory={missionHistory}
                  onUpdateDate={handleUpdateDate} 
                  onUpdateProfile={handleUpdateProfile}
                  onHardReset={handleHardReset} 
                  onSignOut={signOut}
                  onClose={() => setIsProfileSettingsOpen(false)}
                  onRestoreToOct7={handleRestoreToOct7}
                  onSaveCustomActivity={handleSaveCustomActivity}
                  onUpdateInitiatedDate={handleUpdateInitiatedDate}
                  onImportData={handleImportData}
                  isDevSandboxMode={isDevSandboxMode}
                  onToggleDevSandbox={handleToggleDevSandbox}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  if (selectedSubjects.length === 0) { showNotification('Please select at least one subject (or "General / All")'); return; }
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
