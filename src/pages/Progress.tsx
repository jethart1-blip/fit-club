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

  // Most recent and previous estimated 1RM for congratulatory note
  const current1RM = chartData.length > 0 ? chartData[chartData.length - 1].estimated1RM : null;
  const previous1RM = chartData.length > 1 ? chartData[chartData.length - 2].estimated1RM : null;
  const isNewRecord = current1RM !== null && previous1RM !== null && current1RM > previous1RM;

  if (loggedExercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-400 text-base">No progress data yet — log a workout first.</p>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Track your max weight and estimated 1RM over time</p>
        </div>

        {/* Chart section */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
          <div>
            <label
              htmlFor="exercise-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Exercise
            </label>
            <select
              id="exercise-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loggedExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>

          {chartData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No data for this exercise.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit=" lb"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} lb`,
                    name === 'weight' ? 'Max Weight' : 'Est. 1RM',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'weight' ? 'Max Weight' : 'Est. 1RM')}
                  wrapperStyle={{ fontSize: '0.8rem' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Estimated 1RM summary */}
          {current1RM !== null && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
              <p className="text-sm text-gray-600">
                Current estimated 1RM:{' '}
                <span className="font-semibold text-gray-900">{current1RM} lbs</span>
              </p>
              {isNewRecord && (
                <p className="text-sm font-medium text-green-600">
                  🎉 New estimated 1RM: {current1RM} lbs — up from {previous1RM}!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Session browser */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Workout Sessions</h2>

          {logsSortedAsc.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No workout sessions yet.</p>
          ) : (
            <>
              {/* Nav controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSessionIndex((i) => Math.max(0, i - 1))}
                  disabled={sessionIndex === 0}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">
                  {sessionIndex + 1} / {logsSortedAsc.length}
                </span>
                <button
                  onClick={() => setSessionIndex((i) => Math.min(logsSortedAsc.length - 1, i + 1))}
                  disabled={sessionIndex === logsSortedAsc.length - 1}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
                >
                  Next →
                </button>
              </div>

              {/* Session detail */}
              {sessionLog && (
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">{sessionDayName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDateLong(sessionLog.date)}</p>
                  </div>

                  <div className="space-y-4">
                    {sessionLog.exercises.map((exLog) => {
                      const exerciseName =
                        EXERCISE_LIBRARY.find((e) => e.id === exLog.exerciseId)?.name ??
                        exLog.exerciseId;

                      return (
                        <div key={exLog.exerciseId}>
                          <p className="text-sm font-semibold text-gray-800 mb-2">{exerciseName}</p>
                          <div className="space-y-1">
                            {exLog.sets.map((set) => (
                              <p key={set.setNumber} className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Set {set.setNumber}:</span>{' '}
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
