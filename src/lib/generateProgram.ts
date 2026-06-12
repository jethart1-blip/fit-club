import type { UserProfile, Program, ProgramDay, ProgramExercise } from "../types";
import { EXERCISE_LIBRARY } from "../data/exercises";
import { SPLITS } from "../data/splits";

export function generateProgram(profile: UserProfile): Program {
  const split = SPLITS[profile.splitId];
  const days: ProgramDay[] = [];

  for (const dayTemplate of split.dayTemplates) {
    const repRange = dayTemplate.repRange ?? { sets: 3, min: 8, max: 10 };
    const restSeconds = dayTemplate.restSeconds ?? 90;
    const dayExercises: ProgramExercise[] = [];

    for (const slot of dayTemplate.slots) {
      const matches = EXERCISE_LIBRARY.filter(
        (ex) => ex.slot === slot && profile.equipment.includes(ex.equipment)
      );

      if (matches.length === 0) continue;

      const primary = matches[0];
      const alternatives = matches.slice(1).map((e) => e.id);

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
