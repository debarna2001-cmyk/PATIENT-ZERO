/**
 * Patient Zero Unified Rollover & Archival Engine
 * 
 * Provides an idempotent, consolidated daily and weekly rollover engine
 * shared across offline/guest mode, Firestore cloud sync, tab refocus events,
 * and periodic background intervals.
 * 
 * Rules:
 * 1. Strict Monday midnight rollover aligned with Indian Standard Time (Asia/Kolkata).
 * 2. Capped gentle penalties for multi-day missed gaps (health floor at 35%).
 * 3. Idempotent: once a calendar date or week boundary is evaluated, subsequent
 *    triggers on the same day cannot produce duplicate history, stacked penalties,
 *    or premature resets.
 */

import { UserStats, Mission, DailyMissionRecord } from "../types";
import { getTodayISO, getCurrentMondayISO, getIntermediateISODates, formatDateDMY } from "./dateUtils";
import { Firestore, doc, setDoc, updateDoc } from "firebase/firestore";

export interface RolloverOptions {
  todayISO?: string;
  currentMondayISO?: string;
  defaultMissions?: Mission[];
}

export interface RolloverResult {
  hasChanges: boolean;
  nextStats: UserStats;
  nextMissions: Mission[];
  nextHistory: DailyMissionRecord[];
  archivedRecordsToSave: DailyMissionRecord[];
  missionsToReset: Mission[];
  isNewDay: boolean;
  isNewWeek: boolean;
  summaryMessage?: string;
}

// Session-level execution mutex to eliminate race conditions between
// onSnapshot, window refocus, and periodic timer triggers.
let isRolloverRunning = false;
const sessionArchivedDates = new Set<string>();

/**
 * Pure calculation function for evaluating day/week rollover state transition.
 */
