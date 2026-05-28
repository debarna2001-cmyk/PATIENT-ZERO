import React from 'react';
import { UserStats } from '../types';
import { AlertTriangle, Activity, Database, Target, Crosshair, ShieldAlert, Map as MapIcon, ShieldCheck, MapPin } from 'lucide-react';

interface Props {
  stats: UserStats;
}

export default function JourneyMap({ stats }: Props) {
  // Expedition Milestones based on XP
  const milestones = [
    { threshold: 0, label: "Collapse Zone", icon: <AlertTriangle className="w-5 h-5" />, desc: "Initial entry into hostile territory" },
    { threshold: 15000, label: "Triage Corridor", icon: <Activity className="w-5 h-5" />, desc: "Prioritizing critical targets" },
    { threshold: 40000, label: "Retention Vaults", icon: <Database className="w-5 h-5" />, desc: "Securing vital intel memory" },
    { threshold: 75000, label: "High-Yield Frontier", icon: <Target className="w-5 h-5" />, desc: "Extracting pure core data" },
    { threshold: 115000, label: "Mock Warfare District", icon: <Crosshair className="w-5 h-5" />, desc: "Engaging in simulated combat" },
    { threshold: 165000, label: "Critical Descent", icon: <ShieldAlert className="w-5 h-5" />, desc: "Navigating extreme cognitive load" },
    { threshold: 220000, label: "Final Extraction Route", icon: <MapIcon className="w-5 h-5" />, desc: "The sprint to the evac zone" },
    { threshold: 275000, label: "NEET PG Extraction Point", icon: <ShieldCheck className="w-5 h-5" />, desc: "Mission parameter achieved" }
  ];

  let currentLevel = 0;
  for (let i = 0; i < milestones.length; i++) {
    if (stats.xp >= milestones[i].threshold) {
      currentLevel = i;
    }
  }

  const nextThreshold = milestones[Math.min(currentLevel + 1, milestones.length - 1)].threshold;
  const prevThreshold = milestones[currentLevel].threshold;
  
  let progressToNext = 100;
  if (nextThreshold !== prevThreshold) {
      progressToNext = Math.max(0, Math.min(100, ((stats.xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl flex flex-col shadow-2xl relative overflow-hidden h-[85vh] min-h-[600px] font-mono">
      {/* Hostile Territory Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,1)_100%)]"></div>

      {/* Header Overlay */}
      <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 p-6 bg-slate-900/80 backdrop-blur-md">
        <div>
           <h3 className="text-xl font-black text-cyan-500 uppercase tracking-widest flex items-center gap-3">
             <MapPin className="w-6 h-6 animate-pulse" /> Map Tracker System (Refined)
           </h3>
           <p className="text-[10px] text-cyan-400/70 font-semibold tracking-widest mt-2 uppercase">Live Operator Location & Route Status // Destination: {stats.targetSpecialty}</p>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Total XP Yield</span>
             <span className="text-2xl font-black text-white">{stats.xp} <span className="text-sm font-bold text-cyan-500">XP</span></span>
           </div>
        </div>
      </div>

      {/* Vertical Scrolling Route */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 md:p-12">
         <div className="max-w-2xl mx-auto relative pb-24">
            
            {/* The Main Route Pathway Tube */}
            <div className="absolute left-10 md:left-1/2 top-4 bottom-0 w-2 -translate-x-1/2 bg-slate-900 rounded-full z-0 overflow-hidden shadow-inner border border-slate-800">
               <div className="absolute top-0 left-0 right-0 transition-all duration-1000 ease-out" style={{ 
                   height: `${(currentLevel / (milestones.length - 1)) * 100}%`,
                   background: 'linear-gradient(to bottom, #06b6d4, #a855f7)',
                   boxShadow: '0 0 20px rgba(34,211,238,0.5)'
               }}></div>
            </div>

            <div className="flex flex-col gap-16 md:gap-24 relative z-10">
               {milestones.map((m, idx) => {
                  const isCompleted = idx < currentLevel;
                  const isCurrent = idx === currentLevel;
                  const isLocked = idx > currentLevel;

                  return (
                     <div key={idx} className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                        
                        {/* Empty Space for Grid Alignment on Desktop */}
                        <div className="flex-1 hidden md:block">
                           {/* Add connector line to center on desktop */}
                           <div className={`h-px w-1/2 absolute top-1/2 -translate-y-1/2 ${idx % 2 === 0 ? 'right-1/2 border-r-0' : 'left-1/2 border-l-0'} border-dashed ${isCompleted ? 'border-cyan-500/50' : 'border-slate-800'}`}></div>
                        </div>

                        {/* Node Icon on the Path */}
                        <div className={`relative group ${isCurrent ? 'z-30' : 'z-20'}`}>
                           {isCurrent && (
                              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                           )}
                           <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex justify-center items-center shadow-xl transition-colors duration-500 bg-slate-950 ${
                              isCurrent ? 'border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 
                              isCompleted ? 'border-purple-500/50 text-purple-400' : 'border-slate-800 text-slate-700 dark:text-slate-300'
                           }`}>
                              {m.icon}
                              
                              {/* Central Avatar Marker for current location */}
                              {isCurrent && (
                                 <div className="absolute inset-0 rounded-full border border-cyan-200 animate-ping opacity-20"></div>
                              )}
                           </div>
                        </div>

                        {/* Milestone Card */}
                        <div className={`flex-1 w-full bg-slate-900/90 backdrop-blur p-6 border rounded-xl transition-all duration-500 relative z-20 ${
                           isCurrent ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.15)] scale-105' : 
                           isCompleted ? 'border-slate-700/50 opacity-80' : 'border-slate-800 opacity-40 grayscale'
                        }`}>
                           <span className={`text-[10px] font-black tracking-widest uppercase mb-2 block ${
                              isCurrent ? 'text-cyan-400' : isCompleted ? 'text-purple-400' : 'text-slate-600 dark:text-slate-400'
                           }`}>
                              Sector 0{idx + 1} {isCurrent && "[ACTIVE COMBAT ZONE]"}
                           </span>
                           <h4 className={`text-xl font-black tracking-wide uppercase ${isLocked ? 'text-slate-500' : 'text-slate-100'}`}>
                              {m.label}
                           </h4>
                           <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide leading-relaxed">
                              {m.desc}
                           </p>
                           
                           {isCurrent && (
                              <div className="mt-5 pt-5 border-t border-slate-800/50">
                                 <div className="flex justify-between items-center text-[10px] mb-2 font-black uppercase tracking-widest text-slate-500">
                                    <span>Sector Infiltration</span>
                                    <span className="text-cyan-400">{Math.round(progressToNext)}%</span>
                                 </div>
                                 <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div>
                                 </div>
                                 <div className="mt-4 flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                                    <span className="text-[10px] text-cyan-400 tracking-widest uppercase font-bold">Doctor Avatar: En Route</span>
                                 </div>
                              </div>
                           )}
                           
                           {isCompleted && (
                              <div className="mt-5 pt-4 border-t border-slate-800/50 flex flex-col gap-2">
                                 <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Sector Cleared & Secured
                                 </div>
                              </div>
                           )}
                           {isLocked && (
                               <div className="mt-5 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                  Requires {m.threshold} XP to Unlock
                               </div>
                           )}
                        </div>

                     </div>
                  )
               })}
            </div>

         </div>
      </div>
    </div>
  );
}
