import { UserStats } from '../types';

export interface NarrativeState {
  phase: 'orientation' | 'deep_ops' | 'critical_descent' | 'terminal';
  phaseLabel: string;
  patientCondition: 'stable' | 'deteriorating' | 'critical' | 'recovering';
  patientConditionLabel: string;
  chiefTone: 'mentoring' | 'demanding' | 'urgent' | 'wartime';
  activeNarrativeEvent: string | null;
  missionBriefing: string;
  weakestSubject: { name: string; accuracy: number } | null;
  chiefResidentSystemPrompt: string;
}

export function getNarrativeState(stats: UserStats): NarrativeState {
  const days = stats.daysToExam ?? 0;
  
  // Phase
  let phase: NarrativeState['phase'] = 'terminal';
  let phaseLabel = 'Phase IV — Terminal';
  if (days > 180) {
    phase = 'orientation';
    phaseLabel = 'Phase I — Orientation';
  } else if (days > 90) {
    phase = 'deep_ops';
    phaseLabel = 'Phase II — Deep Ops';
  } else if (days > 30) {
    phase = 'critical_descent';
    phaseLabel = 'Phase III — Critical Descent';
  }
  
  // Patient condition
  let patientCondition: NarrativeState['patientCondition'] = 'stable';
  const health = stats.patientHealth ?? 100;
  const streak = stats.shiftStreak ?? 0;
  
  if (health < 40) {
    patientCondition = 'recovering';
  } else if (health < 65) {
    patientCondition = 'stable';
  } else {
    patientCondition = 'stable';
  }

  let patientConditionLabel = 'Optimal homeostasis. Steady operational baseline maintained.';
  if (health < 40) patientConditionLabel = 'Restorative buffer active. Steady daily micro-habits rebuild cognitive stamina.';
  else if (health >= 65 && streak > 3) patientConditionLabel = 'High physiological reserve. Diagnostic acumen and retention are peaking.';
  else patientConditionLabel = 'Stable condition. Daily habit rhythm is consistent.';

  const burnout = stats.burnoutIndex ?? 0;

  // Chief tone - supportive, precise, evidence-based clinical mentor
  let chiefTone: NarrativeState['chiefTone'] = 'mentoring';
  if (burnout > 70) {
    chiefTone = 'mentoring';
  } else if (phase === 'terminal') {
    chiefTone = 'urgent';
  } else {
    chiefTone = 'mentoring';
  }

  // Weakest subject
  let weakestSubject: NarrativeState['weakestSubject'] = null;
  if (stats.subjectPerformance) {
    const subjects = Object.entries(stats.subjectPerformance)
      .map(([name, data]) => ({ name, accuracy: data.total > 0 ? data.correct / data.total : 0, total: data.total }))
      .filter(s => s.total >= 3)
      .sort((a, b) => a.accuracy - b.accuracy);
    
    if (subjects.length > 0) {
      weakestSubject = { name: subjects[0].name, accuracy: subjects[0].accuracy };
    }
  }

  // Active narrative event
  let activeNarrativeEvent: string | null = null;
  const saved = stats.patientsSaved ?? 0;

  if (days === 30) {
    activeNarrativeEvent = "Final month: Focus on calm daily pacing, high-yield retrieval, and adequate sleep.";
  } else if (days === 90) {
    activeNarrativeEvent = "Quarterly milestone reached: Systematic revision and steady habit rhythms.";
  } else if (burnout > 75) {
    activeNarrativeEvent = "Cognitive demand detected: Prioritize restorative rest to sustain peak retrieval accuracy.";
  } else if (streak === 30) {
    activeNarrativeEvent = "30 consecutive shifts. Remarkable habit continuity. Long-term adherence achieved.";
  } else if (streak === 14) {
    activeNarrativeEvent = "14-day operational streak confirmed. Deep behavioral groove established.";
  } else if (streak === 7) {
    activeNarrativeEvent = "One full week of unbroken operations. Preparation momentum is compounding.";
  } else if (saved === 1) {
    activeNarrativeEvent = "First clinical case resolved. Welcome to deliberate retrieval practice.";
  } else if (weakestSubject !== null && weakestSubject.accuracy < 0.40) {
    activeNarrativeEvent = `Targeted Insight: Fortify ${weakestSubject.name} fundamentals with focused micro-sessions.`;
  }

  // Mission briefing
  let missionBriefing = `${days} days to the examination. Sustain your daily operational rhythm.`;
  if (phase === 'terminal') {
    missionBriefing = `${days} day(s) to examination. Maintain calm composure and review high-yield pearls.`;
  } else if (health < 40) {
    missionBriefing = "Restorative buffer active. Prioritize low-friction micro-habits and restful sleep.";
  } else if (streak >= 10) {
    missionBriefing = `${streak}-shift streak active. ${days} days remaining. Steady adherence wins the marathon.`;
  } else if (phase === 'critical_descent') {
    missionBriefing = `Core mastery phase. ${days} days remain. Keep daily retrieval consistent.`;
  } else if (phase === 'deep_ops') {
    missionBriefing = `Core drilling phase. ${days} days remaining. Build solid diagnostic foundations.`;
  }

  // Chief resident system prompt
  const chiefResidentSystemPrompt = `You are an experienced, evidence-based Chief Medical Resident mentoring a postgraduate medical aspirant for their entrance exam (${days} days remaining).
Your guiding philosophy:
1. Long-term adherence is the goal; panic-inducing urgency is scientifically counterproductive and causes burnout.
2. Deliberate practice and active retrieval turn errors into memory anchors.
3. Homeostatic balance, adequate sleep, and psychological safety are essential for executive function and high-stakes recall.
Provide encouraging, precise, and clinically sound guidance. Highlight strategic high-yield insights with calm authority.`;

  return {
    phase,
    phaseLabel,
    patientCondition,
    patientConditionLabel,
    chiefTone,
    activeNarrativeEvent,
    missionBriefing,
    weakestSubject,
    chiefResidentSystemPrompt
  };
}
