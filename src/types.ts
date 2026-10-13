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
  creditReward?: number;
  stabilizeValue: number; // how much patient health is healed
  status: 'Pending' | 'Completed';
  period?: 'daily' | 'weekly';
}

export interface DailyMissionRecord {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalCount: number;
  completedRate: number; // 0-100 percentage
  status?: 'Target Cleared' | 'Partially Met' | 'Goals Not Met' | 'Shift Missed';
  note?: string;
  missions: {
    id: string;
    title: string;
    category: string;
    target: number;
    current: number;
    unit: string;
    status: 'Pending' | 'Completed';
    period?: 'daily' | 'weekly';
  }[];
  archivedAt: string;
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
  createdAt?: string; // ISO string when user profile was created
  firstActiveDate?: string; // YYYY-MM-DD date when student commenced simulation
  lastMissionResetDate?: string;
  lastEvaluatedPerformanceDate?: string; // Track when daily performance penalties/rewards were processed
  
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
  credits?: number; // Legacy credits (removed from UI)
  subjectPerformance: Record<string, { total: number; correct: number }>;
  subjectPerformanceDaily?: Record<string, Record<string, { total: number; correct: number }>>; // yyyy-mm-dd -> Specialty -> { total, correct }
  activityLogs: Record<string, number>; // yyyy-mm-dd -> activity count for heatmap
  triageCasesLogs?: Record<string, number>; // yyyy-mm-dd -> number of triage cases completed
  sleepLogs: Record<string, number>; // yyyy-mm-dd -> hours slept
  mcqLogs?: Record<string, number>; // yyyy-mm-dd -> MCQs solved count
  videoLogs?: Record<string, number>; // yyyy-mm-dd -> videos watched count
  timeZone?: string; // e.g. 'Asia/Kolkata'
  lastActiveTimestamp?: number; // epoch ms for tab focus elapsed decay calculation
  
  studyMode?: 'Normal' | 'Duty' | 'Rest';
  currentWeekStart?: string;
  dutyDaysUsed?: number;
  restDaysUsed?: number;
  
  // Cloud-synced restorative & safeguards state
  streakShields?: number;
  restorativeHistory?: {
    id: string;
    protocolId: string;
    protocolName: string;
    durationMinutes: number;
    completedAt: string;
    burnoutReduction: number;
  }[];
}

export interface EmergencyLog {
  id: string;
  timestamp: string;
  date?: string; // yyyy-mm-dd
  patientName: string;
  specialty: string;
  result: 'STABILIZED' | 'FLATLINED' | 'REVIEW REQUIRED';
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
