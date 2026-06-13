import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Program, WorkoutLog, ExerciseLog, SetEntry, ProgramExercise } from '../types';
import {
  getProgram,
  getWorkoutLogs,
  saveWorkoutLog,
  getCurrentDayIndex,
  setCurrentDayIndex,
  swapExercise,
} from '../lib/storage';
import { getSuggestedWeight } from '../lib/getSuggestedWeight';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { MUSCLE_ILLUSTRATIONS } from '../assets/muscles';

type SetInputs = { weight: string; reps: string };

export function TodaysWorkout() {
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, SetInputs[]>>({});
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProgram();
    if (!p) {
      navigate('/onboarding');
      return;
    }
    const rawIdx = getCurrentDayIndex();
    const idx = rawIdx >= p.days.length ? 0 : rawIdx;
    if (rawIdx >= p.days.length) setCurrentDayIndex(0);
    const existingLogs = getWorkoutLogs();
    const day = p.days[idx];

    const initialInputs: Record<string, SetInputs[]> = {};
    for (const ex of day.exercises) {
      const suggested = getSuggestedWeight(ex.exerciseId, ex, existingLogs);
      initialInputs[ex.exerciseId] = Array.from({ length: ex.targetSets }, () => ({
        weight: suggested !== null ? String(suggested) : '',
        reps: '',
      }));
    }

    setProgram(p);
    setDayIndex(idx);
    setLogs(existingLogs);
    setExercises(day.exercises);
    setInputs(initialInputs);
  }, [navigate]);

  // Rest timer countdown – recreates interval each tick; cleans up correctly
  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;
    const id = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restSecondsLeft]);

  function updateInput(exerciseId: string, setIdx: number, field: 'weight' | 'reps', value: string) {
    setInputs((prev) => {
      const copy = (prev[exerciseId] ?? []).map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      );
      return { ...prev, [exerciseId]: copy };
    });
  }

  function handleRepsBlur(exerciseId: string, setIdx: number, restSeconds: number) {
    const row = inputs[exerciseId]?.[setIdx];
    if (row && row.reps !== '') {
      setRestSecondsLeft(restSeconds);
    }
  }

  function handleSwap(ex: ProgramExercise, dayId: string) {
    if (ex.alternativeExerciseIds.length === 0) return;
    const newId = ex.alternativeExerciseIds[0];
    swapExercise(dayId, ex.slot, newId);

    const updatedProgram = getProgram();
    if (!updatedProgram) return;
    const updatedDay = updatedProgram.days.find((d) => d.id === dayId);
    if (!updatedDay) return;

    setProgram(updatedProgram);
    setExercises(updatedDay.exercises);

    // Initialize inputs for the newly visible exercise if not already tracked
    setInputs((prev) => {
      if (prev[newId]) return prev;
      const updatedEx = updatedDay.exercises.find((e) => e.slot === ex.slot);
      if (!updatedEx) return prev;
      const suggested = getSuggestedWeight(newId, updatedEx, logs);
      return {
        ...prev,
        [newId]: Array.from({ length: updatedEx.targetSets }, () => ({
          weight: suggested !== null ? String(suggested) : '',
          reps: '',
        })),
      };
    });
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleFinish() {
    if (!program) return;
    const day = program.days[dayIndex % program.days.length];

    const exerciseLogs: ExerciseLog[] = exercises.flatMap((ex) => {
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
      exercises: exerciseLogs,
    };

    saveWorkoutLog(log);
    setCurrentDayIndex((dayIndex + 1) % program.days.length);
    setSaved(true);
    setTimeout(() => navigate('/history'), 1500);
  }

  if (!program) return null;

  const day = program.days[dayIndex % program.days.length];

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm text-center space-y-3">
          <div className="text-4xl">🏋️</div>
          <p className="text-gray-600 text-sm leading-relaxed">
            No exercises available for this day with your current equipment. Visit Settings to adjust
            your equipment or split.
          </p>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentSlideIndex];
  const exDef = EXERCISE_LIBRARY.find((e) => e.id === exercise.exerciseId);
  const exName = exDef?.name ?? exercise.exerciseId;
  const setRows = inputs[exercise.exerciseId] ?? [];
  const hasAlternatives = exercise.alternativeExerciseIds.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Exercise {currentSlideIndex + 1} of {exercises.length}
          </p>
          <h1 className="text-lg font-bold text-gray-900">{day.name}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlideIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentSlideIndex ? 'bg-indigo-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Go to exercise ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Rest timer banner */}
      {restSecondsLeft !== null && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-base">⏱</span>
            <span className="text-amber-700 font-semibold text-sm">
              Rest: {formatTime(restSecondsLeft)}
            </span>
          </div>
          <button
            onClick={() => setRestSecondsLeft(null)}
            className="text-amber-600 text-xs font-medium underline underline-offset-2"
          >
            Skip
          </button>
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-5 space-y-5">
            {/* Muscle illustration – rendered inline so the SVG markup is
                injected directly into the DOM, avoiding Vite 8 / Rolldown
                asset-URL resolution issues that cause <img src> to receive
                undefined and silently show alt text. */}
            <div
              className="w-24 h-24 mx-auto [&>svg]:w-full [&>svg]:h-full"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: MUSCLE_ILLUSTRATIONS[exercise.slot] }}
              role="img"
              aria-label={exercise.slot}
            />

            {/* Exercise name + swap */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{exName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {exercise.targetSets} sets &times; {exercise.targetRepsMin}–{exercise.targetRepsMax}{' '}
                  reps
                </p>
              </div>
              {hasAlternatives && (
                <button
                  onClick={() => handleSwap(exercise, day.id)}
                  className="shrink-0 flex items-center gap-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
                >
                  <span>↔</span>
                  <span>Swap</span>
                </button>
              )}
            </div>

            {/* Set input rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-xs font-medium text-gray-400 px-1">
                <span>Set</span>
                <span>Weight (lbs)</span>
                <span>Reps</span>
              </div>
              {setRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 items-center">
                  <span className="text-sm text-gray-400 text-center font-medium">{i + 1}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.weight}
                    onChange={(e) => updateInput(exercise.exerciseId, i, 'weight', e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.reps}
                    onChange={(e) => updateInput(exercise.exerciseId, i, 'reps', e.target.value)}
                    onBlur={() => handleRepsBlur(exercise.exerciseId, i, day.restSeconds)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto space-y-3">
          {saved ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 font-semibold text-sm">
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
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
              disabled={currentSlideIndex === 0}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={currentSlideIndex === exercises.length - 1}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
