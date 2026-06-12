import { WorkoutLog } from '../types';

export function getSuggestedWeight(
  exerciseId: string,
  programTarget: { targetRepsMin: number; targetRepsMax: number },
  logs: WorkoutLog[]
): number | null {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recentLog = sorted
    .flatMap((log) => log.exercises)
    .find((ex) => ex.exerciseId === exerciseId);

  if (!recentLog) return null;

  const heaviestWeight = Math.max(...recentLog.sets.map((s) => s.weight));

  const setsAtHeaviest = recentLog.sets.filter((s) => s.weight === heaviestWeight);
  const allMetMax = setsAtHeaviest.every((s) => s.reps >= programTarget.targetRepsMax);

  return allMetMax ? heaviestWeight + 5 : heaviestWeight;
}
