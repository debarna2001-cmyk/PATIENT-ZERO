import { sound } from "../lib/audio";
import { motion } from "motion/react";
import { AlertOctagon, RefreshCw, Save, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotificationPermission, requestNotificationPermission, triggerNotification } from "../lib/notifications";

interface Props {
  targetExamDate: string;
  studentName: string;
  targetSpecialty: string;
  onUpdateDate: (dateStr: string) => void;
  onUpdateProfile: (name: string, specialty: string, year: number) => void;
  onHardReset: () => void;
  onSignOut: () => void;
}

export default function SettingsPanel({ targetExamDate, studentName, targetSpecialty, onUpdateDate, onUpdateProfile, onHardReset, onSignOut }: Props) {
  const [date, setDate] = useState(targetExamDate);
  const [name, setName] = useState(studentName);
  const [specialty, setSpecialty] = useState(targetSpecialty);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  useEffect(() => {
    setNotificationPermission(getNotificationPermission());
  }, []);

  const handleSaveDate = () => {
    onUpdateDate(date);
    alert("Target date updated.");
  };

  const handleSaveProfile = () => {
    onUpdateProfile(name, specialty, new Date().getFullYear() + 1);
    alert("Profile updated.");
  };

  const handleRequestPermission = () => {
    requestNotificationPermission().then((status) => {
      setNotificationPermission(status);
      if (status === "granted") {
        triggerNotification("Shift Control System", {
          body: "Notifications linked successfully! Critical shift logs will follow.",
          tag: "link-confirm"
        });
      }
    });
  };

  const handleTriggerTest = () => {
    if (!("Notification" in window)) {
       alert("This browser does not support system notifications.");
       return;
    }
    
    if (Notification.permission !== "granted") {
       requestNotificationPermission().then((status) => {
          setNotificationPermission(status);
          if (status === "granted") {
             triggerDesktopNotification();
          } else {
             alert("Notification permission denied. Please enable notifications in your browser settings.");
          }
       });
    } else {
       triggerDesktopNotification();
    }
  };

  const triggerDesktopNotification = () => {
     triggerNotification("0800 HRS: Morning Shift (TEST)", {
       body: "Simulation Alert: Your morning 5-case triage session is online. Let's save lives.",
       tag: "test-notification"
     });
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
        <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
          onClick={handleSaveProfile}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Avatar Sync
        </motion.button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-700 pb-4 mb-6">Simulation Variables</h3>
        
        <div className="flex flex-col gap-4 max-w-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Date (NEET PG)</label>
          <div className="flex gap-3">
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-medium outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
              onClick={handleSaveDate}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-slate-100 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Update
            </motion.button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-xl">
        <h3 className="font-bold text-cyan-400 text-xl tracking-widest uppercase border-b border-slate-700 pb-4 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" /> Daily Shift Reminders
        </h3>
        
        <div className="flex flex-col gap-6">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
             Shift notification is scheduled at exactly <strong className="text-cyan-400 font-bold">08:00 AM (0800 HRS)</strong> daily to remind you of your morning triage cases.
          </p>

          <div className="p-4 bg-slate-800/45 border border-slate-750 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex flex-col gap-1 items-start">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Browser Permission Status</span>
                <span className={`text-sm font-extrabold uppercase px-3 py-1 rounded-full leading-none border text-xs ${
                   notificationPermission === "granted" 
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-500/20" 
                      : notificationPermission === "denied" 
                      ? "text-red-400 bg-red-950/40 border-red-500/20" 
                      : "text-amber-400 bg-amber-950/40 border-amber-500/20"
                }`}>
                   {notificationPermission === "granted" ? "ONLINE / GRANTED" : notificationPermission === "denied" ? "BLOCKED / DENIED" : "PENDING / DEFAULT"}
                </span>
             </div>

             <div className="flex gap-3 shrink-0">
                {notificationPermission !== "granted" && (
                   <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
                      onClick={handleRequestPermission}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-900 rounded-xl font-extrabold text-xs tracking-wider transition"
                   >
                      Request Link
                   </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
                   onClick={handleTriggerTest}
                   className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 rounded-xl font-extrabold text-xs tracking-wider transition"
                >
                   Test Notification
                </motion.button>
             </div>
          </div>

          <div className="text-xs text-slate-400 font-medium space-y-2 border-t border-slate-800 pt-4">
             <h4 className="font-bold text-slate-300 uppercase tracking-wider">Why did I not get my notification?</h4>
             <ul className="list-disc pl-5 space-y-1.5 text-slate-400 font-medium">
                <li><strong className="text-slate-300">Tab Active Required</strong>: These are client-side browser notifications. The app must be open in a browser tab at 08:00 AM to trigger. If the device was asleep or the tab was closed, the timer is paused and the alert won't fire.</li>
                <li><strong className="text-slate-300">iframe Block</strong>: When viewed in the AI Studio preview window, standard browser system alerts may be restricted by the frame. Open the app in its own tab!</li>
                <li><strong className="text-slate-300">Permission Setting</strong>: Ensure system alerts are set to "Allow" in your browser address bar. Click "Request Link" or "Test Notification" above to test immediately.</li>
             </ul>
          </div>
        </div>
      </div>

      <div className="bg-red-900/30 border border-red-500/30 rounded-3xl p-8 shadow-xl">
         <h3 className="font-bold text-rose-900 text-xl tracking-tight border-b border-rose-200/50 pb-4 mb-6 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          Danger Zone
         </h3>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-rose-200/20 pb-6">
            <div>
              <h4 className="font-bold text-rose-800">Account Control: Sign Out</h4>
              <p className="text-sm text-rose-600/80 font-medium mt-1">Disconnect from the simulation and cloud sync.</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
              onClick={onSignOut}
              className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 flex items-center gap-2 shrink-0 shadow-sm"
            >
              Sign Out
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-rose-800">Emergency Protocol: System Reset</h4>
              <p className="text-sm text-rose-600/80 font-medium mt-1">Permanently format all patient records, XP, and mission progress.</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onPointerDown={() => sound.click()} 
              onClick={handleReset}
              className="px-6 py-3.5 bg-white dark:bg-slate-900 border border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-bold uppercase tracking-wider text-xs transition duration-300 flex items-center gap-2 shrink-0 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Initiate Clean Wipe
            </motion.button>
          </div>
        </div>
      </div>

    </div>
  );
}
