import type { WorkoutLog } from '../types';
import { getSessionVolume } from './getPRs';

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

function computeStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = logs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const uniqueDates: Date[] = [];
  const seen = new Set<string>();
  for (const log of sorted) {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }
  if (uniqueDates.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffFromToday = (today.getTime() - uniqueDates[0].getTime()) / (1000 * 60 * 60 * 24);
  if (diffFromToday > 2) return 0;
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = (uniqueDates[i - 1].getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24);
    if (gap <= 2) streak++;
    else break;
  }
  return streak;
}

function countTotalPRs(logs: WorkoutLog[]): number {
  // A "PR" is any set that is the heaviest-weight set logged for that exercise up to that point.
  const bestByExercise: Record<string, number> = {};
  let prCount = 0;
  const sorted = logs.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const log of sorted) {
    for (const exLog of log.exercises) {
      for (const set of exLog.sets) {
        const best = bestByExercise[exLog.exerciseId] ?? 0;
        if (set.weight > best) {
          bestByExercise[exLog.exerciseId] = set.weight;
          prCount++;
        }
      }
    }
  }
  return prCount;
}

function totalVolume(logs: WorkoutLog[]): number {
  return logs.reduce((sum, log) => sum + getSessionVolume(log), 0);
}

export function getAchievements(logs: WorkoutLog[]): Achievement[] {
  const streak = computeStreak(logs);
  const workoutCount = logs.length;
  const prCount = countTotalPRs(logs);
  const volume = totalVolume(logs);

  return [
    { id: 'streak_7', label: '7-Day Streak', description: 'Work out 7 days in a row', unlocked: streak >= 7 },
    { id: 'streak_30', label: '30-Day Streak', description: 'Work out 30 days in a row', unlocked: streak >= 30 },
    { id: 'streak_100', label: '100-Day Streak', description: 'Work out 100 days in a row', unlocked: streak >= 100 },
    { id: 'workouts_10', label: 'Getting Started', description: 'Log 10 workouts', unlocked: workoutCount >= 10 },
    { id: 'workouts_50', label: 'Committed', description: 'Log 50 workouts', unlocked: workoutCount >= 50 },
    { id: 'workouts_100', label: 'Century Club', description: 'Log 100 workouts', unlocked: workoutCount >= 100 },
    { id: 'workouts_250', label: 'Iron Veteran', description: 'Log 250 workouts', unlocked: workoutCount >= 250 },
    { id: 'pr_first', label: 'First PR', description: 'Hit your first personal record', unlocked: prCount >= 1 },
    { id: 'pr_10', label: 'PR Hunter', description: 'Hit 10 personal records', unlocked: prCount >= 10 },
    { id: 'pr_50', label: 'PR Machine', description: 'Hit 50 personal records', unlocked: prCount >= 50 },
    { id: 'volume_10k', label: 'Warming Up', description: 'Lift 10,000 lbs total', unlocked: volume >= 10000 },
    { id: 'volume_100k', label: 'Heavy Lifter', description: 'Lift 100,000 lbs total', unlocked: volume >= 100000 },
    { id: 'volume_1m', label: 'Iron Mountain', description: 'Lift 1,000,000 lbs total', unlocked: volume >= 1000000 },
  ];
}
