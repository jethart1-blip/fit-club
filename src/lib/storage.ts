import type { UserProfile, Program, WorkoutLog, MuscleGroupSlot } from '../types';

const KEYS = {
  profile: 'fitclub_profile',
  program: 'fitclub_program',
  logs: 'fitclub_logs',
  currentDayIndex: 'fitclub_currentDayIndex',
} as const;

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEYS.profile);
    if (raw === null) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function getProgram(): Program | null {
  try {
    const raw = localStorage.getItem(KEYS.program);
    if (raw === null) return null;
    return JSON.parse(raw) as Program;
  } catch {
    return null;
  }
}

export function saveProgram(program: Program): void {
  localStorage.setItem(KEYS.program, JSON.stringify(program));
}

export function getWorkoutLogs(): WorkoutLog[] {
  try {
    const raw = localStorage.getItem(KEYS.logs);
    if (raw === null) return [];
    return JSON.parse(raw) as WorkoutLog[];
  } catch {
    return [];
  }
}

export function saveWorkoutLog(log: WorkoutLog): void {
  const existing = getWorkoutLogs();
  existing.push(log);
  localStorage.setItem(KEYS.logs, JSON.stringify(existing));
}

export function getCurrentDayIndex(): number {
  try {
    const raw = localStorage.getItem(KEYS.currentDayIndex);
    if (raw === null) return 0;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'number' ? parsed : 0;
  } catch {
    return 0;
  }
}

export function setCurrentDayIndex(index: number): void {
  localStorage.setItem(KEYS.currentDayIndex, JSON.stringify(index));
}

export function clearAllData(): void {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.program);
  localStorage.removeItem(KEYS.logs);
  localStorage.removeItem(KEYS.currentDayIndex);
}

export function swapExercise(dayId: string, slot: MuscleGroupSlot, newExerciseId: string): void {
  const program = getProgram();
  if (program === null) return;

  const day = program.days.find((d) => d.id === dayId);
  if (!day) return;

  const exercise = day.exercises.find((e) => e.slot === slot);
  if (!exercise) return;

  const oldExerciseId = exercise.exerciseId;
  exercise.exerciseId = newExerciseId;
  exercise.alternativeExerciseIds = [
    oldExerciseId,
    ...exercise.alternativeExerciseIds.filter((id) => id !== newExerciseId),
  ];

  saveProgram(program);
}
