import type { UserProfile } from '../types';

const BLOCK_LENGTH_WEEKS = 4;
const DELOAD_WEEK = 4;

/**
 * Returns the current week (1-4) within the program's mesocycle block.
 * Week 4 is a deload week; the block repeats after week 4.
 */
export function getMesocycleWeek(profile: UserProfile): number {
  const startDateStr = profile.programStartDate ?? profile.createdAt;
  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) return 1;

  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((now.getTime() - startDate.getTime()) / msPerWeek);

  const weekInBlock = ((weeksElapsed % BLOCK_LENGTH_WEEKS) + BLOCK_LENGTH_WEEKS) % BLOCK_LENGTH_WEEKS;
  return weekInBlock + 1; // 1-indexed
}

export function isDeloadWeek(profile: UserProfile): boolean {
  return getMesocycleWeek(profile) === DELOAD_WEEK;
}
