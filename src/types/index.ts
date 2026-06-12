export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full-body'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'other'

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  muscleGroup: MuscleGroup
  equipment: Equipment
  instructions?: string
  isCustom?: boolean
}

export interface UserSettings {
  displayName: string
  weightUnit: 'kg' | 'lb'
  theme: 'light' | 'dark' | 'system'
  defaultRestSeconds: number
}

export interface Split {
  id: string
  name: string
  description?: string
  isPreset: boolean
}

export interface SplitDay {
  id: string
  splitId: string
  name: string
  order: number
  suggestedExerciseIds: string[]
}

export interface Workout {
  id: string
  name: string
  splitDayId?: string
  date: string
  notes?: string
  createdAt: string
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseId: string
  setOrder: number
  reps: number
  weight: number
  completed: boolean
}

export interface BodyWeightEntry {
  id: string
  date: string
  weightKg: number
  note?: string
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}
