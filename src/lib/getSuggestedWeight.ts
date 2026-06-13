import type { WorkoutLog } from '../types';

const WEIGHT_INCREMENT = 5;

export function getSuggestedWeight(
  exerciseId: string,
  programTarget: { targetRepsMin: number; targetRepsMax: number },
  logs: WorkoutLog[]
): number | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let recentLog: WorkoutLog['exercises'][number] | undefined;
  for (const log of sorted) {
    const match = log.exercises.find((ex) => ex.exerciseId === exerciseId);
    if (match) {
      recentLog = match;
      break;
    }
  }

  if (!recentLog || recentLog.sets.length === 0) return null;

  const lastSetWeight = recentLog.sets[recentLog.sets.length - 1].weight;

  const allHitMax = recentLog.sets.every(
    (s) => s.reps >= programTarget.targetRepsMax
  );

  return allHitMax ? lastSetWeight + WEIGHT_INCREMENT : lastSetWeight;
}
