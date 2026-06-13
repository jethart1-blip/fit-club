import type { WorkoutLog } from '../types';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { getMaxEstimated1RM } from './getEstimated1RM';

export type Tier = 'Untrained' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

const TIER_THRESHOLDS: { tier: Tier; multiplier: number }[] = [
  { tier: 'Diamond', multiplier: 2 },
  { tier: 'Platinum', multiplier: 1.5 },
  { tier: 'Gold', multiplier: 1 },
  { tier: 'Silver', multiplier: 0.75 },
  { tier: 'Bronze', multiplier: 0.5 },
];

export interface StrengthTierResult {
  lift: string;
  estimated1RM: number;
  tier: Tier;
  nextTier: Tier | null;
  nextTierWeight: number | null;
  progressToNext: number; // 0-1
}

const TRACKED_LIFTS: { label: string; matchNames: string[] }[] = [
  { label: 'Bench Press', matchNames: ['Barbell Bench Press'] },
  { label: 'Back Squat', matchNames: ['Back Squat'] },
  { label: 'Deadlift', matchNames: ['Deadlift'] },
  { label: 'Overhead Press', matchNames: ['Overhead Press'] },
];

export function getStrengthTiers(logs: WorkoutLog[], bodyweightLbs: number): StrengthTierResult[] {
  const results: StrengthTierResult[] = [];

  for (const lift of TRACKED_LIFTS) {
    const exerciseIds = EXERCISE_LIBRARY
      .filter((e) => lift.matchNames.includes(e.name))
      .map((e) => e.id);

    let best1RM = 0;
    for (const log of logs) {
      for (const exLog of log.exercises) {
        if (!exerciseIds.includes(exLog.exerciseId)) continue;
        const max = getMaxEstimated1RM(exLog.sets);
        if (max > best1RM) best1RM = max;
      }
    }

    if (bodyweightLbs <= 0) {
      results.push({
        lift: lift.label,
        estimated1RM: best1RM,
        tier: 'Untrained',
        nextTier: 'Bronze',
        nextTierWeight: null,
        progressToNext: 0,
      });
      continue;
    }

    const ratio = best1RM / bodyweightLbs;

    let tier: Tier = 'Untrained';
    for (const { tier: t, multiplier } of TIER_THRESHOLDS) {
      if (ratio >= multiplier) {
        tier = t;
        break;
      }
    }

    const order: Tier[] = ['Untrained', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentIdx = order.indexOf(tier);
    const nextTier = currentIdx < order.length - 1 ? order[currentIdx + 1] : null;

    let nextTierWeight: number | null = null;
    let progressToNext = 1;
    if (nextTier) {
      const nextMultiplier = TIER_THRESHOLDS.find((t) => t.tier === nextTier)!.multiplier;
      nextTierWeight = Math.round(nextMultiplier * bodyweightLbs);
      const prevMultiplier = currentIdx === 0 ? 0 : TIER_THRESHOLDS.find((t) => t.tier === order[currentIdx])!.multiplier;
      const range = nextMultiplier - prevMultiplier;
      progressToNext = range > 0 ? Math.min(Math.max((ratio - prevMultiplier) / range, 0), 1) : 0;
    }

    results.push({
      lift: lift.label,
      estimated1RM: best1RM,
      tier,
      nextTier,
      nextTierWeight,
      progressToNext,
    });
  }

  return results;
}
