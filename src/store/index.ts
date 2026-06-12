import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { seedState } from '@/data/seed'
import type {
  BodyWeightEntry,
  Exercise,
  Split,
  SplitDay,
  UserSettings,
  Workout,
  WorkoutSet,
} from '@/types'

interface FitAppState {
  userSettings: UserSettings
  exercises: Exercise[]
  splits: Split[]
  splitDays: SplitDay[]
  workouts: Workout[]
  workoutSets: WorkoutSet[]
  bodyWeightEntries: BodyWeightEntry[]
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void

  getUserSettings: () => UserSettings
  updateUserSettings: (updates: Partial<UserSettings>) => void

  getExercises: () => Exercise[]
  getExercise: (id: string) => Exercise | undefined
  addExercise: (exercise: Exercise) => void
  updateExercise: (id: string, updates: Partial<Exercise>) => void
  deleteExercise: (id: string) => void

  getSplits: () => Split[]
  getSplit: (id: string) => Split | undefined
  addSplit: (split: Split) => void
  updateSplit: (id: string, updates: Partial<Split>) => void
  deleteSplit: (id: string) => void

  getSplitDays: (splitId?: string) => SplitDay[]
  getSplitDay: (id: string) => SplitDay | undefined
  addSplitDay: (splitDay: SplitDay) => void
  updateSplitDay: (id: string, updates: Partial<SplitDay>) => void
  deleteSplitDay: (id: string) => void

  getWorkouts: () => Workout[]
  getWorkout: (id: string) => Workout | undefined
  addWorkout: (workout: Workout) => void
  updateWorkout: (id: string, updates: Partial<Workout>) => void
  deleteWorkout: (id: string) => void

  getWorkoutSets: (workoutId?: string) => WorkoutSet[]
  getWorkoutSet: (id: string) => WorkoutSet | undefined
  addWorkoutSet: (workoutSet: WorkoutSet) => void
  updateWorkoutSet: (id: string, updates: Partial<WorkoutSet>) => void
  deleteWorkoutSet: (id: string) => void

  getBodyWeightEntries: () => BodyWeightEntry[]
  getBodyWeightEntry: (id: string) => BodyWeightEntry | undefined
  addBodyWeightEntry: (entry: BodyWeightEntry) => void
  updateBodyWeightEntry: (id: string, updates: Partial<BodyWeightEntry>) => void
  deleteBodyWeightEntry: (id: string) => void
}

const STORAGE_KEY = 'fitapp-store'

function isMissingSeedData(state: Partial<FitAppState> | undefined): boolean {
  return !state?.exercises?.length || !state?.splits?.length
}

