import { EmergencyLog } from "../types";
import { ShieldCheck, ShieldAlert, Clock, Stethoscope } from "lucide-react";

interface Props {
  logs: EmergencyLog[];
}

export default function ShiftLog({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-3xl mt-4">
        <span className="text-slate-400 font-bold block">No operation histories recorded.</span>
        <span className="text-xs font-medium text-slate-500 mt-2 block">Complete a triage vignette to begin logging clinical data.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {logs.map((log) => {
        const isSuccess = log.result === "STABILIZED";
        return (
          <div 
            key={log.id} 
            className={`border rounded-2xl p-5 flex flex-col md:flex-row gap-6 transition-all ${
              isSuccess 
                ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200" 
                : "bg-red-50/30 border-red-100 hover:border-red-200"
            }`}
          >
            <div className="flex-1 w-full flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    isSuccess ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-red-100 text-red-600 border-red-200"
                  }`}>
                    {isSuccess ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                     <span className={`text-[10px] font-bold uppercase tracking-widest block mb-0.5 ${isSuccess ? "text-emerald-600" : "text-red-500"}`}>
                      {log.result}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-none">{log.patientName} <span className="text-slate-400 font-medium">({log.specialty})</span></h4>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {log.vignette}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Action Initiated</span>
                  <span className={`text-sm font-bold ${isSuccess ? 'text-emerald-600' : 'text-red-500'}`}>
                    Option {log.userAnswer}
                  </span>
                </div>
                {!isSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Correct Protocol</span>
                    <span className="text-sm font-bold text-emerald-700">
                      Option {log.correctAnswer}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/3 flex border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <Stethoscope className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Medical Insight</span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-200 pl-3">
                "{log.pearl}"
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
