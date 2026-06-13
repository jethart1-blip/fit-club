import { useState, useMemo } from 'react';
import type { WorkoutLog, Program } from '../types';
import { getWorkoutLogs, getProgram } from '../lib/storage';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { getMaxEstimated1RM } from '../lib/getEstimated1RM';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const logs: WorkoutLog[] = getWorkoutLogs();
const program: Program | null = getProgram();

// Oldest-first for the session browser and chart
const logsSortedAsc = logs
  .slice()
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateLong(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Progress() {
  const loggedExercises = useMemo(() => {
    const ids = new Set<string>();
    for (const log of logs) {
      for (const exLog of log.exercises) {
        ids.add(exLog.exerciseId);
      }
    }
    return EXERCISE_LIBRARY.filter((e) => ids.has(e.id));
  }, []);

  const [selectedId, setSelectedId] = useState<string>(
    loggedExercises.length > 0 ? loggedExercises[0].id : ''
  );

  const [sessionIndex, setSessionIndex] = useState<number>(
    logsSortedAsc.length > 0 ? logsSortedAsc.length - 1 : 0
  );

  const chartData = useMemo(() => {
    if (!selectedId) return [];
    return logsSortedAsc.flatMap((log) => {
      const exLog = log.exercises.find((e) => e.exerciseId === selectedId);
      if (!exLog || exLog.sets.length === 0) return [];
      const maxWeight = Math.max(...exLog.sets.map((s) => s.weight));
      const estimated1RM = getMaxEstimated1RM(exLog.sets);
      return [{ date: formatDate(log.date), weight: maxWeight, estimated1RM }];
    });
  }, [selectedId]);

  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].estimated1RM : null;
  const previous1RM = chartData.length > 1 ? chartData[chartData.length - 2].estimated1RM : null;
  const isNewRecord = current1RM !== null && previous1RM !== null && current1RM > previous1RM;

  if (loggedExercises.length === 0) {
    return (
      <div className="min-h-screen bg-pageBg p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-surface rounded-2xl p-6 mb-4">
            <h1 className="text-2xl font-display text-textPrimary">Progress</h1>
          </div>
          <div className="bg-surface rounded-2xl p-8 text-center">
            <p className="text-textMuted text-base">No progress data yet — log a workout first.</p>
          </div>
        </div>
      </div>
    );
  }

  const sessionLog = logsSortedAsc[sessionIndex] ?? null;
  const sessionDayName = sessionLog
    ? (program?.days.find((d) => d.id === sessionLog.programDayId)?.name ?? sessionLog.programDayId)
    : null;

  return (
    <div className="min-h-screen bg-pageBg p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-surface rounded-2xl p-6">
          <h1 className="text-2xl font-display text-textPrimary">Progress</h1>
          <p className="text-sm text-textMuted mt-1">Track your max weight and estimated 1RM over time</p>
        </div>

        {/* Chart section */}
        <div className="bg-surface rounded-2xl p-6 space-y-5">
          <div>
            <label
              htmlFor="exercise-select"
              className="block text-sm font-medium text-textMuted mb-2"
            >
              Exercise
            </label>
            <select
              id="exercise-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-surface2 bg-surface2 px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent transition-colors"
            >
              {loggedExercises.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-surface2 text-textPrimary">
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {chartData.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-6">No data for this exercise.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#363b46" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit=" lb"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #363b46',
                    background: '#2a2e37',
                    fontSize: '0.875rem',
                    color: '#f1f1ef',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value, name) => [
                    `${Number(value)} lb`,
                    name === 'weight' ? 'Max Weight' : 'Est. 1RM',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'weight' ? 'Max Weight' : 'Est. 1RM')}
                  wrapperStyle={{ fontSize: '0.8rem', color: '#9ca3af' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#d4ff4f"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#d4ff4f', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Estimated 1RM summary */}
          {current1RM !== null && (
            <div className="rounded-xl bg-surface2 px-4 py-3 space-y-1">
              <p className="text-sm text-textMuted">
                Current estimated 1RM:{' '}
                <span className="font-semibold text-textPrimary">{current1RM} lbs</span>
              </p>
              {isNewRecord && (
                <p className="text-sm font-medium text-accent2">
                  🎉 New estimated 1RM: {current1RM} lbs — up from {previous1RM}!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Session browser */}
        <div className="bg-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display text-textPrimary">Workout Sessions</h2>

          {logsSortedAsc.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-4">No workout sessions yet.</p>
          ) : (
            <>
              {/* Nav controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSessionIndex((i) => Math.max(0, i - 1))}
                  disabled={sessionIndex === 0}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-surface2 text-textPrimary disabled:opacity-40 hover:bg-surface2/80 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-textMuted">
                  {sessionIndex + 1} / {logsSortedAsc.length}
                </span>
                <button
                  onClick={() => setSessionIndex((i) => Math.min(logsSortedAsc.length - 1, i + 1))}
                  disabled={sessionIndex === logsSortedAsc.length - 1}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-surface2 text-textPrimary disabled:opacity-40 hover:bg-surface2/80 transition-colors"
                >
                  Next →
                </button>
              </div>

              {/* Session detail */}
              {sessionLog && (
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-textPrimary">{sessionDayName}</p>
                    <p className="text-sm text-textMuted mt-0.5">{formatDateLong(sessionLog.date)}</p>
                  </div>

                  <div className="space-y-4">
                    {sessionLog.exercises.map((exLog) => {
                      const exerciseName =
                        EXERCISE_LIBRARY.find((e) => e.id === exLog.exerciseId)?.name ??
                        exLog.exerciseId;

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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
