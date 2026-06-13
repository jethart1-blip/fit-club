import { useState, useRef } from 'react';
import type { WorkoutLog, Program } from '../types';
import { getWorkoutLogs, getProgram } from '../lib/storage';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { getSessionVolume } from '../lib/getPRs';

function formatDate(isoString: string): string {
  if (!isoString) return 'Unknown date';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const logs: WorkoutLog[] = getWorkoutLogs().sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
const program: Program | null = getProgram();

function getCalendarDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function History() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const logRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function findLogForDate(date: Date): WorkoutLog | undefined {
    return logs.find((log) => {
      const d = new Date(log.date);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
  }

  function jumpToLog(logId: string) {
    setExpandedId(logId);
    setTimeout(() => {
      logRefs.current[logId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-pageBg p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-surface rounded-2xl p-6 mb-4">
            <h1 className="text-2xl font-display text-textPrimary">📅 Workout History</h1>
          </div>
          <div className="bg-surface rounded-2xl p-8 text-center">
            <p className="text-textMuted text-base">No workouts logged yet.</p>
            <p className="text-textMuted text-sm mt-1">Complete a workout to see it here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-surface rounded-2xl p-6">
          <h1 className="text-2xl font-display text-textPrimary">📅 Workout History</h1>
          <p className="text-sm text-textMuted mt-1">{logs.length} workout{logs.length !== 1 ? 's' : ''} logged</p>
        </div>

        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="text-textMuted hover:text-textPrimary text-lg px-2 transition-colors"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-base font-display text-textPrimary">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="text-textMuted hover:text-textPrimary text-lg px-2 transition-colors"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-xs font-semibold text-textMuted py-1">{d}</div>
            ))}
            {getCalendarDays(calendarMonth).map((date, i) => {
              if (!date) return <div key={i} />;
              const log = findLogForDate(date);
              const dayName = log
                ? (program?.days.find((d) => d.id === log.programDayId)?.name ?? log.programDayId)
                : null;
              const isToday = (() => {
                const now = new Date();
                return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
              })();

              return (
                <button
                  key={i}
                  onClick={() => log && jumpToLog(log.id)}
                  disabled={!log}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                    log
                      ? 'bg-accent/20 text-accent font-semibold hover:bg-accent/30 cursor-pointer'
                      : 'text-textMuted cursor-default'
                  } ${isToday ? 'ring-1 ring-accent/50' : ''}`}
                  title={dayName ?? undefined}
                >
                  <span>{date.getDate()}</span>
                  {log && <span className="text-[8px] leading-tight mt-0.5 truncate max-w-full px-0.5">{dayName}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {logs.map((log) => {
          const dayName =
            program?.days.find((d) => d.id === log.programDayId)?.name ?? log.programDayId;
          const isExpanded = expandedId === log.id;

          return (
            <div key={log.id} ref={(el) => { logRefs.current[log.id] = el; }} className="bg-surface rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleExpanded(log.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface2 transition-colors"
              >
                <div>
                  <p className="text-base font-semibold text-textPrimary">{dayName}</p>
                  <p className="text-sm text-textMuted mt-0.5">{formatDate(log.date)}</p>
                  <p className="text-xs text-textMuted mt-1">
                    Volume:{' '}
                    <span className="font-medium text-textPrimary">
                      {getSessionVolume(log).toLocaleString()} lbs
                    </span>
                  </p>
                  {log.durationSeconds !== undefined && (
                    <p className="text-xs text-textMuted mt-1">
                      Duration: <span className="font-medium text-textPrimary">{formatDuration(log.durationSeconds)}</span>
                    </p>
                  )}
                  {log.sessionDifficulty !== undefined && (
                    <p className="text-xs text-textMuted mt-1">
                      Difficulty: <span className="font-medium text-textPrimary">{log.sessionDifficulty}/10</span>
                    </p>
                  )}
                </div>
                <span className="text-textMuted text-lg leading-none select-none">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-surface2 px-5 pb-5 pt-4 space-y-5">
                  {log.exercises.map((exLog) => {
                    const exerciseName =
                      EXERCISE_LIBRARY.find((e) => e.id === exLog.exerciseId)?.name ??
                      'Unknown Exercise';

                    return (
                      <div key={exLog.exerciseId}>
                        <p className="text-sm font-display text-textPrimary mb-2">{exerciseName}</p>
                        <div className="space-y-1">
                          {exLog.sets.map((set) => (
                            <p key={set.setNumber} className="text-sm text-textMuted">
                              <span className="font-medium text-textPrimary">Set {set.setNumber}:</span>{' '}
                              {set.weight} lbs &times; {set.reps} reps
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
