import { 
  ShieldCheck, Heart, Star, Crosshair, Award, BatteryCharging, 
  Flame, Crown, Zap, BrainCircuit, Medal, Activity, Trophy, 
  CheckCircle2, Sparkles, Compass, ShieldAlert, HeartPulse, 
  Stethoscope, Clock, Shield, Target, BookOpen, UserCheck
} from "lucide-react";
import React from "react";
import { UserStats, EmergencyLog } from "../types";

export type AchievementCategory = 
  | "clinical_saves" 
  | "streak_cadence" 
  | "xp_knowledge" 
  | "resilience_vitals" 
  | "triage_protocols";

export interface UnifiedAchievement {
  id: string;
  level: number;
  title: string;
  category: AchievementCategory;
  categoryLabel: string;
  desc: string;
  sealTier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  icon: React.ReactNode;
  checkUnlocked: (stats: UserStats, logs?: EmergencyLog[]) => boolean;
  getProgress: (stats: UserStats, logs?: EmergencyLog[]) => { current: number; target: number; unit: string };
}

const getTotalTriageCases = (s: UserStats): number => {
  return Object.values(s.triageCasesLogs || {}).reduce((a, b) => a + b, 0);
};

const getTotalMcqs = (s: UserStats): number => {
  return Object.values(s.mcqLogs || {}).reduce((a, b) => a + b, 0);
};

const getTotalModules = (s: UserStats): number => {
  return Object.values(s.videoLogs || {}).reduce((a, b) => a + b, 0);
};

