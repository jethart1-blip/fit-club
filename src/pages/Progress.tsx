import { useState, useMemo } from 'react';
import type { WorkoutLog } from '../types';
import { getWorkoutLogs } from '../lib/storage';
import { EXERCISE_LIBRARY } from '../data/exercises';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const logs: WorkoutLog[] = getWorkoutLogs();

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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

  const chartData = useMemo(() => {
    if (!selectedId) return [];
    return logs
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .flatMap((log) => {
        const exLog = log.exercises.find((e) => e.exerciseId === selectedId);
        if (!exLog || exLog.sets.length === 0) return [];
        const maxWeight = Math.max(...exLog.sets.map((s) => s.weight));
        return [{ date: formatDate(log.date), weight: maxWeight }];
      });
  }, [selectedId]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <p className="text-sm text-gray-500 mt-1">Track your max weight over time</p>
        </div>

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
                  formatter={(value: number) => [`${value} lb`, 'Max Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
