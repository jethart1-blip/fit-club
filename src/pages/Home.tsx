import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Program, WorkoutLog, MuscleGroupSlot } from '../types';
import { getProfile, getProgram, getWorkoutLogs, getCurrentDayIndex } from '../lib/storage';
import { SPLITS } from '../data/splits';
import { getDaysSinceLastTrained } from '../lib/getPRs';

const MUSCLE_NAMES: Record<MuscleGroupSlot, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  forearms: 'Forearms',
};

const ALL_MUSCLE_GROUPS: MuscleGroupSlot[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'forearms',
];

function getMuscleColor(days: number | null): string {
  if (days === null || days >= 5) return 'bg-surface2 text-textMuted';
  if (days <= 1) return 'bg-red-500/20 text-red-400';
  return 'bg-accent/20 text-accent';
}

function formatMuscleDays(days: number | null): string {
  if (days === null) return '-';
  return `${days}d`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getWeekWorkoutCount(logs: WorkoutLog[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  // Monday as start of week
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - daysSinceMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return logs.filter((log) => {
    const d = new Date(log.date);
    return d >= weekStart && d < weekEnd;
  }).length;
}

function computeStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0;

  const sorted = logs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Deduplicate by calendar date
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

  // Check if the most recent workout was today or yesterday (otherwise streak is broken)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffFromToday = (today.getTime() - uniqueDates[0].getTime()) / (1000 * 60 * 60 * 24);
  if (diffFromToday > 2) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const gap = (uniqueDates[i - 1].getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24);
    if (gap <= 2) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    const p = getProfile();
    const prog = getProgram();
    if (!p || !prog) {
      navigate('/onboarding');
      return;
    }
    setProfile(p);
    setProgram(prog);
    setLogs(getWorkoutLogs());
  }, [navigate]);

  if (!profile || !program) return null;

  const splitName = SPLITS[profile.splitId].name;
  const weekCount = getWeekWorkoutCount(logs);
  const daysPerWeek = profile.daysPerWeek;
  const weekProgress = Math.min(weekCount / daysPerWeek, 1);
  const streak = computeStreak(logs);

  const sortedLogs = logs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastLog = sortedLogs[0] ?? null;
  const lastLogDayName = lastLog
    ? (program.days.find((d) => d.id === lastLog.programDayId)?.name ?? lastLog.programDayId)
    : null;

  const dayIndex = getCurrentDayIndex();
  const nextDay = program.days[dayIndex % program.days.length];
  const muscleRecovery = getDaysSinceLastTrained(logs);

  return (
    <div className="min-h-screen bg-pageBg">
      <div className="max-w-sm mx-auto px-4 pt-10 pb-24 space-y-6">

        {/* Greeting */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-textMuted uppercase tracking-widest">
            {getGreeting()}
          </p>
          <h1 className="text-3xl font-display text-textPrimary leading-tight">
            {splitName}
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">

          {/* This Week */}
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">
                This Week
              </p>
              <span className="text-xs font-display text-accent">{weekCount}/{daysPerWeek}</span>
            </div>
            <p className="text-2xl font-display text-textPrimary leading-none">
              {weekCount}
              <span className="text-sm font-normal text-textMuted ml-1">workouts</span>
            </p>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${weekProgress * 100}%` }}
              />
            </div>
            <p className="text-xs text-textMuted leading-tight">
              {weekCount} of {daysPerWeek} workouts this week
            </p>
          </div>

          {/* Streak */}
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">
                Streak
              </p>
              <span className="text-lg leading-none">🔥</span>
            </div>
            <p className="text-2xl font-display text-textPrimary leading-none">
              {streak}
              <span className="text-sm font-normal text-textMuted ml-1">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </p>
            <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accentWarm transition-all duration-500"
                style={{ width: streak > 0 ? `${Math.min((streak / 7) * 100, 100)}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-textMuted leading-tight">
              {streak > 0 ? `${streak} day streak` : 'Start your streak today'}
            </p>
          </div>
        </div>

        {/* Last Workout */}
        <div className="bg-surface rounded-2xl p-5">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-3">
            Last Workout
          </p>
          {lastLog ? (
            <div className="space-y-1">
              <p className="text-base font-display text-textPrimary">{lastLogDayName}</p>
              <p className="text-sm text-textMuted">{formatDate(lastLog.date)}</p>
            </div>
          ) : (
            <p className="text-sm text-textMuted">
              No workouts logged yet — let's get started!
            </p>
          )}
        </div>

        {/* Up Next */}
        <div className="bg-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">
              Up Next
            </p>
            <p className="text-base font-display text-textPrimary">{nextDay.name}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-lg">
            ▶
          </div>
        </div>

        {/* Muscle Recovery */}
        <div className="bg-surface rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">
            Muscle Recovery
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_MUSCLE_GROUPS.map((slot) => {
              const days = muscleRecovery[slot];
              return (
                <span
                  key={slot}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getMuscleColor(days)}`}
                >
                  {MUSCLE_NAMES[slot]}
                  <span className="opacity-70">{formatMuscleDays(days)}</span>
                </span>
              );
            })}
          </div>
          <p className="text-xs text-textMuted">
            🔴 Recovering · 🟢 Ready · ⚪ Not recently trained
          </p>
        </div>

        {/* Start Workout CTA */}
        <button
          onClick={() => navigate('/today?checkin=1')}
          className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-display font-bold rounded-2xl py-5 text-xl tracking-tight transition-colors shadow-lg shadow-accent/20"
        >
          Start Workout
        </button>

      </div>
    </div>
  );
}
