import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const RING_RADIUS = 38;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const READINESS_LABELS: Record<number, string> = {
  1: 'Exhausted', 2: 'Exhausted',
  3: 'Tired',    4: 'Tired',
  5: 'Okay',     6: 'Okay',
  7: 'Good',     8: 'Good',
  9: 'Amazing',  10: 'Amazing',
};

export function TodaysWorkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requireCheckin = searchParams.get('checkin') === '1';

  const [checkedIn, setCheckedIn] = useState(!requireCheckin);
  const [readiness, setReadiness] = useState<number | undefined>(undefined);
  const [hoveredReadiness, setHoveredReadiness] = useState<number | undefined>(undefined);

  const [program, setProgram] = useState<Program | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, SetInputs[]>>({});
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(0);
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

    const firstEx = day.exercises[0];
    if (firstEx) {
      console.log('[SuggestedWeight debug]', {
        exerciseId: firstEx.exerciseId,
        exerciseName: firstEx.exerciseId,
        totalLogs: existingLogs.length,
        allLoggedExerciseIds: existingLogs.flatMap(l => l.exercises.map(e => e.exerciseId)),
        logsWithThisExercise: existingLogs.filter(l =>
          l.exercises.some(e => e.exerciseId === firstEx.exerciseId)
        ).length,
        suggested: getSuggestedWeight(firstEx.exerciseId, firstEx, existingLogs),
      });
    }

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

  // Rest timer countdown
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
      setRestTotalSeconds(restSeconds);
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

  function handleFinish() {
    if (!program) return;
    const day = program.days[dayIndex % program.days.length];

    const exerciseLogs: ExerciseLog[] = exercises.flatMap((ex) => {
      const sets: SetEntry[] = (inputs[ex.exerciseId] ?? [])
        .map((s, i) => {
          const w = parseFloat(s.weight);
          const r = parseFloat(s.reps);
          const hasWeight = s.weight !== '' && !isNaN(w);
          const hasReps = s.reps !== '' && !isNaN(r);
          if (hasWeight || hasReps) {
            return {
              setNumber: i + 1,
              weight: hasWeight ? w : 0,
              reps: hasReps ? r : 0,
            } satisfies SetEntry;
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
      ...(readiness !== undefined && { readiness }),
    };

    saveWorkoutLog(log);
    setCurrentDayIndex((dayIndex + 1) % program.days.length);
    setSaved(true);
    setTimeout(() => navigate('/history'), 1500);
  }

  if (!program) return null;

  if (!checkedIn) {
    const displayValue = hoveredReadiness ?? readiness;
    const label = displayValue ? READINESS_LABELS[displayValue] : null;

    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-sm space-y-7">
          <h1 className="font-display text-2xl text-textPrimary text-center leading-tight">
            How are you feeling today?
          </h1>

          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setReadiness(n)}
                  onMouseEnter={() => setHoveredReadiness(n)}
                  onMouseLeave={() => setHoveredReadiness(undefined)}
                  className={`w-10 h-10 rounded-xl font-display text-base font-semibold transition-colors ${
                    readiness === n
                      ? 'bg-accent text-pageBg'
                      : 'bg-surface2 text-textPrimary hover:bg-surface2/70'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="text-center text-sm font-medium h-5 transition-all">
              {label ? (
                <span className="text-accent">{label}</span>
              ) : (
                <span className="text-textMuted">Tap a number</span>
              )}
            </p>
          </div>

          <button
            disabled={readiness === undefined}
            onClick={() => setCheckedIn(true)}
            className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const day = program.days[dayIndex % program.days.length];

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-pageBg flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-8 max-w-sm text-center space-y-3">
          <div className="text-4xl">🏋️</div>
          <p className="text-textMuted text-sm leading-relaxed">
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

  // Ring progress: full at start, depletes to empty
  const ringProgress = restTotalSeconds > 0 && restSecondsLeft !== null
    ? restSecondsLeft / restTotalSeconds
    : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringProgress);

  return (
    <div className="min-h-screen bg-pageBg flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-surface2 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-textMuted uppercase tracking-wide font-medium">
            Exercise {currentSlideIndex + 1} of {exercises.length}
          </p>
          <h1 className="text-lg font-display text-textPrimary">{day.name}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlideIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentSlideIndex ? 'bg-accent' : 'bg-surface2 hover:bg-surface2/80'
              }`}
              aria-label={`Go to exercise ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Rest timer – circular SVG progress ring */}
      {restSecondsLeft !== null && (
        <div className="bg-surface border-b border-surface2 py-4 flex flex-col items-center gap-2">
          <div className="relative w-24 h-24">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 96 96"
              aria-label={`Rest timer: ${restSecondsLeft} seconds remaining`}
            >
              {/* Track */}
              <circle
                cx="48"
                cy="48"
                r={RING_RADIUS}
                fill="none"
                stroke="#363b46"
                strokeWidth="6"
              />
              {/* Progress arc */}
              <circle
                cx="48"
                cy="48"
                r={RING_RADIUS}
                fill="none"
                stroke="#d4ff4f"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display text-textPrimary leading-none">
                {restSecondsLeft}
              </span>
              <span className="text-xs text-textMuted mt-0.5">rest</span>
            </div>
          </div>
          <button
            onClick={() => setRestSecondsLeft(null)}
            className="text-textMuted text-xs font-medium underline underline-offset-2 hover:text-textPrimary transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-surface rounded-2xl p-5 space-y-5">
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
                <h2 className="text-xl font-display text-textPrimary leading-tight">{exName}</h2>
                <p className="text-sm text-textMuted mt-1">
                  {exercise.targetSets} sets &times; {exercise.targetRepsMin}–{exercise.targetRepsMax}{' '}
                  reps
                </p>
              </div>
              {hasAlternatives && (
                <button
                  onClick={() => handleSwap(exercise, day.id)}
                  className="shrink-0 flex items-center gap-1 text-sm text-accent border border-surface2 rounded-lg px-3 py-1.5 hover:bg-surface2 active:bg-surface2/80 transition-colors"
                >
                  <span>↔</span>
                  <span>Swap</span>
                </button>
              )}
            </div>

            {/* Set input rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr] gap-2 text-xs font-medium text-textMuted px-1">
                <span>Set</span>
                <span>Weight (lbs)</span>
                <span>Reps</span>
              </div>
              {setRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_1fr] gap-2 items-center">
                  <span className="text-sm text-textMuted text-center font-medium">{i + 1}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.weight}
                    onChange={(e) => updateInput(exercise.exerciseId, i, 'weight', e.target.value)}
                    className="bg-surface2 border border-surface2 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted w-full focus:outline-none focus:border-accent transition-colors"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={row.reps}
                    onChange={(e) => updateInput(exercise.exerciseId, i, 'reps', e.target.value)}
                    onBlur={() => handleRepsBlur(exercise.exerciseId, i, day.restSeconds)}
                    className="bg-surface2 border border-surface2 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted w-full focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-surface2 p-4">
        <div className="max-w-lg mx-auto space-y-3">
          {saved ? (
            <div className="bg-surface2 border border-accent/30 rounded-xl p-3 text-center text-accent font-semibold text-sm">
              Workout saved! Great work.
            </div>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              Finish Workout
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
              disabled={currentSlideIndex === 0}
              className="flex-1 bg-surface2 hover:bg-surface2/80 disabled:opacity-40 disabled:cursor-not-allowed text-textPrimary font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentSlideIndex((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={currentSlideIndex === exercises.length - 1}
              className="flex-1 bg-surface2 hover:bg-surface2/80 disabled:opacity-40 disabled:cursor-not-allowed text-textPrimary font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
