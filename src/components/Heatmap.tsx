import React, { useState } from 'react';
import { formatDateDMY, padZero, getTodayISO } from '../lib/dateUtils';
import { BookOpen, Activity, Moon, CheckCircle2, Calendar } from 'lucide-react';
import { sound } from '../lib/audio';

interface Props {
  activityLogs?: Record<string, number>;
  mcqLogs?: Record<string, number>;
  sleepLogs?: Record<string, number>;
  onSelectDate?: (dateIso: string) => void;
  onOpenPastShiftLogger?: (dateIso: string) => void;
}

export default function Heatmap({ 
  activityLogs = {}, 
  mcqLogs = {}, 
  sleepLogs = {},
  onSelectDate,
  onOpenPastShiftLogger
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const cellStyle = "w-3 h-3 rounded-xs cursor-pointer";
  
  // Generate last 60 days strictly calibrated to today in user's timezone (11/10/2026 in India)
  const todayIso = getTodayISO();
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const days: { dateStr: string }[] = [];
  for (let i = 59; i >= 0; i--) {
    const d = new Date(ty, tm - 1, td - i);
    const dateStr = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
    days.push({ dateStr });
  }

  const getColor = (count: number, hasMcqs: boolean) => {
    if (count === 0 && !hasMcqs) return "bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/50";
    if (count < 3 && !hasMcqs) return "bg-cyan-200 dark:bg-cyan-900 border border-cyan-300 dark:border-cyan-800";
    if (count < 6) return "bg-cyan-400 dark:bg-cyan-700 border border-cyan-500 dark:border-cyan-600";
    if (count < 10) return "bg-cyan-500 dark:bg-cyan-500 border border-cyan-400 dark:border-cyan-400";
    return "bg-cyan-600 dark:bg-cyan-300 border border-cyan-400 dark:border-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.6)]";
  };

  const handleCellClick = (ds: string) => {
    sound.click();
    setSelectedDate(prev => prev === ds ? null : ds);
    if (onSelectDate) onSelectDate(ds);
  };

  // Resilient lookup supporting both yyyy-mm-dd and dd-mm-yyyy stored keys
  const getVal = (record: Record<string, number> | undefined, ds: string): number => {
    if (!record) return 0;
    if (record[ds] !== undefined && record[ds] !== null) return record[ds];
    const dmy = formatDateDMY(ds);
    if (record[dmy] !== undefined && record[dmy] !== null) return record[dmy];
    return 0;
  };

  const activeDatesCount = new Set([
    ...Object.keys(activityLogs).filter(k => (activityLogs[k] || 0) > 0),
    ...Object.keys(mcqLogs).filter(k => (mcqLogs[k] || 0) > 0)
  ]).size;

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col gap-4 shadow-xs backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              Clinical Activity Matrix
            </h4>
            <span className="text-[10px] font-semibold text-slate-400">
              60-Day Continuity • {activeDatesCount} Active Days Recorded
            </span>
          </div>
        </div>
        <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-200 dark:border-cyan-800/60 self-start sm:self-auto">
          Local Timezone Calibrated
        </span>
      </div>
      
      {/* 60 Days Grid */}
      <div className="flex flex-wrap gap-1.5 md:gap-2 pt-1">
        {days.map(({ dateStr }, i) => {
          const actionCount = getVal(activityLogs, dateStr);
          const mcqCount = getVal(mcqLogs, dateStr);
          const sleepCount = getVal(sleepLogs, dateStr);
          const effectiveCount = Math.max(actionCount, mcqCount > 0 ? Math.ceil(mcqCount / 10) : 0);
          const isSelected = selectedDate === dateStr;
          
          return (
             <button 
               key={i} 
               onClick={() => handleCellClick(dateStr)}
               aria-label={`Date ${formatDateDMY(dateStr)}`}
               className={`${cellStyle} ${getColor(effectiveCount, mcqCount > 0)} transition-all hover:scale-125 focus:outline-none ${
                 isSelected ? "ring-2 ring-amber-400 scale-125 z-10" : ""
               }`}
               title={`${formatDateDMY(dateStr)}: ${actionCount} actions • ${mcqCount} MCQs • ${sleepCount ? `${sleepCount}h rest` : 'No rest logged'}`}
             />
          );
        })}
      </div>
      
      {/* Interactive Day Details Drawer */}
      {selectedDate && (() => {
        const selectedActions = getVal(activityLogs, selectedDate);
        const selectedMcqs = getVal(mcqLogs, selectedDate);
        const selectedSleep = getVal(sleepLogs, selectedDate);
        const hasActivity = selectedActions > 0 || selectedMcqs > 0;

        return (
          <div className="mt-1 p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span className="font-black text-slate-900 dark:text-slate-100">
                {formatDateDMY(selectedDate)}
              </span>
              {hasActivity ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Active Shift
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  No Actions
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-500" />
                {selectedActions} Shift Actions
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                {selectedMcqs} MCQs Solved
              </span>
              {selectedSleep > 0 && (
                <span className="flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  {selectedSleep}h Rest
                </span>
              )}
            </div>
            {onOpenPastShiftLogger && (
              <button
                type="button"
                onClick={() => onOpenPastShiftLogger(selectedDate)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider transition shrink-0 shadow-xs"
              >
                Log / Edit Protocols for this Shift
              </button>
            )}
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400">
        <span>Click any date to inspect metrics</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
          <div className="w-2.5 h-2.5 rounded-xs bg-cyan-200 dark:bg-cyan-900 border border-cyan-300 dark:border-cyan-800" />
          <div className="w-2.5 h-2.5 rounded-xs bg-cyan-400 dark:bg-cyan-700 border border-cyan-500 dark:border-cyan-600" />
          <div className="w-2.5 h-2.5 rounded-xs bg-cyan-500 border border-cyan-400" />
          <div className="w-2.5 h-2.5 rounded-xs bg-cyan-600 dark:bg-cyan-300 border border-cyan-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
