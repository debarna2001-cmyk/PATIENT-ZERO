import { sound } from "../lib/audio";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertOctagon, RefreshCw, Save, Bell, Download, Upload, 
  FileText, Calendar, CheckCircle2, X, History, ShieldAlert,
  ShieldCheck, ArrowRight, Sparkles, Database, BookOpen, Moon, Activity, Sliders, Cloud,
  RotateCcw, Plus, Trash2
} from "lucide-react";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { getNotificationPermission, requestNotificationPermission, triggerNotification } from "../lib/notifications";
import { UserStats, Mission, EmergencyLog, MoodLog, DailyMissionRecord } from "../types";
import { formatDateDMY, getDaysDiff, getTodayISO } from "../lib/dateUtils";
import { formatDoctorName } from "../lib/doctorUtils";

interface Props {
  targetExamDate: string;
  studentName: string;
  targetSpecialty: string;
  stats?: UserStats;
  missions?: Mission[];
  logs?: EmergencyLog[];
  moodLogs?: MoodLog[];
  missionHistory?: DailyMissionRecord[];
  onUpdateDate: (dateStr: string) => void;
  onUpdateProfile: (name: string, specialty: string, year: number) => void;
  onHardReset?: () => void;
  onSignOut: () => void;
  onClose?: () => void;
  onRestoreToOct7?: () => void;
  onSaveCustomActivity?: (customMap?: Record<string, { mcqs: number; actions: number; hours: number }>, forceCloudSync?: boolean) => void;
  onUpdateInitiatedDate?: (dateStr: string) => void;
  onImportData?: (importedData: any) => void;
  isDevSandboxMode?: boolean;
  onToggleDevSandbox?: () => void;
}

