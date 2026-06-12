import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Program, WorkoutLog, ExerciseLog, SetEntry } from '../types';
import {
  getProgram,
  getWorkoutLogs,
  saveWorkoutLog,
  getCurrentDayIndex,
  setCurrentDayIndex,
} from '../lib/storage';
import { getSuggestedWeight } from '../lib/getSuggestedWeight';
import { EXERCISE_LIBRARY } from '../data/exercises';

type SetInputs = { weight: string; reps: string };

export function TodaysWorkout() {
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  // exerciseId → array of set inputs (length = targetSets)
  const [inputs, setInputs] = useState<Record<string, SetInputs[]>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProgram();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    const idx = getCurrentDayIndex();
    const existingLogs = getWorkoutLogs();
    const day = p.days[idx % p.days.length];

    const initialInputs: Record<string, SetInputs[]> = {};
    for (const ex of day.exercises) {
      initialInputs[ex.exerciseId] = Array.from({ length: ex.targetSets }, () => ({
        weight: '',
        reps: '',
      }));
    }

    setProgram(p);
    setDayIndex(idx);
    setLogs(existingLogs);
    setInputs(initialInputs);
  }, [navigate]);

  function updateInput(exerciseId: string, setIdx: number, field: 'weight' | 'reps', value: string) {
    setInputs((prev) => {
      const copy = prev[exerciseId].map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
      return { ...prev, [exerciseId]: copy };
    });
  }

  function handleFinish() {
    if (!program) return;

    const day = program.days[dayIndex % program.days.length];

    const exercises: ExerciseLog[] = day.exercises.flatMap((ex) => {
      const sets: SetEntry[] = (inputs[ex.exerciseId] ?? [])
        .map((s, i) => {
          const w = parseFloat(s.weight);
          const r = parseFloat(s.reps);
          if (!isNaN(w) && !isNaN(r) && s.weight !== '' && s.reps !== '') {
            return { setNumber: i + 1, weight: w, reps: r } satisfies SetEntry;
          }
          return null;
        })
        .filter((s): s is SetEntry => s !== null);

      if (sets.length === 0) return [];
      return [{ exerciseId: ex.exerciseId, sets }];
    });

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      programDayId: day.id,
      exercises,
    };

    saveWorkoutLog(log);
    const nextIndex = (dayIndex + 1) % program.days.length;
    setCurrentDayIndex(nextIndex);
    setSaved(true);
  }

  if (!program) return null;

  const day = program.days[dayIndex % program.days.length];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900">{day.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Today's workout</p>
        </div>

        {day.exercises.map((ex) => {
          const exercise = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
          const name = exercise?.name ?? ex.exerciseId;
          const suggested = getSuggestedWeight(ex.exerciseId, ex, logs);
          const setRows = inputs[ex.exerciseId] ?? [];

          return (
            <div key={ex.exerciseId} className="bg-white rounded-2xl shadow-md p-5 space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{name}</h2>
                <p className="text-sm text-gray-500">
                  {ex.targetSets} sets &times; {ex.targetRepsMin}–{ex.targetRepsMax} reps
                </p>
                {suggested !== null && (
                  <p className="text-sm font-medium text-indigo-600 mt-0.5">
                    Suggested: {suggested} lbs
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-xs font-medium text-gray-400 px-1">
                  <span>Set</span>
                  <span>Weight (lbs)</span>
                  <span>Reps</span>
                </div>
                {setRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 items-center">
                    <span className="text-sm text-gray-400 text-center">{i + 1}</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.weight}
                      onChange={(e) => updateInput(ex.exerciseId, i, 'weight', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.reps}
                      onChange={(e) => updateInput(ex.exerciseId, i, 'reps', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="pb-6">
          {saved ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 font-medium text-sm">
              Workout saved! Great work.
            </div>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Finish Workout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
