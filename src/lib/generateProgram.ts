import type { UserProfile, Program, ProgramDay, ProgramExercise } from "../types";
import { EXERCISE_LIBRARY } from "../data/exercises";
import { SPLITS } from "../data/splits";
import { getCustomWorkouts, getCustomExercises, getCustomSplits } from './storage';

export function generateProgram(profile: UserProfile): Program {
  if (profile.splitId === 'custom') {
    const customSplits = getCustomSplits();
    const selectedSplit = profile.customSplitId
      ? customSplits.find((s) => s.id === profile.customSplitId)
      : undefined;

    const allCustomWorkouts = getCustomWorkouts();
    const customWorkouts = selectedSplit
      ? selectedSplit.workoutIds
          .map((id) => allCustomWorkouts.find((w) => w.id === id))
          .filter((w): w is NonNullable<typeof w> => w !== undefined)
      : allCustomWorkouts;

    if (customWorkouts.length === 0) {
      throw new Error('No custom workouts found. Build a workout (and split) in the Workout Builder first.');
    }
    const customExercises = getCustomExercises();
    const allExercises = [...EXERCISE_LIBRARY, ...customExercises];

    const days: ProgramDay[] = customWorkouts.map((workout) => {
      const exercises: ProgramExercise[] = workout.exercises.map((item) => {
        const def = allExercises.find((e) => e.id === item.exerciseId);
        const slot = def?.slot ?? 'chest';
        let alternativeExerciseIds: string[] = [];
        if (def && !('custom' in def && def.custom)) {
          alternativeExerciseIds = EXERCISE_LIBRARY
            .filter(
              (e) =>
                e.slot === slot &&
                e.equipment === def.equipment &&
                e.id !== def.id &&
                profile.equipment.includes(e.equipment)
            )
            .map((e) => e.id);
        }
        return {
          slot,
          exerciseId: item.exerciseId,
          alternativeExerciseIds,
          targetSets: item.targetSets,
          targetRepsMin: item.targetRepsMin,
          targetRepsMax: item.targetRepsMax,
        };
      });
      return {
        id: workout.id,
        name: workout.name,
        exercises,
        restSeconds: 90,
      };
    });

    return {
      splitId: profile.splitId,
      days,
      createdAt: new Date().toISOString(),
    };
  }

  if (profile.equipment.length === 0) {
    throw new Error('Profile has no equipment selected');
  }
  const split = SPLITS[profile.splitId];
  const days: ProgramDay[] = [];

  for (const dayTemplate of split.dayTemplates) {
    const repRange = dayTemplate.repRange ?? { sets: 3, min: 8, max: 10 };
    const restSeconds = dayTemplate.restSeconds ?? 90;
    const dayExercises: ProgramExercise[] = [];

    // Count how many times each slot appears in this day's template
    const slotOccurrenceCount = new Map<string, number>();
    for (const slot of dayTemplate.slots) {
      slotOccurrenceCount.set(slot, (slotOccurrenceCount.get(slot) ?? 0) + 1);
    }

    // Pre-filter matches and compute shared alternatives per slot.
    // Primaries for a slot appearing N times are matches[0..N-1];
    // alternatives are any remaining matches beyond the N primaries.
    const slotMatchesMap = new Map<string, typeof EXERCISE_LIBRARY>();
    const slotAlternativeIds = new Map<string, string[]>();
    for (const [slot, count] of slotOccurrenceCount) {
      const matches = EXERCISE_LIBRARY.filter(
        (ex) => ex.slot === slot && profile.equipment.includes(ex.equipment)
      );
      slotMatchesMap.set(slot, matches);
      const primaryCount = Math.min(count, matches.length);
      slotAlternativeIds.set(slot, matches.slice(primaryCount).map((e) => e.id));
    }

    // Build exercises; each duplicate slot occurrence picks the next available primary
    const slotOccurrenceIdx = new Map<string, number>();
    for (const slot of dayTemplate.slots) {
      const matches = slotMatchesMap.get(slot)!;
      if (matches.length === 0) continue;

      const occurrenceIdx = slotOccurrenceIdx.get(slot) ?? 0;
      slotOccurrenceIdx.set(slot, occurrenceIdx + 1);

      const primaryIndex = occurrenceIdx < matches.length ? occurrenceIdx : 0;
      const primary = matches[primaryIndex];
      const alternatives = slotAlternativeIds.get(slot)!;

      dayExercises.push({
        slot,
        exerciseId: primary.id,
        alternativeExerciseIds: alternatives,
        targetSets: repRange.sets,
        targetRepsMin: repRange.min,
        targetRepsMax: repRange.max,
      });
    }

    days.push({
      id: dayTemplate.id,
      name: dayTemplate.name,
      exercises: dayExercises,
      restSeconds,
    });
  }

  return {
    splitId: profile.splitId,
    days,
    createdAt: new Date().toISOString(),
  };
}
