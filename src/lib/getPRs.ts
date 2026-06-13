import type { WorkoutLog, Program, MuscleGroupSlot } from '../types';
import { EXERCISE_LIBRARY } from '../data/exercises';

const ALL_MUSCLE_GROUPS: MuscleGroupSlot[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms',
];

export function getAllTimePR(
  exerciseId: string,
  logs: WorkoutLog[],
): { weight: number; reps: number; date: string } | null {
  let best: { weight: number; reps: number; date: string } | null = null;

  for (const log of logs) {
    const exLog = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exLog) continue;
    for (const set of exLog.sets) {
      if (
        best === null ||
        set.weight > best.weight ||
        (set.weight === best.weight && set.reps > best.reps)
      ) {
        best = { weight: set.weight, reps: set.reps, date: log.date };
      }
    }
  }

  return best;
}

export function getSessionVolume(log: WorkoutLog): number {
  let total = 0;
  for (const exLog of log.exercises) {
    for (const set of exLog.sets) {
      total += set.weight * set.reps;
    }
  }
  return total;
}

export function getWeeklyVolumeByMuscleGroup(
  logs: WorkoutLog[],
  _program: Program,
): Record<MuscleGroupSlot, number> {
  const result = Object.fromEntries(
    ALL_MUSCLE_GROUPS.map((g) => [g, 0]),
  ) as Record<MuscleGroupSlot, number>;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  for (const log of logs) {
    const logDate = new Date(log.date);
    if (logDate < monday || logDate > sunday) continue;

    for (const exLog of log.exercises) {
      const exercise = EXERCISE_LIBRARY.find((e) => e.id === exLog.exerciseId);
      if (!exercise) continue;
      for (const set of exLog.sets) {
        result[exercise.slot] += set.weight * set.reps;
      }
    }
  }

  return result;
}
