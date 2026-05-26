import React from 'react';

interface Props {
  activityLogs: Record<string, number>;
}

export default function Heatmap({ activityLogs }: Props) {
  const cellStyle = "w-3 h-3 rounded-sm";
  const today = new Date();
  
  // Generate last 60 days
  const days = [];
  for(let i=59; i>=0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-800/50 border border-slate-700/50";
    if (count < 3) return "bg-cyan-900 border border-cyan-800";
    if (count < 6) return "bg-cyan-700 border border-cyan-600";
    if (count < 10) return "bg-cyan-500 border border-cyan-400";
    return "bg-cyan-300 border border-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.8)]";
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Clinical Activity Matrix</h4>
        <span className="text-xs font-semibold text-slate-400">Past 60 Days</span>
      </div>
      
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {days.map((d, i) => {
          const ds = d.toISOString().split("T")[0];
          const count = activityLogs && activityLogs[ds] ? activityLogs[ds] : 0;
          return (
             <div 
               key={i} 
               className={`${cellStyle} ${getColor(count)} transition-all hover:scale-125 cursor-crosshair`}
               title={`${ds}: ${count} actions logged`}
             />
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500 justify-end">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-slate-800/50 border border-slate-700/50" />
        <div className="w-3 h-3 rounded-sm bg-cyan-900 border border-cyan-800" />
        <div className="w-3 h-3 rounded-sm bg-cyan-700 border border-cyan-600" />
        <div className="w-3 h-3 rounded-sm bg-cyan-500 border border-cyan-400" />
        <div className="w-3 h-3 rounded-sm bg-cyan-300 border border-cyan-200 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
        <span>More</span>
      </div>
    </div>
  );
}
