export interface WarmupSet {
  percent: number;
  weight: number;
  reps: number;
}

const WARMUP_STEPS: { percent: number; reps: number }[] = [
  { percent: 0.5, reps: 8 },
  { percent: 0.7, reps: 5 },
  { percent: 0.85, reps: 3 },
];

/**
 * Returns a set of warm-up sets leading up to the target working weight.
 * Weights are rounded to the nearest 5 lbs. Returns an empty array if
 * targetWeight is null, 0, or too small to warrant warm-ups.
 */
export function getWarmupSets(targetWeight: number | null): WarmupSet[] {
  if (targetWeight === null || targetWeight <= 0) return [];
  return WARMUP_STEPS.map(({ percent, reps }) => ({
    percent: Math.round(percent * 100),
    weight: Math.max(0, Math.round((targetWeight * percent) / 5) * 5),
    reps,
  }));
}
