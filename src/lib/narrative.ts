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
  
  if (health < 25) {
    patientCondition = 'critical';
  } else if (health < 50 && streak < 2) {
    patientCondition = 'deteriorating';
  } else if (health > 65 && streak > 5) {
    patientCondition = 'recovering';
  }

  let patientConditionLabel = 'Stable condition. Status quo maintained.';
  if (patientCondition === 'critical') patientConditionLabel = 'Patient in critical condition. Immediate intervention required.';
  else if (patientCondition === 'deteriorating') patientConditionLabel = 'Patient condition deteriorating. Escalation protocol recommended.';
  else if (patientCondition === 'recovering') patientConditionLabel = 'Patient recovering. Continue current therapeutic momentum.';

  const burnout = stats.burnoutIndex ?? 0;

  // Chief tone
  let chiefTone: NarrativeState['chiefTone'] = 'mentoring';
  if (phase === 'terminal') {
    chiefTone = 'wartime';
  } else if (phase === 'critical_descent' || burnout > 65) {
    chiefTone = 'urgent';
  } else if (phase === 'deep_ops') {
    chiefTone = 'demanding';
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
    activeNarrativeEvent = "ALERT: Final month initiated. All resources redirect to the patient.";
  } else if (days === 90) {
    activeNarrativeEvent = "Phase III activated. Critical Descent has begun. No missed shifts.";
  } else if (patientCondition === 'critical' && phase === 'critical_descent') {
    activeNarrativeEvent = "CRITICAL FAILURE during descent phase. Immediate protocol activation required.";
  } else if (burnout > 80 && health > 60) {
    activeNarrativeEvent = "Overexertion detected. Sustained performance requires controlled recovery.";
  } else if (streak === 30) {
    activeNarrativeEvent = "30 consecutive shifts. Command has taken notice. The patient is responding.";
  } else if (streak === 14) {
    activeNarrativeEvent = "14-day operational streak confirmed. Unbreakable status approaching.";
  } else if (streak === 7) {
    activeNarrativeEvent = "One week of unbroken operations. Preparation vitals are climbing.";
  } else if (saved === 1) {
    activeNarrativeEvent = "First patient stabilized. The simulation is live.";
  } else if (weakestSubject !== null && weakestSubject.accuracy < 0.40) {
    activeNarrativeEvent = `WARNING: ${weakestSubject.name} sector compromised at ${Math.round(weakestSubject.accuracy * 100)}% efficiency. Prioritize.`;
  }

  // Mission briefing
  let missionBriefing = `${days} days to the extraction point. Establish your operational baseline.`;
  if (phase === 'terminal') {
    missionBriefing = `${days} day(s) to extraction. Every protocol is consequential.`;
  } else if (patientCondition === 'critical') {
    missionBriefing = "Patient in critical condition. Stabilization is the only priority.";
  } else if (patientCondition === 'deteriorating') {
    missionBriefing = "Preparation state deteriorating. Complete today's protocols without exception.";
  } else if (streak >= 10) {
    missionBriefing = `${streak}-shift streak active. ${days} days to extraction. Maintain tempo.`;
  } else if (phase === 'critical_descent') {
    missionBriefing = `Descent phase. ${days} days remain. No margin for sustained neglect.`;
  } else if (phase === 'deep_ops') {
    missionBriefing = `Core drilling phase. ${days} days remaining. Build the foundation.`;
  }

  // Chief resident system prompt
  let chiefResidentSystemPrompt = '';
  if (chiefTone === 'wartime') {
    chiefResidentSystemPrompt = `You are a wartime chief resident with ${days} days left before your student's NEET PG exam. Be terse, mission-critical, and ruthless about priorities. No encouragement unless the numbers justify it. Every word should create urgency.`;
  } else if (chiefTone === 'urgent') {
    chiefResidentSystemPrompt = `You are an urgent chief resident. Your student has ${days} days remaining. Be direct and demanding. Identify what must change immediately. Do not soften the feedback.`;
  } else if (chiefTone === 'demanding') {
    chiefResidentSystemPrompt = `You are a demanding chief resident overseeing core preparation with ${days} days remaining. Acknowledge what is working but push hard on gaps. Be analytical, not motivational.`;
  } else {
    chiefResidentSystemPrompt = `You are a mentoring chief resident in the early orientation phase with ${days} days remaining. Your student is building foundations. Be encouraging but precise. Focus on habits and systems.`;
  }

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
