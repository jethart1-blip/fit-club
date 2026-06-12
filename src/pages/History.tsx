import { useState } from 'react';
import type { WorkoutLog, Program } from '../types';
import { getWorkoutLogs, getProgram } from '../lib/storage';
import { EXERCISE_LIBRARY } from '../data/exercises';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const logs: WorkoutLog[] = getWorkoutLogs().sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
const program: Program | null = getProgram();

export function History() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Workout History</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-400 text-base">No workouts logged yet.</p>
            <p className="text-gray-400 text-sm mt-1">Complete a workout to see it here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900">Workout History</h1>
          <p className="text-sm text-gray-500 mt-1">{logs.length} workout{logs.length !== 1 ? 's' : ''} logged</p>
        </div>

        {logs.map((log) => {
          const dayName =
            program?.days.find((d) => d.id === log.programDayId)?.name ?? log.programDayId;
          const isExpanded = expandedId === log.id;

          return (
            <div key={log.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <button
                onClick={() => toggleExpanded(log.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-base font-semibold text-gray-900">{dayName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(log.date)}</p>
                </div>
                <span className="text-gray-400 text-lg leading-none select-none">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">
                  {log.exercises.map((exLog) => {
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