export const UNIFIED_ACHIEVEMENTS: UnifiedAchievement[] = [
  // ==========================================
  // TIER 1: BRONZE SEALS (Month 1: Orientation & Foundation)
  // ==========================================
  {
    id: "seal-lvl-1",
    level: 1,
    title: "First Diagnostic Save",
    category: "clinical_saves",
    categoryLabel: "Clinical Saves",
    desc: "Successfully stabilize your first critical patient on the simulation deck.",
    sealTier: "Bronze",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    checkUnlocked: (s) => (s.patientsSaved || 0) >= 1,
    getProgress: (s) => ({ current: Math.min(s.patientsSaved || 0, 1), target: 1, unit: "save" })
  },
  {
    id: "seal-lvl-2",
    level: 2,
    title: "Habit Anchor",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Hold a disciplined 7-day uninterrupted clinical shift streak.",
    sealTier: "Bronze",
    icon: <BatteryCharging className="w-5 h-5 text-amber-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 7,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 7), target: 7, unit: "days" })
  },
  {
    id: "seal-lvl-3",
    level: 3,
    title: "Intern Induction",
    category: "xp_knowledge",
    categoryLabel: "Knowledge Base",
    desc: "Amass 5,000 total preparation experience points (XP).",
    sealTier: "Bronze",
    icon: <BookOpen className="w-5 h-5 text-cyan-500" />,
    checkUnlocked: (s) => (s.xp || 0) >= 5000,
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 5000), target: 5000, unit: "XP" })
  },
  {
    id: "seal-lvl-4",
    level: 4,
    title: "Perfect Vitals",
    category: "resilience_vitals",
    categoryLabel: "Resilience",
    desc: "Stabilize patient condition to 100% optimum health.",
    sealTier: "Bronze",
    icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
    checkUnlocked: (s) => (s.patientHealth || 0) >= 100,
    getProgress: (s) => ({ current: Math.min(s.patientHealth || 0, 100), target: 100, unit: "%" })
  },
  {
    id: "seal-lvl-5",
    level: 5,
    title: "Triage Reflex",
    category: "triage_protocols",
    categoryLabel: "Triage Reflex",
    desc: "Complete at least 15 clinical triage evaluation cases.",
    sealTier: "Bronze",
    icon: <Activity className="w-5 h-5 text-blue-500" />,
    checkUnlocked: (s) => getTotalTriageCases(s) >= 15 || (s.patientsSaved || 0) >= 10,
    getProgress: (s) => {
      const val = Math.max(getTotalTriageCases(s), s.patientsSaved || 0);
      return ({ current: Math.min(val, 15), target: 15, unit: "cases" });
    }
  },
  {
    id: "seal-lvl-6",
    level: 6,
    title: "QBank Initiation",
    category: "triage_protocols",
    categoryLabel: "Question Blocks",
    desc: "Solve 500 Marrow MCQs across active shifts.",
    sealTier: "Bronze",
    icon: <Target className="w-5 h-5 text-orange-500" />,
    checkUnlocked: (s) => getTotalMcqs(s) >= 500,
    getProgress: (s) => ({ current: Math.min(getTotalMcqs(s), 500), target: 500, unit: "MCQs" })
  },

  // ==========================================
  // TIER 2: SILVER SEALS (Months 2 to 4: Ward Routine & Traction)
  // ==========================================
  {
    id: "seal-lvl-7",
    level: 7,
    title: "Ward Responder",
    category: "xp_knowledge",
    categoryLabel: "Knowledge Base",
    desc: "Surpass 18,000 XP in medical knowledge and question blocks.",
    sealTier: "Silver",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    checkUnlocked: (s) => (s.xp || 0) >= 18000,
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 18000), target: 18000, unit: "XP" })
  },
  {
    id: "seal-lvl-8",
    level: 8,
    title: "Fortnight Stamina",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Sustain a 14-day continuous clinical study streak.",
    sealTier: "Silver",
    icon: <Award className="w-5 h-5 text-violet-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 14,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 14), target: 14, unit: "days" })
  },
  {
    id: "seal-lvl-9",
    level: 9,
    title: "Clinical Triage Regular",
    category: "triage_protocols",
    categoryLabel: "Triage Reflex",
    desc: "Evaluate 50 clinical triage emergency vignettes.",
    sealTier: "Silver",
    icon: <Crosshair className="w-5 h-5 text-indigo-500" />,
    checkUnlocked: (s) => getTotalTriageCases(s) >= 50 || (s.patientsSaved || 0) >= 25,
    getProgress: (s) => {
      const val = Math.max(getTotalTriageCases(s), s.patientsSaved || 0);
      return ({ current: Math.min(val, 50), target: 50, unit: "cases" });
    }
  },
  {
    id: "seal-lvl-10",
    level: 10,
    title: "Video Foundation",
    category: "triage_protocols",
    categoryLabel: "High-Yield Modules",
    desc: "Watch 30 Marrow video lecture modules.",
    sealTier: "Silver",
    icon: <BookOpen className="w-5 h-5 text-purple-500" />,
    checkUnlocked: (s) => getTotalModules(s) >= 30,
    getProgress: (s) => ({ current: Math.min(getTotalModules(s), 30), target: 30, unit: "modules" })
  },
  {
    id: "seal-lvl-11",
    level: 11,
    title: "Resuscitation Veteran",
    category: "clinical_saves",
    categoryLabel: "Clinical Saves",
    desc: "Record 30 critical patient saves in your clinical log.",
    sealTier: "Silver",
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    checkUnlocked: (s) => (s.patientsSaved || 0) >= 30,
    getProgress: (s) => ({ current: Math.min(s.patientsSaved || 0, 30), target: 30, unit: "saves" })
  },
  {
    id: "seal-lvl-12",
    level: 12,
    title: "QBank Traction",
    category: "triage_protocols",
    categoryLabel: "Question Blocks",
    desc: "Complete 2,500 Marrow MCQs: diagnostic intuition begins crystallizing.",
    sealTier: "Silver",
    icon: <Star className="w-5 h-5 text-amber-500" />,
    checkUnlocked: (s) => getTotalMcqs(s) >= 2500,
    getProgress: (s) => ({ current: Math.min(getTotalMcqs(s), 2500), target: 2500, unit: "MCQs" })
  },
  {
    id: "seal-lvl-13",
    level: 13,
    title: "Monthly Habit Lock",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Achieve a full 30-day unbroken study streak (~1 full month of clinical cadence).",
    sealTier: "Silver",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 30,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 30), target: 30, unit: "days" })
  },

  // ==========================================
  // TIER 3: GOLD SEALS (Months 4 to 7: ICU Controller & Core Endurance)
  // ==========================================
  {
    id: "seal-lvl-14",
    level: 14,
    title: "ICU Controller",
    category: "xp_knowledge",
    categoryLabel: "Knowledge Base",
    desc: "Accumulate 60,000 preparation XP: Specialty clinical autonomy unlocked.",
    sealTier: "Gold",
    icon: <BrainCircuit className="w-5 h-5 text-purple-500" />,
    checkUnlocked: (s) => (s.xp || 0) >= 60000,
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 60000), target: 60000, unit: "XP" })
  },
  {
    id: "seal-lvl-15",
    level: 15,
    title: "60-Day Unbroken Cadence",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Hold a disciplined 60-day streak: 2 continuous months of daily preparation.",
    sealTier: "Gold",
    icon: <Crown className="w-5 h-5 text-amber-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 60,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 60), target: 60, unit: "days" })
  },
  {
    id: "seal-lvl-16",
    level: 16,
    title: "Diagnostic Acumen",
    category: "clinical_saves",
    categoryLabel: "Clinical Saves",
    desc: "Stabilize 100 critical patients across challenging ward vignettes.",
    sealTier: "Gold",
    icon: <Stethoscope className="w-5 h-5 text-emerald-500" />,
    checkUnlocked: (s) => (s.patientsSaved || 0) >= 100,
    getProgress: (s) => ({ current: Math.min(s.patientsSaved || 0, 100), target: 100, unit: "saves" })
  },
  {
    id: "seal-lvl-17",
    level: 17,
    title: "Curriculum Progression",
    category: "triage_protocols",
    categoryLabel: "High-Yield Modules",
    desc: "Watch 100 Marrow video lecture modules.",
    sealTier: "Gold",
    icon: <Medal className="w-5 h-5 text-sky-500" />,
    checkUnlocked: (s) => getTotalModules(s) >= 100,
    getProgress: (s) => ({ current: Math.min(getTotalModules(s), 100), target: 100, unit: "modules" })
  },
  {
    id: "seal-lvl-18",
    level: 18,
    title: "QBank Endurance",
    category: "triage_protocols",
    categoryLabel: "Question Blocks",
    desc: "Solve 7,500 Marrow MCQs: deep question bank coverage across all 19 subjects.",
    sealTier: "Gold",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    checkUnlocked: (s) => getTotalMcqs(s) >= 7500,
    getProgress: (s) => ({ current: Math.min(getTotalMcqs(s), 7500), target: 7500, unit: "MCQs" })
  },
  {
    id: "seal-lvl-19",
    level: 19,
    title: "Triage Centurion",
    category: "triage_protocols",
    categoryLabel: "Triage Reflex",
    desc: "Successfully resolve 150 clinical emergency triage cases.",
    sealTier: "Gold",
    icon: <Sparkles className="w-5 h-5 text-teal-500" />,
    checkUnlocked: (s) => getTotalTriageCases(s) >= 150 || (s.patientsSaved || 0) >= 120,
    getProgress: (s) => {
      const val = Math.max(getTotalTriageCases(s), s.patientsSaved || 0);
      return ({ current: Math.min(val, 150), target: 150, unit: "cases" });
    }
  },
  {
    id: "seal-lvl-20",
    level: 20,
    title: "Quarterly Residency Pillar",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Sustain an unshakeable 90-day streak: 3 continuous months without missing a shift.",
    sealTier: "Gold",
    icon: <Flame className="w-5 h-5 text-rose-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 90,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 90), target: 90, unit: "days" })
  },

  // ==========================================
  // TIER 4: PLATINUM SEALS (Months 8 to 11: Senior Resident & Marathon Acumen)
  // ==========================================
  {
    id: "seal-lvl-21",
    level: 21,
    title: "Senior Resident Benchmark",
    category: "xp_knowledge",
    categoryLabel: "Knowledge Base",
    desc: "Attain 120,000 XP in medical knowledge: commanding inpatient department rounds.",
    sealTier: "Platinum",
    icon: <Trophy className="w-5 h-5 text-amber-500" />,
    checkUnlocked: (s) => (s.xp || 0) >= 120000,
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 120000), target: 120000, unit: "XP" })
  },
  {
    id: "seal-lvl-22",
    level: 22,
    title: "150-Day Marathoner",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Complete 150 consecutive shifts (~5 continuous months of daily medical study).",
    sealTier: "Platinum",
    icon: <Clock className="w-5 h-5 text-blue-500" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 150,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 150), target: 150, unit: "days" })
  },
  {
    id: "seal-lvl-23",
    level: 23,
    title: "Trauma Bay Veteran",
    category: "clinical_saves",
    categoryLabel: "Clinical Saves",
    desc: "Stabilize 250 critical patient cases across complex clinical emergencies.",
    sealTier: "Platinum",
    icon: <ShieldAlert className="w-5 h-5 text-emerald-500" />,
    checkUnlocked: (s) => (s.patientsSaved || 0) >= 250,
    getProgress: (s) => ({ current: Math.min(s.patientsSaved || 0, 250), target: 250, unit: "saves" })
  },
  {
    id: "seal-lvl-24",
    level: 24,
    title: "Curriculum Command",
    category: "triage_protocols",
    categoryLabel: "High-Yield Modules",
    desc: "Complete 250 Marrow video modules across pre-clinical, para-clinical, and clinical subjects.",
    sealTier: "Platinum",
    icon: <Award className="w-5 h-5 text-cyan-400" />,
    checkUnlocked: (s) => getTotalModules(s) >= 250,
    getProgress: (s) => ({ current: Math.min(getTotalModules(s), 250), target: 250, unit: "modules" })
  },
  {
    id: "seal-lvl-25",
    level: 25,
    title: "QBank Mastery",
    category: "triage_protocols",
    categoryLabel: "Question Blocks",
    desc: "Surpass 15,000 Marrow MCQs: diagnostic recall is now second nature.",
    sealTier: "Platinum",
    icon: <Target className="w-5 h-5 text-rose-500" />,
    checkUnlocked: (s) => getTotalMcqs(s) >= 15000,
    getProgress: (s) => ({ current: Math.min(getTotalMcqs(s), 15000), target: 15000, unit: "MCQs" })
  },

  // ==========================================
  // TIER 5: DIAMOND SEALS (Months 11 to 14: Chief Residency & Apex Laureate)
  // ==========================================
  {
    id: "seal-lvl-26",
    level: 26,
    title: "Chief Resident Commander",
    category: "xp_knowledge",
    categoryLabel: "Knowledge Base",
    desc: "Accumulate 180,000 XP: Top-tier academic stamina and clinical authority.",
    sealTier: "Diamond",
    icon: <Medal className="w-5 h-5 text-purple-400" />,
    checkUnlocked: (s) => (s.xp || 0) >= 180000,
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 180000), target: 180000, unit: "XP" })
  },
  {
    id: "seal-lvl-27",
    level: 27,
    title: "240-Day Residency Centurion",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Maintain 240 consecutive days of study (~8 continuous months unbroken).",
    sealTier: "Diamond",
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 240,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 240), target: 240, unit: "days" })
  },
  {
    id: "seal-lvl-28",
    level: 28,
    title: "Trauma Director",
    category: "clinical_saves",
    categoryLabel: "Clinical Saves",
    desc: "Resuscitate and stabilize 500 critical patients across grueling shifts.",
    sealTier: "Diamond",
    icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
    checkUnlocked: (s) => (s.patientsSaved || 0) >= 500,
    getProgress: (s) => ({ current: Math.min(s.patientsSaved || 0, 500), target: 500, unit: "saves" })
  },
  {
    id: "seal-lvl-29",
    level: 29,
    title: "300-Day Clinical Pillar",
    category: "streak_cadence",
    categoryLabel: "Consistency",
    desc: "Attain 300 days of continuous shift discipline (~10 full months of unbroken preparation).",
    sealTier: "Diamond",
    icon: <Flame className="w-5 h-5 text-rose-400" />,
    checkUnlocked: (s) => (s.shiftStreak || 0) >= 300,
    getProgress: (s) => ({ current: Math.min(s.shiftStreak || 0, 300), target: 300, unit: "days" })
  },
  {
    id: "seal-lvl-30",
    level: 30,
    title: "Grand Rounds Laureate & NEET PG Apex",
    category: "xp_knowledge",
    categoryLabel: "Mastery Pinnacle",
    desc: "Reach 280,000+ XP & 365-day shift streak (or 750+ patient saves). The absolute pinnacle of 12-14 months of medical residency mastery.",
    sealTier: "Diamond",
    icon: <Trophy className="w-5 h-5 text-purple-400" />,
    checkUnlocked: (s) => (s.xp || 0) >= 280000 || ((s.xp || 0) >= 200000 && ((s.shiftStreak || 0) >= 300 || (s.patientsSaved || 0) >= 500)),
    getProgress: (s) => ({ current: Math.min(s.xp || 0, 280000), target: 280000, unit: "XP" })
  }
];