export const useAppStore = create<FitAppState>()(
  persist(
    (set, get) => ({
      ...seedState,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      getUserSettings: () => get().userSettings,
      updateUserSettings: (updates) =>
        set((state) => ({
          userSettings: { ...state.userSettings, ...updates },
        })),

      getExercises: () => get().exercises,
      getExercise: (id) => get().exercises.find((exercise) => exercise.id === id),
      addExercise: (exercise) =>
        set((state) => ({ exercises: [...state.exercises, exercise] })),
      updateExercise: (id, updates) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.id === id ? { ...exercise, ...updates } : exercise,
          ),
        })),
      deleteExercise: (id) =>
        set((state) => ({
          exercises: state.exercises.filter((exercise) => exercise.id !== id),
          splitDays: state.splitDays.map((day) => ({
            ...day,
            suggestedExerciseIds: day.suggestedExerciseIds.filter(
              (exerciseId) => exerciseId !== id,
            ),
          })),
          workoutSets: state.workoutSets.filter((set) => set.exerciseId !== id),
        })),

      getSplits: () => get().splits,
      getSplit: (id) => get().splits.find((split) => split.id === id),
      addSplit: (split) =>
        set((state) => ({ splits: [...state.splits, split] })),
      updateSplit: (id, updates) =>
        set((state) => ({
          splits: state.splits.map((split) =>
            split.id === id ? { ...split, ...updates } : split,
          ),
        })),
      deleteSplit: (id) =>
        set((state) => ({
          splits: state.splits.filter((split) => split.id !== id),
          splitDays: state.splitDays.filter((day) => day.splitId !== id),
        })),

      getSplitDays: (splitId) => {
        const days = get().splitDays
        if (!splitId) return days
        return days
          .filter((day) => day.splitId === splitId)
          .sort((a, b) => a.order - b.order)
      },
      getSplitDay: (id) => get().splitDays.find((day) => day.id === id),
      addSplitDay: (splitDay) =>
        set((state) => ({ splitDays: [...state.splitDays, splitDay] })),
      updateSplitDay: (id, updates) =>
        set((state) => ({
          splitDays: state.splitDays.map((day) =>
            day.id === id ? { ...day, ...updates } : day,
          ),
        })),
      deleteSplitDay: (id) =>
        set((state) => ({
          splitDays: state.splitDays.filter((day) => day.id !== id),
        })),

      getWorkouts: () =>
        [...get().workouts].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      getWorkout: (id) => get().workouts.find((workout) => workout.id === id),
      addWorkout: (workout) =>
        set((state) => ({ workouts: [...state.workouts, workout] })),
      updateWorkout: (id, updates) =>
        set((state) => ({
          workouts: state.workouts.map((workout) =>
            workout.id === id ? { ...workout, ...updates } : workout,
          ),
        })),
      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((workout) => workout.id !== id),
          workoutSets: state.workoutSets.filter((set) => set.workoutId !== id),
        })),

      getWorkoutSets: (workoutId) => {
        const sets = get().workoutSets
        const filtered = workoutId
          ? sets.filter((set) => set.workoutId === workoutId)
          : sets
        return [...filtered].sort((a, b) => a.setOrder - b.setOrder)
      },
      getWorkoutSet: (id) => get().workoutSets.find((set) => set.id === id),
      addWorkoutSet: (workoutSet) =>
        set((state) => ({ workoutSets: [...state.workoutSets, workoutSet] })),
      updateWorkoutSet: (id, updates) =>
        set((state) => ({
          workoutSets: state.workoutSets.map((set) =>
            set.id === id ? { ...set, ...updates } : set,
          ),
        })),
      deleteWorkoutSet: (id) =>
        set((state) => ({
          workoutSets: state.workoutSets.filter((set) => set.id !== id),
        })),

      getBodyWeightEntries: () =>
        [...get().bodyWeightEntries].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      getBodyWeightEntry: (id) =>
        get().bodyWeightEntries.find((entry) => entry.id === id),
      addBodyWeightEntry: (entry) =>
        set((state) => ({
          bodyWeightEntries: [...state.bodyWeightEntries, entry],
        })),
      updateBodyWeightEntry: (id, updates) =>
        set((state) => ({
          bodyWeightEntries: state.bodyWeightEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry,
          ),
        })),
      deleteBodyWeightEntry: (id) =>
        set((state) => ({
          bodyWeightEntries: state.bodyWeightEntries.filter(
            (entry) => entry.id !== id,
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userSettings: state.userSettings,
        exercises: state.exercises,
        splits: state.splits,
        splitDays: state.splitDays,
        workouts: state.workouts,
        workoutSets: state.workoutSets,
        bodyWeightEntries: state.bodyWeightEntries,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<FitAppState> | undefined

        if (isMissingSeedData(persisted)) {
          return {
            ...currentState,
            ...seedState,
          }
        }

        return {
          ...currentState,
          ...persisted,
          userSettings: {
            ...seedState.userSettings,
            ...persisted?.userSettings,
          },
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state && isMissingSeedData(state)) {
          state.userSettings = seedState.userSettings
          state.exercises = seedState.exercises
          state.splits = seedState.splits
          state.splitDays = seedState.splitDays
          state.workouts = seedState.workouts
          state.workoutSets = seedState.workoutSets
          state.bodyWeightEntries = seedState.bodyWeightEntries
        }

        state?.setHasHydrated(true)
      },
    },
  ),
)

export type { FitAppState }
