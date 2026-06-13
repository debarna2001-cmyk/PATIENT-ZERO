import { motion } from "motion/react";
import { BookOpen, FileText } from "lucide-react";
import { EmergencyLog } from "../types";

interface Props {
  logs: EmergencyLog[];
}

export default function VaultTab({ logs }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/10 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Clinical Records</h2>
            <p className="text-slate-500 text-sm">Review clinical operation history.</p>
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/30">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No clinical records acquired yet.<br/>Complete Triage cases to populate this vault.</p>
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
  );
}
