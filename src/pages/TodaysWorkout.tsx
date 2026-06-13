import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Program, WorkoutLog, ExerciseLog, SetEntry, ProgramExercise } from '../types';
import {
  getProgram,
  getProfile,
  getWorkoutLogs,
  saveWorkoutLog,
  getCurrentDayIndex,
  setCurrentDayIndex,
  swapExercise,
} from '../lib/storage';
import { getSuggestedWeight } from '../lib/getSuggestedWeight';
import { isDeloadWeek } from '../lib/getMesocycleWeek';
import { getWarmupSets } from '../lib/getWarmupSets';
import { getPlateBreakdown } from '../lib/getPlateBreakdown';
import { EXERCISE_LIBRARY } from '../data/exercises';
import { MUSCLE_ILLUSTRATIONS } from '../assets/muscles';
import { FINISHERS } from '../data/finishers';
import type { Finisher } from '../data/finishers';
import { WARMUP_SEQUENCE } from '../data/warmups';
import type { WarmupMove } from '../data/warmups';

type SetInputs = { weight: string; reps: string; rpe: string };

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
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionDifficulty, setSessionDifficulty] = useState<number | undefined>(undefined);
  const [hoveredDifficulty, setHoveredDifficulty] = useState<number | undefined>(undefined);

  const [program, setProgram] = useState<Program | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slideGroups = useMemo(() => {
    const groups: ProgramExercise[][] = [];
    let i = 0;
    while (i < exercises.length) {
      const ex = exercises[i];
      if (ex.supersetGroup !== undefined) {
        const group = [ex];
        let j = i + 1;
        while (j < exercises.length && exercises[j].supersetGroup === ex.supersetGroup) {
          group.push(exercises[j]);
          j++;
        }
        groups.push(group);
        i = j;
      } else {
        groups.push([ex]);
        i++;
      }
    }
    return groups;
  }, [exercises]);
  const [inputs, setInputs] = useState<Record<string, SetInputs[]>>({});
  const [suggestedWeights, setSuggestedWeights] = useState<Record<string, number | null>>({});
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  const [userName, setUserName] = useState<string>('');

  const [expandedWarmup, setExpandedWarmup] = useState<string | null>(null);

  const [warmupStarted, setWarmupStarted] = useState(false);
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [warmupSecondsLeft, setWarmupSecondsLeft] = useState<number | null>(null);
  const [warmupDeclined, setWarmupDeclined] = useState(false);
  const [warmupComplete, setWarmupComplete] = useState(false);

  const [finisher, setFinisher] = useState<Finisher | null>(null);
  const [finisherStarted, setFinisherStarted] = useState(false);
  const [finisherRound, setFinisherRound] = useState(1);
  const [finisherPhase, setFinisherPhase] = useState<'work' | 'rest'>('work');
  const [finisherSecondsLeft, setFinisherSecondsLeft] = useState<number | null>(null);
  const [finisherDeclined, setFinisherDeclined] = useState(false);
  const [deloadWeek, setDeloadWeek] = useState(false);

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

    const profile = getProfile();
    setUserName(profile?.name ?? '');
    const isDeload = profile ? isDeloadWeek(profile) : false;
    setDeloadWeek(isDeload);

    const initialInputs: Record<string, SetInputs[]> = {};
    const initialSuggestedWeights: Record<string, number | null> = {};
    for (const ex of day.exercises) {
      const rawSuggested = getSuggestedWeight(ex.exerciseId, ex, existingLogs);
      const suggested = isDeload && rawSuggested !== null
        ? Math.round(rawSuggested * 0.85)
        : rawSuggested;
      initialSuggestedWeights[ex.exerciseId] = suggested;
      initialInputs[ex.exerciseId] = Array.from({ length: ex.targetSets }, () => ({
        weight: suggested !== null ? String(suggested) : '',
        reps: '',
        rpe: '',
      }));
    }

    setProgram(p);
    setDayIndex(idx);
    setLogs(existingLogs);
    setExercises(day.exercises);
    setInputs(initialInputs);
    setSuggestedWeights(initialSuggestedWeights);
    setFinisher(FINISHERS[Math.floor(Math.random() * FINISHERS.length)]);
  }, [navigate]);

  // Warmup timer countdown
  useEffect(() => {
    if (warmupSecondsLeft === null || warmupSecondsLeft <= 0) return;
    const id = setInterval(() => {
      setWarmupSecondsLeft((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [warmupSecondsLeft]);

  // Warmup move advancement
  useEffect(() => {
    if (!warmupStarted || warmupSecondsLeft !== null) return;
    if (warmupIndex >= WARMUP_SEQUENCE.length - 1) {
      setWarmupStarted(false);
      setWarmupComplete(true);
      return;
    }
    setWarmupIndex((i) => i + 1);
    setWarmupSecondsLeft(30);
  }, [warmupSecondsLeft, warmupStarted, warmupIndex]);

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

  // Finisher timer countdown
  useEffect(() => {
    if (finisherSecondsLeft === null || finisherSecondsLeft <= 0) return;
    const id = setInterval(() => {
      setFinisherSecondsLeft((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [finisherSecondsLeft]);

  // Finisher circuit advancement
  useEffect(() => {
    if (!finisherStarted || finisherSecondsLeft !== null) return;
    if (finisherPhase === 'work') {
      if (finisherRound >= 3) {
        setFinisherStarted(false);
        return;
      }
      setFinisherPhase('rest');
      setFinisherSecondsLeft(15);
    } else {
      setFinisherPhase('work');
      setFinisherRound((r) => r + 1);
      setFinisherSecondsLeft(30);
    }
  }, [finisherSecondsLeft, finisherStarted, finisherPhase, finisherRound]);

  function updateInput(exerciseId: string, setIdx: number, field: 'weight' | 'reps' | 'rpe', value: string) {
    setInputs((prev) => {
      const copy = (prev[exerciseId] ?? []).map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      );
      return { ...prev, [exerciseId]: copy };
    });
  }

  function handleRepsBlur(exerciseId: string, setIdx: number, restSeconds: number, isLastInGroup: boolean) {
    const row = inputs[exerciseId]?.[setIdx];
    if (row && row.reps !== '' && isLastInGroup) {
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

    const updatedEx = updatedDay.exercises.find((e) => e.slot === ex.slot);
    if (updatedEx) {
      const rawSuggested = getSuggestedWeight(newId, updatedEx, logs);
      const suggested = deloadWeek && rawSuggested !== null
        ? Math.round(rawSuggested * 0.85)
        : rawSuggested;
      setSuggestedWeights((prev) => ({ ...prev, [newId]: suggested }));
      setInputs((prev) => {
        if (prev[newId]) return prev;
        return {
          ...prev,
          [newId]: Array.from({ length: updatedEx.targetSets }, () => ({
            weight: suggested !== null ? String(suggested) : '',
            reps: '',
            rpe: '',
          })),
        };
      });
    }
  }

  function handleFinish() {
    setShowSummary(true);
  }

  function handleSaveWorkout() {
    if (!program) return;
    const day = program.days[dayIndex % program.days.length];

    const exerciseLogs: ExerciseLog[] = exercises.flatMap((ex) => {
      const sets: SetEntry[] = (inputs[ex.exerciseId] ?? [])
        .map((s, i) => {
          const w = parseFloat(s.weight);
          const r = parseFloat(s.reps);
          const rpeVal = parseFloat(s.rpe);
          const hasWeight = s.weight !== '' && !isNaN(w);
          const hasReps = s.reps !== '' && !isNaN(r);
          const hasRpe = s.rpe !== '' && !isNaN(rpeVal) && rpeVal >= 1 && rpeVal <= 10;
          if (hasWeight || hasReps) {
            return {
              setNumber: i + 1,
              weight: hasWeight ? w : 0,
              reps: hasReps ? r : 0,
              ...(hasRpe && { rpe: rpeVal }),
            } satisfies SetEntry;
          }
          return null;
        })
        .filter((s): s is SetEntry => s !== null);

      if (sets.length === 0) return [];
      return [{ exerciseId: ex.exerciseId, sets }];
    });

    const durationSecs = startTime !== null ? Math.round((Date.now() - startTime) / 1000) : undefined;

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      programDayId: day.id,
      exercises: exerciseLogs,
      ...(readiness !== undefined && { readiness }),
      ...(durationSecs !== undefined && { durationSeconds: durationSecs }),
      ...(sessionDifficulty !== undefined && { sessionDifficulty }),
    };

    saveWorkoutLog(log);
    setCurrentDayIndex((dayIndex + 1) % program.days.length);
    setSaved(true);
    setTimeout(() => navigate('/history'), 1500);
  }

  if (!program) return null;

  if (showSummary) {
    const displayDifficulty = hoveredDifficulty ?? sessionDifficulty;
    const day = program.days[dayIndex % program.days.length];

    return (
      <div className="min-h-screen bg-pageBg p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-surface rounded-2xl p-6">
            <h1 className="text-2xl font-display text-textPrimary">Workout Summary</h1>
            <p className="text-sm text-textMuted mt-1">{day.name}</p>
          </div>

          <div className="bg-surface rounded-2xl p-6 space-y-5">
            {exercises.map((ex) => {
              const exDef = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
              const name = exDef?.name ?? ex.exerciseId;
              const rows = inputs[ex.exerciseId] ?? [];
              const loggedRows = rows.filter((r) => r.weight !== '' || r.reps !== '');
              if (loggedRows.length === 0) return null;
              return (
                <div key={ex.exerciseId}>
                  <p className="text-sm font-display text-textPrimary mb-2">{name}</p>
                  <div className="space-y-1">
                    {loggedRows.map((r, i) => (
                      <p key={i} className="text-sm text-textMuted">
                        <span className="font-medium text-textPrimary">Set {i + 1}:</span>{' '}
                        {r.weight || 0} lbs &times; {r.reps || 0} reps
                        {r.rpe && ` @ RPE ${r.rpe}`}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {!saved && (
            <div className="bg-surface rounded-2xl p-8 space-y-7">
              <h2 className="font-display text-xl text-textPrimary text-center leading-tight">
                How hard was that workout?
              </h2>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setSessionDifficulty(n)}
                      onMouseEnter={() => setHoveredDifficulty(n)}
                      onMouseLeave={() => setHoveredDifficulty(undefined)}
                      className={`w-10 h-10 rounded-xl font-display text-base font-semibold transition-colors ${
                        sessionDifficulty === n
                          ? 'bg-accent text-pageBg'
                          : 'bg-surface2 text-textPrimary hover:bg-surface2/70'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm font-medium h-5">
                  {displayDifficulty ? (
                    <span className="text-accent">{displayDifficulty}/10</span>
                  ) : (
                    <span className="text-textMuted">Tap a number</span>
                  )}
                </p>
              </div>
              <button
                disabled={sessionDifficulty === undefined}
                onClick={handleSaveWorkout}
                className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                Save Workout
              </button>
            </div>
          )}

          {saved && (
            <div className="bg-surface2 border border-accent/30 rounded-xl p-4 text-center text-accent font-semibold text-sm">
              Workout saved! Great work.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!checkedIn) {
    const displayValue = hoveredReadiness ?? readiness;
    const label = displayValue ? READINESS_LABELS[displayValue] : null;

    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-sm space-y-7">
          <h1 className="font-display text-2xl text-textPrimary text-center leading-tight">
            How are you feeling today{userName ? `, ${userName}` : ''}?
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

  if (checkedIn && !workoutStarted) {
    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-sm space-y-6 text-center">
          <h1 className="font-display text-2xl text-textPrimary leading-tight">
            Ready to crush it{userName ? `, ${userName}` : ''}?
          </h1>
          <p className="text-textMuted text-sm">
            We'll track how long this workout takes.
          </p>
          <button
            onClick={() => {
              setStartTime(Date.now());
              setWorkoutStarted(true);
            }}
            className="w-full bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  if (checkedIn && workoutStarted && !warmupDeclined && !warmupComplete) {
    const currentMove: WarmupMove = WARMUP_SEQUENCE[warmupIndex];
    const warmupRingProgress = warmupSecondsLeft !== null ? warmupSecondsLeft / 30 : 0;
    const warmupRingOffset = RING_CIRCUMFERENCE * (1 - warmupRingProgress);

    return (
      <div className="min-h-screen bg-pageBg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-2xl p-8 w-full max-w-sm space-y-6 text-center">
          {!warmupStarted ? (
            <>
              <h1 className="font-display text-2xl text-textPrimary leading-tight">
                Warm Up First?
              </h1>
              <p className="text-textMuted text-sm">
                {WARMUP_SEQUENCE.length} moves, 30s each — about 4 minutes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setWarmupStarted(true);
                    setWarmupIndex(0);
                    setWarmupSecondsLeft(30);
                  }}
                  className="flex-1 bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-semibold rounded-xl py-3 text-sm transition-colors"
                >
                  Start Warm-Up
                </button>
                <button
                  onClick={() => setWarmupDeclined(true)}
                  className="flex-1 bg-surface2 hover:bg-surface2/80 text-textPrimary font-medium rounded-xl py-3 text-sm transition-colors"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-textMuted uppercase tracking-wide font-medium">
                  Move {warmupIndex + 1} of {WARMUP_SEQUENCE.length}
                </p>
                <h2 className="text-xl font-display text-textPrimary mt-1">{currentMove.name}</h2>
                <p className="text-sm text-textMuted mt-1">{currentMove.description}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96" aria-label={`Warm-up timer: ${warmupSecondsLeft ?? 0} seconds remaining`}>
                    <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="#363b46" strokeWidth="6" />
                    <circle
                      cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="#d4ff4f" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={warmupRingOffset}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-display text-textPrimary leading-none">{warmupSecondsLeft ?? 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setWarmupStarted(false); setWarmupDeclined(true); }}
                  className="text-textMuted text-xs font-medium underline underline-offset-2 hover:text-textPrimary transition-colors"
                >
                  Skip Warm-Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

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

  const currentGroup = slideGroups[currentSlideIndex] ?? [];

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
            Exercise {currentSlideIndex + 1} of {slideGroups.length}
          </p>
          <h1 className="text-lg font-display text-textPrimary">{day.name}</h1>
          {deloadWeek && (
            <span className="inline-block mt-1 text-xs font-semibold text-accent2 bg-accent2/10 px-2 py-0.5 rounded-full">
              Deload Week — reduced volume
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {slideGroups.map((_, i) => (
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
        <div className="max-w-lg mx-auto space-y-4">
          <div className="bg-surface rounded-2xl p-5 space-y-5">
            {currentGroup.length > 1 && (
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">⚡ Superset</p>
            )}
            {currentGroup.map((exercise, groupIdx) => {
              const exDef = EXERCISE_LIBRARY.find((e) => e.id === exercise.exerciseId);
              const exName = exDef?.name ?? exercise.exerciseId;
              const setRows = inputs[exercise.exerciseId] ?? [];
              const hasAlternatives = exercise.alternativeExerciseIds.length > 0;
              const adjustedTargetSets = deloadWeek
                ? Math.max(1, exercise.targetSets - 1)
                : exercise.targetSets;
              const isLastInGroup = groupIdx === currentGroup.length - 1;
              return (
                <div key={exercise.exerciseId} className={currentGroup.length > 1 && groupIdx > 0 ? 'pt-4 border-t border-surface2' : ''}>
                  <div
                    className={`mx-auto [&>svg]:w-full [&>svg]:h-full ${currentGroup.length > 1 ? 'w-16 h-16' : 'w-24 h-24'}`}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: MUSCLE_ILLUSTRATIONS[exercise.slot] }}
                    role="img"
                    aria-label={exercise.slot}
                  />

                  {/* Exercise name + swap */}
                  <div className="flex items-start justify-between gap-3 mt-3">
                    <div>
                      <h2 className="text-xl font-display text-textPrimary leading-tight">{exName}</h2>
                      <p className="text-sm text-textMuted mt-1">
                        {adjustedTargetSets} sets &times; {exercise.targetRepsMin}–{exercise.targetRepsMax}{' '}
                        reps
                      </p>
                      {suggestedWeights[exercise.exerciseId] !== null &&
                        suggestedWeights[exercise.exerciseId] !== undefined && (
                        <button
                          onClick={() => setExpandedWarmup((prev) => prev === exercise.exerciseId ? null : exercise.exerciseId)}
                          className="text-xs text-accent mt-0.5 underline underline-offset-2 hover:text-accent/80 transition-colors"
                        >
                          Suggested: {suggestedWeights[exercise.exerciseId]} lbs {expandedWarmup === exercise.exerciseId ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5">
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exName + ' exercise form')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-textMuted border border-surface2 rounded-lg px-3 py-1.5 hover:bg-surface2 hover:text-textPrimary active:bg-surface2/80 transition-colors"
                      >
                        <span>▶</span>
                        <span>Demo</span>
                      </a>
                      {hasAlternatives && (
                        <button
                          onClick={() => handleSwap(exercise, day.id)}
                          className="flex items-center gap-1 text-sm text-accent border border-surface2 rounded-lg px-3 py-1.5 hover:bg-surface2 active:bg-surface2/80 transition-colors"
                        >
                          <span>↔</span>
                          <span>Swap</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedWarmup === exercise.exerciseId && suggestedWeights[exercise.exerciseId] != null && (() => {
                    const targetWeight = suggestedWeights[exercise.exerciseId];
                    const warmups = getWarmupSets(targetWeight);
                    const exDefForThis = EXERCISE_LIBRARY.find((e) => e.id === exercise.exerciseId);
                    const isBarbell = exDefForThis?.equipment === 'barbell';
                    const plates = isBarbell ? getPlateBreakdown(targetWeight) : null;

                    return (
                      <div className="bg-surface2 rounded-xl p-3 space-y-3 text-sm mt-3">
                        {warmups.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Warm-up Sets</p>
                            <div className="space-y-1">
                              {warmups.map((w, i) => (
                                <p key={i} className="text-textPrimary">
                                  <span className="text-textMuted">{w.percent}%:</span> {w.weight} lbs &times; {w.reps} reps
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {plates && (
                          <div>
                            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1.5">Plates Per Side (45 lb bar)</p>
                            {plates.perSide.length === 0 ? (
                              <p className="text-textMuted">Just the bar — no plates needed.</p>
                            ) : (
                              <p className="text-textPrimary">
                                {plates.perSide.join(', ')} lbs
                                {!plates.exact && (
                                  <span className="text-textMuted"> (≈{plates.achievedWeight} lbs)</span>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Set input rows */}
                  <div className="space-y-2 mt-3">
                    <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 text-xs font-medium text-textMuted px-1">
                      <span>Set</span>
                      <span>Weight (lbs)</span>
                      <span>Reps</span>
                      <span>RPE</span>
                    </div>
                    {setRows.slice(0, adjustedTargetSets).map((row, i) => (
                      <div key={i} className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 items-center">
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
                          onBlur={() => handleRepsBlur(exercise.exerciseId, i, day.restSeconds, isLastInGroup)}
                          className="bg-surface2 border border-surface2 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted w-full focus:outline-none focus:border-accent transition-colors"
                        />
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          placeholder="—"
                          value={row.rpe}
                          onChange={(e) => updateInput(exercise.exerciseId, i, 'rpe', e.target.value)}
                          className="bg-surface2 border border-surface2 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder-textMuted w-full focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Finisher card – last slide only, not after save */}
          {currentSlideIndex === slideGroups.length - 1 && !saved && (() => {
            const finisherComplete = !finisherStarted && finisherSecondsLeft === null && finisherRound >= 3 && finisherPhase === 'work';
            if (finisherComplete) {
              return (
                <div className="bg-surface rounded-2xl p-5 text-center">
                  <p className="text-lg font-display text-accent">Finisher complete! 💪</p>
                </div>
              );
            }
            if (finisherDeclined || (!finisherStarted && finisherRound > 1)) return null;
            if (finisherStarted && finisher) {
              const totalSecs = finisherPhase === 'work' ? 30 : 15;
              const finisherRingProgress = finisherSecondsLeft !== null ? finisherSecondsLeft / totalSecs : 0;
              const finisherRingOffset = RING_CIRCUMFERENCE * (1 - finisherRingProgress);
              return (
                <div className="bg-surface rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-display text-textPrimary">{finisher.name}</h3>
                      <p className="text-xs text-textMuted mt-0.5">Round {finisherRound} of 3</p>
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${finisherPhase === 'work' ? 'bg-accent/20 text-accent' : 'bg-surface2 text-textMuted'}`}>
                      {finisherPhase === 'work' ? 'Work!' : 'Rest'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-24 h-24">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 96 96"
                        aria-label={`Finisher timer: ${finisherSecondsLeft ?? 0} seconds remaining`}
                      >
                        <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="#363b46" strokeWidth="6" />
                        <circle
                          cx="48"
                          cy="48"
                          r={RING_RADIUS}
                          fill="none"
                          stroke={finisherPhase === 'work' ? '#d4ff4f' : '#6b7280'}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={finisherRingOffset}
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-display text-textPrimary leading-none">
                          {finisherSecondsLeft ?? 0}
                        </span>
                        <span className="text-xs text-textMuted mt-0.5">
                          {finisherPhase === 'work' ? 'work' : 'rest'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setFinisherStarted(false); setFinisherDeclined(true); }}
                      className="text-textMuted text-xs font-medium underline underline-offset-2 hover:text-textPrimary transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              );
            }
            if (finisher && !finisherStarted && !finisherDeclined) {
              return (
                <div className="bg-surface rounded-2xl p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-display text-textPrimary">Add a Finisher?</h3>
                    <p className="text-sm font-semibold text-accent mt-1">{finisher.name}</p>
                    <p className="text-xs text-textMuted mt-0.5">{finisher.description}</p>
                    <p className="text-xs text-textMuted mt-1">3 rounds: 30s work / 15s rest</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setFinisherStarted(true);
                        setFinisherRound(1);
                        setFinisherPhase('work');
                        setFinisherSecondsLeft(30);
                      }}
                      className="flex-1 bg-accent hover:bg-accent/90 active:bg-accent/80 text-pageBg font-semibold rounded-xl py-2.5 text-sm transition-colors"
                    >
                      Start Finisher
                    </button>
                    <button
                      onClick={() => setFinisherDeclined(true)}
                      className="flex-1 bg-surface2 hover:bg-surface2/80 text-textPrimary font-medium rounded-xl py-2.5 text-sm transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })()}
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
              onClick={() => setCurrentSlideIndex((i) => Math.min(slideGroups.length - 1, i + 1))}
              disabled={currentSlideIndex === slideGroups.length - 1}
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