export function computeRolloverTransition(
  stats: UserStats,
  missions: Mission[],
  history: DailyMissionRecord[],
  options?: RolloverOptions
): RolloverResult {
  const today = options?.todayISO || getTodayISO();
  const currentMonday = options?.currentMondayISO || getCurrentMondayISO();
  const prevDate = stats.lastMissionResetDate || today;

  const isNewDay = prevDate !== today;
  const isNewWeek = (stats.currentWeekStart || "") !== currentMonday;

  if (!isNewDay && !isNewWeek) {
    return {
      hasChanges: false,
      nextStats: stats,
      nextMissions: missions,
      nextHistory: history,
      archivedRecordsToSave: [],
      missionsToReset: [],
      isNewDay: false,
      isNewWeek: false
    };
  }

  const nextStats: UserStats = {
    ...stats,
    activityLogs: { ...(stats.activityLogs || {}) },
    sleepLogs: { ...(stats.sleepLogs || {}) }
  };
  let nextMissions = missions.map(m => ({ ...m }));
  const nextHistory = history.map(h => ({
    ...h,
    missions: h.missions ? h.missions.map(m => ({ ...m })) : []
  }));
  const archivedRecordsToSave: DailyMissionRecord[] = [];
  const missionsToReset: Mission[] = [];
  let summaryMessage: string | undefined;

  // 1. Process Day Rollover & Previous Active Day Archival
  if (isNewDay && prevDate !== today) {
    const dailyMissions = nextMissions.filter(m => (m.period || 'daily') === 'daily');
    const completed = dailyMissions.filter(m => m.status === 'Completed').length;
    const total = dailyMissions.length;

    const isRestDay = nextStats.studyMode === 'Rest';
    const isCleared = isRestDay || (total > 0 && completed === total);
    const isPartial = !isRestDay && completed > 0 && !isCleared;
    const status: DailyMissionRecord['status'] = isRestDay 
      ? 'Target Cleared' 
      : isCleared 
        ? 'Target Cleared' 
        : isPartial 
          ? 'Partially Met' 
          : 'Goals Not Met';

    const archiveRecord: DailyMissionRecord = {
      date: prevDate,
      completedCount: isRestDay ? total : completed,
      totalCount: total,
      completedRate: isRestDay ? 100 : (total > 0 ? Math.round((completed / total) * 100) : 0),
      status,
      note: isRestDay 
        ? 'Recovery Rest Day Completed (Objectives Excused)' 
        : isCleared 
          ? 'All daily objectives cleared' 
          : isPartial 
            ? `Shift Partially Met: ${completed} of ${total} Objectives` 
            : `Daily Objectives Not Met on ${formatDateDMY(prevDate)}`,
      missions: nextMissions.map(m => ({ ...m })),
      archivedAt: new Date().toISOString()
    };

    // Insert or update in nextHistory
    const existingIndex = nextHistory.findIndex(r => r.date === prevDate);
    if (existingIndex >= 0) {
      nextHistory[existingIndex] = archiveRecord;
    } else {
      nextHistory.unshift(archiveRecord);
    }
    archivedRecordsToSave.push(archiveRecord);
    sessionArchivedDates.add(prevDate);

    // Allostatic Resilience & sleep bonus accounting
    const yesterdaySleep = nextStats.sleepLogs?.[prevDate] || 0;
    const sleepBonus = yesterdaySleep >= 7 ? 3 : yesterdaySleep > 0 && yesterdaySleep < 5 ? -3 : 0;
    const sleepBurnoutBonus = yesterdaySleep >= 7 ? -5 : yesterdaySleep > 0 && yesterdaySleep < 5 ? 4 : 0;

    if (isRestDay) {
      nextStats.patientHealth = Math.min(100, Math.max(35, nextStats.patientHealth + 8 + sleepBonus));
      nextStats.burnoutIndex = Math.min(100, Math.max(0, nextStats.burnoutIndex - 18 + sleepBurnoutBonus));
      nextStats.shiftStreak = (nextStats.shiftStreak || 0) + 1;
      nextStats.studyMode = 'Normal';
      summaryMessage = "Rest Day Concluded: Neural Baseline Restored (+8% Health)";
    } else if (isCleared) {
      nextStats.patientHealth = Math.min(100, Math.max(35, nextStats.patientHealth + 6 + sleepBonus));
      nextStats.burnoutIndex = Math.min(100, Math.max(0, nextStats.burnoutIndex - 8 + sleepBurnoutBonus));
      nextStats.shiftStreak = (nextStats.shiftStreak || 0) + 1;
      summaryMessage = "Daily Shift Cleared: Objectives Met (+6% Vitals)";
    } else if (isPartial) {
      nextStats.patientHealth = Math.min(100, Math.max(35, nextStats.patientHealth + 2 + sleepBonus));
      nextStats.burnoutIndex = Math.min(100, Math.max(0, nextStats.burnoutIndex - 2 + sleepBurnoutBonus));
      nextStats.shiftStreak = Math.max(1, (nextStats.shiftStreak || 0));
      summaryMessage = "Daily Shift Concluded: Partially Met (+2% Vitals)";
    } else {
      nextStats.patientHealth = Math.min(100, Math.max(35, nextStats.patientHealth - 3 + sleepBonus));
      nextStats.burnoutIndex = Math.min(65, nextStats.burnoutIndex + 4 + sleepBurnoutBonus);
      nextStats.shiftStreak = Math.max(0, (nextStats.shiftStreak || 0) - 1);
      summaryMessage = "Daily Shift Concluded: Pace Calibrated (-3%)";
    }

    // 2. Multi-day Gap Backfill with Capped Gentle Penalties
    const intermediateMissedDates = getIntermediateISODates(prevDate, today);
    if (intermediateMissedDates.length > 0) {
      const dailyDefaults = (options?.defaultMissions || nextMissions).filter(m => (m.period || 'daily') === 'daily');

      intermediateMissedDates.forEach(missedDate => {
        const found = nextHistory.findIndex(r => r.date === missedDate);
        if (found === -1) {
          const missedRecord: DailyMissionRecord = {
            date: missedDate,
            completedCount: 0,
            totalCount: dailyDefaults.length,
            completedRate: 0,
            status: 'Shift Missed',
            note: `Shift Missed on ${formatDateDMY(missedDate)}`,
            missions: dailyDefaults.map(m => ({ ...m, current: 0, status: 'Pending' })),
            archivedAt: new Date().toISOString()
          };
          nextHistory.push(missedRecord);
          archivedRecordsToSave.push(missedRecord);
          sessionArchivedDates.add(missedDate);
        }

        if (nextStats.activityLogs[missedDate] === undefined) {
          nextStats.activityLogs[missedDate] = 0;
        }
      });

      // Capped gentle penalties: -3% reserve and +3% burnout per missed day,
      // capped at max 12% total drain with a strict 35% health floor
      const missedCount = intermediateMissedDates.length;
      const cappedDrain = Math.min(12, missedCount * 3);
      const cappedBurnoutInc = Math.min(12, missedCount * 3);
      const streakLoss = Math.min(missedCount, nextStats.shiftStreak || 0);

      nextStats.patientHealth = Math.max(35, nextStats.patientHealth - cappedDrain);
      nextStats.burnoutIndex = Math.min(65, nextStats.burnoutIndex + cappedBurnoutInc);
      nextStats.shiftStreak = Math.max(0, (nextStats.shiftStreak || 0) - streakLoss);
    }

    // Sort history newest first
    nextHistory.sort((a, b) => b.date.localeCompare(a.date));
  }

  // 3. Reset Daily and Weekly Missions
  nextMissions = nextMissions.map(m => {
    const period = m.period || 'daily';
    const shouldReset = (isNewDay && period === 'daily') || (isNewWeek && period === 'weekly');
    if (shouldReset) {
      const resetMission: Mission = { ...m, current: 0, status: 'Pending' };
      missionsToReset.push(resetMission);
      return resetMission;
    }
    return m;
  });

  // 4. Update Weekly Markers
  if (isNewWeek) {
    nextStats.currentWeekStart = currentMonday;
    nextStats.dutyDaysUsed = 0;
    nextStats.restDaysUsed = 0;
    if (summaryMessage) {
      summaryMessage += " | Weekly Objectives Reset (Monday IST)";
    } else {
      summaryMessage = "Weekly Objectives Reset Aligned to Monday Midnight IST";
    }
  }

  // 5. Update lastMissionResetDate
  nextStats.lastMissionResetDate = today;

  return {
    hasChanges: true,
    nextStats,
    nextMissions,
    nextHistory,
    archivedRecordsToSave,
    missionsToReset,
    isNewDay,
    isNewWeek,
    summaryMessage
  };
}

