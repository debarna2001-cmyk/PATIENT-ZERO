export interface PatientVitals {
  hr: number; // in bpm
  bp: string; // e.g. "120/80"
  spo2: number; // in %
  temp: number; // in F
}

export interface ClinicalCase {
  id: string;
  specialty: string;
  complexity: 'Critical' | 'Urgent' | 'Stable';
  patientName: string;
  ageGender: string;
  chiefComplaint: string;
  clinicalVignette: string;
  labResults?: string[];
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  highYieldPearl: string; // For rapid NEET PG review
  explanation: string; // Detail on correct and incorrect options
  initialVitals: PatientVitals;
}

export interface Mission {
  id: string;
  title: string;
  category: 'MCQ' | 'Revision' | 'Lectures' | 'Tests' | 'Custom' | 'Triage';
  target: number; // in hours, count, etc.
  current: number;
  unit: string; // e.g., "Questions", "Hours", "Topics"
  xpReward: number;
  creditReward: number;
  stabilizeValue: number; // how much patient health is healed
  status: 'Pending' | 'Completed';
  period?: 'daily' | 'weekly';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeKey: 'first_save' | 'five_streak' | 'pharmacochem' | 'clinical_god' | 'burnout_escape' | 'apex_survivor';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserStats {
  studentName: string;
  targetSpecialty: string;
  targetExamYear: number;
  targetExamDate?: string; // YYYY-MM-DD
  daysToExam: number;
  lastMissionResetDate?: string;
  
  // Game states representing "The Patient" (user's NEET PG study level)
  patientHealth: number; // 0 to 100
  burnoutIndex: number; // 0 to 100
  isStabilizing: boolean;
  
  // High-stakes metric logs
  shiftStreak: number;
  patientsSaved: number;
  patientsFlatlined: number;
  unlockedPearlsCount: number;
  xp: number; // Experience points
  credits: number; // Currencies earned to redeem real-life rewards
  subjectPerformance: Record<string, { total: number; correct: number }>;
  activityLogs: Record<string, number>; // yyyy-mm-dd -> activity count for heatmap
  triageCasesLogs?: Record<string, number>; // yyyy-mm-dd -> number of triage cases completed
  sleepLogs: Record<string, number>; // yyyy-mm-dd -> hours slept
  mcqLogs?: Record<string, number>; // yyyy-mm-dd -> MCQs solved count
  videoLogs?: Record<string, number>; // yyyy-mm-dd -> videos watched count
  
  studyMode?: 'Normal' | 'Duty' | 'Rest';
  currentWeekStart?: string;
  dutyDaysUsed?: number;
  restDaysUsed?: number;
}

export interface EmergencyLog {
  id: string;
  timestamp: string;
  patientName: string;
  specialty: string;
  result: 'STABILIZED' | 'FLATLINED';
  vignette: string;
  userAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  pearl: string;
}

export interface MoodLog {
  timestamp: string;
  ratingValue: number; // 1 to 5 representing mental state
  burnoutObserved: boolean;
  procrastinationTrigger: string;
}

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  icon: string; // lucide icon name or emoji
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  timestamp: string;
  title: string;
}
