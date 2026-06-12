export type MovementSlot =
  | "squat_main"
  | "squat_secondary"
  | "hinge_main"
  | "hinge_secondary"
  | "push_main"
  | "push_secondary"
  | "pull_main"
  | "pull_secondary"
  | "core";

export type Equipment = "full_gym" | "dumbbells_only";

export interface Exercise {
  id: string;
  name: string;
  slot: MovementSlot;
  equipment: Equipment[];
}

export interface UserProfile {
  daysPerWeek: 3 | 4;
  equipment: Equipment;
  createdAt: string;
}

export interface ProgramExercise {
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export interface ProgramDay {
  id: string;
  name: string;
  exercises: ProgramExercise[];
}

export interface Program {
  days: ProgramDay[];
  createdAt: string;
}

export interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetEntry[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  programDayId: string;
  exercises: ExerciseLog[];
}
