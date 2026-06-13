export type MuscleGroupSlot =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "forearms";

export type EquipmentType = "barbell" | "dumbbells" | "machines" | "cables" | "bodyweight";

export interface Exercise {
  id: string;
  name: string;
  slot: MuscleGroupSlot;
  equipment: EquipmentType;
}

export type Goal = "strength" | "hypertrophy" | "general_fitness" | "fat_loss";

export type SplitId =
  | "ppl"
  | "upper_lower"
  | "bro_split"
  | "full_body"
  | "arnold"
  | "pplul"
  | "ulppl"
  | "torso_limbs"
  | "powerbuilding"
  | "strength_athlete";

export interface UserProfile {
  daysPerWeek: number;
  equipment: EquipmentType[];
  age: number;
  weightLbs: number;
  heightInches: number;
  goal: Goal;
  splitId: SplitId;
  createdAt: string;
}

export interface DayTemplate {
  id: string;
  name: string;
  slots: MuscleGroupSlot[];
  repRange?: { sets: number; min: number; max: number };
  restSeconds?: number;
}

export interface SplitDefinition {
  id: SplitId;
  name: string;
  description: string;
  dayTemplates: DayTemplate[];
}

export interface ProgramExercise {
  slot: MuscleGroupSlot;
  exerciseId: string;
  alternativeExerciseIds: string[];
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export interface ProgramDay {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  restSeconds: number;
}

export interface Program {
  splitId: SplitId;
  days: ProgramDay[];
  createdAt: string;
}

export interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
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
  /** How the user felt before this workout: 1 (worst) – 10 (best). */
  readiness?: number;
  durationSeconds?: number;
  sessionDifficulty?: number;
}

export interface CustomExercise {
  id: string;
  name: string;
  slot: MuscleGroupSlot;
  equipment: EquipmentType;
  custom: true;
}

export interface CustomWorkoutExercise {
  exerciseId: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: CustomWorkoutExercise[];
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  dataUrl: string;
  weightLbs?: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightLbs: number;
}