export interface ExecuteRolloverParams {
  stats: UserStats;
  missions: Mission[];
  history: DailyMissionRecord[];
  options?: RolloverOptions;
  authUser?: { uid: string } | null;
  db?: Firestore | null;
  isGuest?: boolean;
  onApplyState: (nextStats: UserStats, nextMissions: Mission[], nextHistory: DailyMissionRecord[]) => void;
  onNotify?: (message: string) => void;
}

/**
 * Orchestrator function: Acquires runtime lock, computes transition,
 * updates local storage & React state, and persists to Firestore if authenticated.
 */
export async function executeUnifiedRollover({
  stats,
  missions,
  history,
  options,
  authUser,
  db,
  isGuest = false,
  onApplyState,
  onNotify
}: ExecuteRolloverParams): Promise<RolloverResult | null> {
  if (isRolloverRunning) {
    return null;
  }

  const today = options?.todayISO || getTodayISO();
  const currentMonday = options?.currentMondayISO || getCurrentMondayISO();
  const prevDate = stats.lastMissionResetDate || today;

  // Short-circuit if already updated
  if (prevDate === today && (stats.currentWeekStart || "") === currentMonday) {
    return null;
  }

  isRolloverRunning = true;
  try {
    const result = computeRolloverTransition(stats, missions, history, options);
    if (!result.hasChanges) {
      return result;
    }

    // 1. Immediately update React state to prevent UI lag or duplicate calls
    onApplyState(result.nextStats, result.nextMissions, result.nextHistory);

    // 2. Persist locally to localStorage
    localStorage.setItem("patient_zero_v2_stats", JSON.stringify(result.nextStats));
    localStorage.setItem("patient_zero_v2_missions", JSON.stringify(result.nextMissions));
    localStorage.setItem("patient_zero_v2_mission_history", JSON.stringify(result.nextHistory));

    // 3. Persist to Firestore if user is authenticated and not in guest/sandbox mode
    if (authUser && db && !isGuest) {
      try {
        // Save UserStats updates
        const userRef = doc(db, "users", authUser.uid);
        await updateDoc(userRef, {
          patientHealth: result.nextStats.patientHealth,
          burnoutIndex: result.nextStats.burnoutIndex,
          shiftStreak: result.nextStats.shiftStreak,
          studyMode: result.nextStats.studyMode || 'Normal',
          lastMissionResetDate: result.nextStats.lastMissionResetDate,
          currentWeekStart: result.nextStats.currentWeekStart,
          dutyDaysUsed: result.nextStats.dutyDaysUsed || 0,
          restDaysUsed: result.nextStats.restDaysUsed || 0,
          activityLogs: result.nextStats.activityLogs || {},
          lastActiveTimestamp: Date.now()
        }).catch(err => {
          console.warn("[RolloverEngine] updateDoc user stats warning:", err);
        });

        // Save new archived records to mission_history subcollection
        for (const archiveRec of result.archivedRecordsToSave) {
          const histRef = doc(db, "users", authUser.uid, "mission_history", archiveRec.date);
          await setDoc(histRef, archiveRec, { merge: true }).catch(err => {
            console.warn("[RolloverEngine] setDoc mission_history warning:", err);
          });
        }

        // Reset missions in missions subcollection
        for (const resetM of result.missionsToReset) {
          const mRef = doc(db, "users", authUser.uid, "missions", resetM.id);
          await setDoc(mRef, { ...resetM, current: 0, status: "Pending" }, { merge: true }).catch(err => {
            console.warn("[RolloverEngine] setDoc reset mission warning:", err);
          });
        }
      } catch (cloudErr) {
        console.error("[RolloverEngine] Error persisting rollover to Firestore:", cloudErr);
      }
    }

    // 4. Notify user if appropriate
    if (result.summaryMessage && onNotify) {
      onNotify(result.summaryMessage);
    }

    return result;
  } finally {
    isRolloverRunning = false;
  }
}