export default function SettingsPanel({ 
  targetExamDate, 
  studentName, 
  targetSpecialty, 
  stats, 
  missions, 
  logs, 
  moodLogs, 
  missionHistory = [], 
  onUpdateDate, 
  onUpdateProfile, 
  onHardReset, 
  onSignOut, 
  onClose,
  onRestoreToOct7,
  onSaveCustomActivity,
  onUpdateInitiatedDate,
  onImportData,
  isDevSandboxMode = false,
  onToggleDevSandbox
}: Props) {
  const [date, setDate] = useState(targetExamDate);
  const [name, setName] = useState(studentName || "B");
  const [specialty, setSpecialty] = useState(targetSpecialty);
  const [audioEnabled, setAudioEnabled] = useState(sound.isEnabled());
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Custom initiated date editor state
  const currentInitiated = stats?.firstActiveDate || "2026-10-07";
  const [customInitiatedDate, setCustomInitiatedDate] = useState(currentInitiated);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(studentName || "B");
  }, [studentName]);

  useEffect(() => {
    setSpecialty(targetSpecialty);
  }, [targetSpecialty]);

  useEffect(() => {
    setDate(targetExamDate);
  }, [targetExamDate]);

  useEffect(() => {
    if (stats?.firstActiveDate) {
      setCustomInitiatedDate(stats.firstActiveDate);
    }
  }, [stats?.firstActiveDate]);

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const getSystemActiveInfo = () => {
    if (!stats) return { daysActive: 1, initiatedDate: getTodayISO(), shiftsCompleted: 0 };
    const today = getTodayISO();
    
    // Look for permanent firstActiveDate or calculate from all historical records
    let earliestDate = stats.firstActiveDate || (stats.createdAt ? stats.createdAt.slice(0, 10) : null);
    
    if (!earliestDate) {
      const candidates: string[] = [];
      if (stats.activityLogs && Object.keys(stats.activityLogs).length > 0) {
        candidates.push(...Object.keys(stats.activityLogs));
      }
      if (missionHistory && missionHistory.length > 0) {
        candidates.push(...missionHistory.map(m => m.date));
      }
      if (stats.subjectPerformanceDaily && Object.keys(stats.subjectPerformanceDaily).length > 0) {
        candidates.push(...Object.keys(stats.subjectPerformanceDaily));
      }
      if (stats.sleepLogs && Object.keys(stats.sleepLogs).length > 0) {
        candidates.push(...Object.keys(stats.sleepLogs));
      }
      if (logs && logs.length > 0) {
        logs.forEach(l => {
          if (l.date) candidates.push(l.date);
          else if (l.id && l.id.startsWith("log-")) {
            const ep = parseInt(l.id.replace("log-", ""), 10);
            if (!isNaN(ep) && ep > 0) candidates.push(new Date(ep).toISOString().split("T")[0]);
          }
        });
      }
      if (candidates.length > 0) {
        candidates.sort();
        earliestDate = candidates[0];
      }
    }

    if (!earliestDate) earliestDate = today;

    // Calculate actual elapsed calendar days
    const diffDays = getDaysDiff(earliestDate, today);
    const daysActive = Math.max(1, diffDays + 1);

    // Count shifts completed
    const shiftsCompleted = missionHistory.filter(m => (m.completedRate ?? 0) >= 100).length;

    return {
      daysActive,
      initiatedDate: earliestDate,
      shiftsCompleted
    };
  };

  const [statusToast, setStatusToast] = useState<string | null>(null);
  const showStatus = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const activeInfo = getSystemActiveInfo();

  const handleSaveDate = () => {
    onUpdateDate(date);
    showStatus("Target exam date successfully updated.");
  };

  const handleSaveProfile = () => {
    const cleanName = name.trim() || "B";
    onUpdateProfile(cleanName, specialty, new Date().getFullYear() + 1);
    showStatus(`Clinical profile updated. Active callsign: ${formatDoctorName(cleanName)}`);
  };

  const handleSaveInitiatedDate = () => {
    if (!customInitiatedDate) return;
    if (onUpdateInitiatedDate) {
      onUpdateInitiatedDate(customInitiatedDate);
    }
    showStatus(`Initiation date locked to ${formatDateDMY(customInitiatedDate)}.`);
  };

  const handleQuickSetInitiated = (targetDate: string) => {
    setCustomInitiatedDate(targetDate);
    if (onUpdateInitiatedDate) {
      onUpdateInitiatedDate(targetDate);
    }
    showStatus(`Initiation date set to ${formatDateDMY(targetDate)}.`);
  };

  const handleResetSandbox = () => {
    sound.click();
    if (confirm("Reset Dev Sandbox local test data? Your genuine Google Cloud account records will not be affected.")) {
      localStorage.removeItem("patient_zero_sandbox_stats");
      localStorage.removeItem("patient_zero_sandbox_missions");
      localStorage.removeItem("patient_zero_sandbox_logs");
      localStorage.removeItem("patient_zero_sandbox_mission_history");
      showStatus("Dev Sandbox local test storage reset. Google Cloud records remain safe.");
    }
  };

  const handleRequestPermission = () => {
    requestNotificationPermission().then((status) => {
      setNotificationPermission(status);
      if (status === "granted") {
        triggerNotification("Shift Control System", {
          body: "Notifications linked successfully! Daily shift logs will follow.",
          tag: "link-confirm"
        });
        showStatus("Notifications enabled.");
      } else {
        showStatus("Notification permission was not granted.");
      }
    });
  };

  const handleTriggerTest = () => {
    if (!("Notification" in window)) {
       showStatus("Browser notifications not supported in this environment.");
       return;
    }
    
    if (Notification.permission !== "granted") {
       requestNotificationPermission().then((status) => {
          setNotificationPermission(status);
          if (status === "granted") {
             triggerDesktopNotification();
             showStatus("Test notification sent.");
          } else {
             showStatus("Notification permission denied in browser settings.");
          }
       });
    } else {
       triggerDesktopNotification();
       showStatus("Test notification dispatched.");
    }
  };

  const triggerDesktopNotification = () => {
     triggerNotification("0800 HRS: Morning Shift (TEST)", {
       body: "Simulation Alert: Your morning 5-case triage session is online. Let's save lives.",
       tag: "test-notification"
     });
  };


  const handleExportData = () => {
    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      stats: stats,
      missions: missions,
      emergencyLogs: logs,
      moodLogs: moodLogs,
      missionHistory: missionHistory || []
    };
    
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const dateStr = formatDateDMY(new Date());
    const filename = `patient-zero-backup-${dateStr}.json`;
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus("JSON backup downloaded successfully.");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || (typeof parsed !== "object")) {
          throw new Error("Invalid backup JSON format.");
        }
        if (onImportData) {
          onImportData(parsed);
          showStatus("JSON Backup successfully imported and restored!");
        }
      } catch (err: any) {
        showStatus(`Import failed: ${err.message || "Invalid file"}`);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-12">
      {onClose && (
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 flex items-center justify-between pb-4 pt-1 border-b border-slate-200 dark:border-slate-800 -mx-1 px-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Resident Profile & Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium">Manage clinical identification, history recovery, and cloud synchronization.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0 ml-3 shadow-sm border border-slate-200 dark:border-slate-700"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {statusToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center justify-between shadow-xl"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {statusToast}
            </span>
            <button onClick={() => setStatusToast(null)} className="opacity-70 hover:opacity-100 uppercase text-[10px] ml-4">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEV vs PRODUCTION / GMAIL CLOUD SYNC CLARITY & SANDBOX TOGGLE */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition shadow-sm ${
        isDevSandboxMode 
          ? "bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20" 
          : "bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-750"
      }`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              {isDevSandboxMode ? (
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              )}
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg uppercase tracking-wider">
                Cloud Sync & Dev Account Safety
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Account sync status and protection for <strong className="text-slate-800 dark:text-slate-200">debarna2001@gmail.com</strong>
            </p>
          </div>
          <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border ${
            isDevSandboxMode
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          }`}>
            {isDevSandboxMode ? "SANDBOX MODE (SAFE)" : "LIVE CLOUD SYNC"}
          </span>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Why sharing one Gmail account matters:</strong> Both the Development URL (<code className="text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-cyan-600 dark:text-cyan-400">ais-dev</code>) and Preview URL (<code className="text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-cyan-600 dark:text-cyan-400">ais-pre</code>) share the exact same Firestore database. When you are signed into Google, any taps or test actions in Development write directly to your cloud account and reflect on the user preview side.
          </p>
          <p>
            To safely test new features without mutating your genuine clinical history, enable <strong>Dev Sandbox Mode</strong> below. While active, changes remain in local sandbox memory and will never touch your real cloud records.
          </p>
        </div>

        {onToggleDevSandbox && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Dev Sandbox / Safe Testing Mode:
            </span>
            <button
              onClick={onToggleDevSandbox}
              onPointerDown={() => sound.click()}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm ${
                isDevSandboxMode
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {isDevSandboxMode ? "Active (Safe Testing)" : "Disabled (Live Sync)"}
            </button>
          </div>
        )}

        {isDevSandboxMode && (
          <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/5 p-3.5 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Isolated Sandbox Test Cache</span>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400 font-medium">Clear local test mutations without touching your live Google Cloud records.</span>
            </div>
            <button
              type="button"
              onClick={handleResetSandbox}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 transition border border-amber-300 dark:border-amber-700 shrink-0"
            >
              Reset Sandbox Cache
            </button>
          </div>
        )}
      </div>

      {/* EDITABLE DATE INITIATED & COMMENCEMENT CALENDAR */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-200 dark:border-slate-700 pb-4 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-500" />
          Simulation Initiation Date
        </h3>
        
        <div className="flex flex-col gap-4 max-w-lg">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Commencement Date (Active Since)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="date"
              value={customInitiatedDate}
              onChange={(e) => setCustomInitiatedDate(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition shadow-inner font-mono text-sm"
            />
            <motion.button 
              whileTap={{ scale: 0.95 }} 
              onPointerDown={() => sound.click()} 
              onClick={handleSaveInitiatedDate}
              className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <Save className="w-4 h-4" /> Lock Date
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Presets:</span>
            <button
              onClick={() => handleQuickSetInitiated("2026-10-07")}
              onPointerDown={() => sound.click()}
              className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 hover:bg-cyan-200 border border-cyan-300 dark:border-cyan-800 px-3 py-1 rounded-lg transition"
            >
              07/10/2026 (Original)
            </button>
            <button
              onClick={() => handleQuickSetInitiated(getTodayISO())}
              onPointerDown={() => sound.click()}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-lg transition"
            >
              Today ({formatDateDMY(getTodayISO())})
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
            <span>Currently Recognized:</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-slate-200/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {formatDateDMY(activeInfo.initiatedDate)} ({activeInfo.daysActive} {activeInfo.daysActive === 1 ? 'day' : 'days'} active)
            </span>
          </div>
        </div>
      </div>
      
      {/* RESIDENT PROFILE */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">Resident Profile</h3>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resident Designation</label>
              <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200/50 dark:border-cyan-800/50">
                Callsign: {formatDoctorName(name || "B")}
              </span>
            </div>
            <input 
              type="text"
              value={name}
              placeholder="e.g. B or Dr. B"
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition shadow-inner"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Default identity is <strong>Dr. B</strong>. Enter any custom name or initials to personalize your clinical callsign.</p>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Specialty</label>
            <input 
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition shadow-inner"
            />
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
          onClick={handleSaveProfile}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white dark:text-slate-900 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20"
        >
          <Save className="w-4 h-4" /> Save Resident Profile
        </motion.button>
      </div>

      {/* TARGET EXAM DATE & SIMULATION VARIABLES */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">Simulation Variables</h3>
        
        <div className="flex flex-col gap-4 max-w-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Date (NEET PG)</label>
          <div className="flex gap-3">
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition shadow-inner"
            />
            <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
              onClick={handleSaveDate}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white dark:text-slate-900 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20"
            >
              <Save className="w-4 h-4" /> Update
            </motion.button>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Active Target: <span className="font-bold text-cyan-400 font-mono">{formatDateDMY(date)}</span> (dd-mm-yyyy)
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-8 max-w-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Haptic & Audio Feedback</label>
          <div className="flex bg-slate-200 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-300 dark:border-slate-700">
            <button 
              onClick={() => { sound.enable(true); setAudioEnabled(true); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${audioEnabled ? 'bg-cyan-600 text-white dark:text-slate-900 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Enabled</button>
            <button 
              onClick={() => { sound.enable(false); setAudioEnabled(false); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!audioEnabled ? 'bg-rose-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Muted</button>
          </div>
        </div>
      </div>

      {/* SHIFT REMINDERS */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-200 dark:border-slate-750 pb-4 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-500" /> Daily Shift Reminders
        </h3>
        
        <div className="flex flex-col gap-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
             Shift notification is scheduled at exactly <strong className="text-cyan-600 dark:text-cyan-400 font-bold">08:00 AM (0800 HRS)</strong> daily to remind you of your morning triage cases.
          </p>

          <div className="p-4 bg-white dark:bg-slate-800/45 border border-slate-200 dark:border-slate-750 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex flex-col gap-1 items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Browser Permission Status</span>
                <span className={`text-sm font-extrabold uppercase px-3 py-1 rounded-full leading-none border text-xs ${
                   notificationPermission === "granted" 
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/20" 
                      : notificationPermission === "denied" 
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-500/20" 
                      : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/20"
                }`}>
                   {notificationPermission === "granted" ? "ONLINE / GRANTED" : notificationPermission === "denied" ? "BLOCKED / DENIED" : "PENDING / DEFAULT"}
                </span>
             </div>

             <div className="flex gap-3 shrink-0">
                {notificationPermission !== "granted" && (
                   <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
                      onClick={handleRequestPermission}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white dark:text-slate-900 rounded-xl font-extrabold text-xs tracking-wider transition shadow-md"
                   >
                      Request Link
                   </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
                   onClick={handleTriggerTest}
                   className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl font-extrabold text-xs tracking-wider transition"
                >
                   Test Notification
                </motion.button>
             </div>
          </div>
        </div>
      </div>

      {/* DATA BACKUP & RESTORE (EXPORT + IMPORT JSON) */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-cyan-700 dark:text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-200 dark:border-slate-750 pb-4 mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-500" /> Data Backup & Migration
        </h3>
        
        <div className="flex flex-col gap-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
             <div>
               <h4 className="font-bold text-slate-800 dark:text-slate-200">Simulation Data Mobility</h4>
               <p className="text-sm text-slate-500 font-medium mt-1">
                 Export or import your full database snapshot (stats, cases, missions, and shift history).
               </p>
               <div className="flex flex-wrap items-center gap-2 mt-3">
                 <p className="text-xs tracking-widest uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                   System Active: {activeInfo.daysActive} {activeInfo.daysActive === 1 ? 'Day' : 'Days'}
                 </p>
                 <p className="text-xs tracking-wider font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 px-3 py-1.5 rounded-lg">
                   Initiated: <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{formatDateDMY(activeInfo.initiatedDate)}</span>
                 </p>
               </div>
             </div>

             <div className="flex flex-wrap gap-3">
               {/* Hidden file input for import */}
               <input 
                 type="file"
                 ref={fileInputRef}
                 accept=".json,application/json"
                 onChange={handleFileChange}
                 className="hidden"
               />

               <motion.button 
                 whileTap={{ scale: 0.95 }} 
                 onPointerDown={() => sound.click()} 
                 onClick={() => fileInputRef.current?.click()}
                 className="px-5 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-xs tracking-wider transition shrink-0 shadow-sm flex items-center gap-2"
               >
                 <Upload className="w-4 h-4 text-cyan-500" />
                 Import / Restore JSON
               </motion.button>

               <motion.button 
                 whileTap={{ scale: 0.95 }} 
                 onPointerDown={() => sound.click()} 
                 onClick={handleExportData}
                 className="px-5 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white dark:text-slate-900 rounded-xl font-extrabold text-xs tracking-wider transition shrink-0 shadow-md flex items-center gap-2"
               >
                 <Download className="w-4 h-4" />
                 Export JSON Backup
               </motion.button>
             </div>
           </div>

           <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
             <span className="text-xs text-slate-500 font-medium">System Architecture Documentation:</span>
             <a
               href="/PATIENT_ZERO_SYSTEM_DOSSIER.md"
               download="PATIENT_ZERO_SYSTEM_DOSSIER.md"
               onPointerDown={() => sound.click()}
               className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
             >
               <FileText className="w-3.5 h-3.5" />
               Download System Dossier (.md)
             </a>
           </div>
        </div>
      </div>

      {/* ACCOUNT CONTROL */}
      <div className="bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-750 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xl tracking-tight border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-500" />
          Account & Session Control
        </h3>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">Sign Out of Simulation</h4>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Safely disconnect your session. Your progress is synced to <strong className="text-slate-800 dark:text-slate-200">debarna2001@gmail.com</strong>.
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
            onClick={onSignOut}
            className="px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 flex items-center gap-2 shrink-0 shadow-sm"
          >
            Sign Out
          </motion.button>
        </div>
      </div>

      {/* DANGER ZONE: FACTORY RESET */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 border-2 border-rose-500/30 dark:border-rose-900/50 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-rose-200 dark:border-rose-900/50 pb-4 mb-6">
          <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                Irreversible Action
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                Danger Zone
              </span>
            </div>
            <h3 className="font-black text-rose-950 dark:text-rose-100 text-xl tracking-tight mt-0.5">
              Factory Reset (Absolute Zero)
            </h3>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Fresh Start from Absolute Zero
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              Permanently purges all clinical shift history, active missions, saved triage cases, streaks, XP, achievements, custom activities, and overrides cloud records with clean Day 0 defaults. Use this if you want to restart your preparation journey from absolute scratch.
            </p>
          </div>

          <div className="shrink-0 w-full lg:w-auto">
            {!showResetConfirm ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onPointerDown={() => sound.click()}
                onClick={() => setShowResetConfirm(true)}
                className="w-full lg:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Factory Reset Simulation
              </motion.button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto bg-white dark:bg-slate-900 p-3 rounded-2xl border border-rose-300 dark:border-rose-900/60 shadow-lg">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2 py-1 text-center">
                  Are you absolutely sure?
                </span>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      sound.flatlineAlert();
                      setShowResetConfirm(false);
                      if (onHardReset) onHardReset();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-wider text-[11px] shadow-sm transition"
                  >
                    Confirm: Wipe to Zero
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase tracking-wider text-[11px] transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
