import React, { useState, useEffect } from "react";
import { Ticket, Gamepad2, Pizza, Music, ShoppingBag } from "lucide-react";
import { RewardItem, RedeemedReward } from "../types";

interface Props {
  credits: number;
  onRedeem: (cost: number) => void;
}

const DEFAULT_REWARDS: RewardItem[] = [
  { id: "r1", title: "1 Hour Netflix Show", cost: 1500, icon: "Ticket" },
  { id: "r2", title: "Play Video Games (45 min)", cost: 1200, icon: "Gamepad2" },
  { id: "r3", title: "Order Fast Food", cost: 3000, icon: "Pizza" },
  { id: "r4", title: "Listen to Music (30 min guilt-free)", cost: 500, icon: "Music" },
];

export default function RewardStore({ credits, onRedeem }: Props) {
  const [rewards, setRewards] = useState<RewardItem[]>(DEFAULT_REWARDS);
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>(() => {
    try {
      const saved = localStorage.getItem("patient_zero_redeemed");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const [newTitle, setNewTitle] = useState("");
  const [newCost, setNewCost] = useState("");

  const handleRedeem = (item: RewardItem) => {
    if (credits < item.cost) return;

    onRedeem(item.cost);

    const log: RedeemedReward = {
      id: `red-${Date.now()}`,
      rewardId: item.id,
      title: item.title,
      timestamp: new Date().toLocaleString()
    };
    const nextRedeemed = [log, ...redeemed];
    setRedeemed(nextRedeemed);
    localStorage.setItem("patient_zero_redeemed", JSON.stringify(nextRedeemed));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCost) return;
    const cost = parseInt(newCost, 10);
    if (isNaN(cost) || cost <= 0) return;

    const newReward: RewardItem = {
      id: `custom-r-${Date.now()}`,
      title: newTitle,
      cost,
      icon: "Gift"
    };

    setRewards([newReward, ...rewards]);
    setNewTitle("");
    setNewCost("");
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Ticket": return <Ticket className="w-6 h-6" />;
      case "Gamepad2": return <Gamepad2 className="w-6 h-6" />;
      case "Pizza": return <Pizza className="w-6 h-6" />;
      case "Music": return <Music className="w-6 h-6" />;
      default: return <ShoppingBag className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-white shadow-md flex justify-center items-center">
             <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Reward Store</h2>
            <p className="text-sm font-medium text-slate-500">Spend your hard-earned credits on real-life activities.</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center min-w-[150px]">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Available Balance</span>
          <span className="text-4xl font-black">{credits}</span>
          <span className="text-xs font-bold text-blue-400">CREDITS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <div className="md:col-span-8 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-500" /> Redemption Catalog
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.map(r => {
              const canAfford = credits >= r.cost;
              return (
                <div key={r.id} className="bg-white dark:bg-slate-900/60 backdrop-blur border border-white/60 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 flex items-center justify-center">
                       {renderIcon(r.icon)}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block leading-tight">{r.title}</span>
                      <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{r.cost} CR</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      canAfford
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Redeem Reward" : "Insufficient Credits"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur border border-white/60 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-base">Add Custom Reward</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reward Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Call My Friend"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Cost (Credits)</label>
                  <input 
                    type="number" 
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="e.g. 500"
                    min="1"
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                  />
               </div>
               <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2.5 rounded-xl shadow-md transition-colors">
                  Create
               </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur border border-white/60 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-base">Redemption Log</h3>
            {redeemed.length === 0 ? (
               <div className="text-center py-6 text-slate-400 text-sm font-medium">No rewards redeemed yet.</div>
            ) : (
               <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                 {redeemed.map(log => (
                   <div key={log.id} className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 flex flex-col">
                     <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{log.title}</span>
                     <span className="text-xs font-medium text-slate-400">{log.timestamp}</span>
                   </div>
                 ))}
               </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
