import type { WorkoutLog } from '../types';

const WEIGHT_INCREMENT = 5;
const BIG_WEIGHT_INCREMENT = 10;
const HIGH_RPE_THRESHOLD = 9.5;
const LOW_RPE_THRESHOLD = 7;

export function getSuggestedWeight(
  exerciseId: string,
  programTarget: { targetRepsMin: number; targetRepsMax: number },
  logs: WorkoutLog[]
): number | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Collect the most recent sessions (up to 3) that include this exercise
  const recentLogs: WorkoutLog['exercises'][number][] = [];
  for (const log of sorted) {
    const match = log.exercises.find((ex) => ex.exerciseId === exerciseId);
    if (match) {
      recentLogs.push(match);
      if (recentLogs.length >= 3) break;
    }
  }

  if (recentLogs.length === 0) return null;

  const mostRecent = recentLogs[0];
  if (mostRecent.sets.length === 0) return null;

  const lastSetWeight = mostRecent.sets[mostRecent.sets.length - 1].weight;

  const allHitMax = mostRecent.sets.every(
    (s) => s.reps >= programTarget.targetRepsMax
  );

  const anyHighRpe = mostRecent.sets.some(
    (s) => s.rpe !== undefined && s.rpe >= HIGH_RPE_THRESHOLD
  );

  if (!allHitMax || anyHighRpe) {
    return lastSetWeight;
  }

  // Compute average RPE per session (only for sessions with RPE logged)
  const avgRpes: number[] = [];
  for (const session of recentLogs) {
    const rpes = session.sets
      .map((s) => s.rpe)
      .filter((r): r is number => r !== undefined);
    if (rpes.length > 0) {
      avgRpes.push(rpes.reduce((a, b) => a + b, 0) / rpes.length);
    }
  }

  // Smart Sets: if we have at least 2 sessions of RPE data and RPE has been
  // rising session-over-session (most recent is index 0, so rising means
  // avgRpes[0] > avgRpes[1]), play it safe and hold weight even though they
  // hit the top of the rep range.
  if (avgRpes.length >= 2 && avgRpes[0] > avgRpes[1]) {
    return lastSetWeight;
  }

  // If recent sessions have consistently felt easy (avg RPE <= 7), suggest
  // a bigger jump.
  if (avgRpes.length > 0 && avgRpes.every((r) => r <= LOW_RPE_THRESHOLD)) {
    return lastSetWeight + BIG_WEIGHT_INCREMENT;
  }

  return lastSetWeight + WEIGHT_INCREMENT;
}
