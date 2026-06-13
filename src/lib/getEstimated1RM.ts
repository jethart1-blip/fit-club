import type { SetEntry } from '../types';

export function getEstimated1RM(weight: number, reps: number): number {
  return Math.max(0, Math.round(weight * (1 + reps / 30)));
}

export function getMaxEstimated1RM(setEntries: SetEntry[]): number {
  if (setEntries.length === 0) return 0;
  return Math.max(...setEntries.map(({ weight, reps }) => getEstimated1RM(weight, reps)));
}
