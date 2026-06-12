import type { UserProfile, Program, ProgramDay, MovementSlot } from "../types";
import { EXERCISE_LIBRARY } from "../data/exercises";

function pickExercise(slot: MovementSlot, equipment: UserProfile["equipment"]): string {
  const match = EXERCISE_LIBRARY.find(
    (ex) => ex.slot === slot && ex.equipment.includes(equipment)
  );
  if (!match) {
    throw new Error(`No exercise found for slot "${slot}" with equipment "${equipment}"`);
  }
  return match.id;
}

function buildDay(
  id: string,
  name: string,
  slots: MovementSlot[],
  equipment: UserProfile["equipment"]
): ProgramDay {
  return {
    id,
    name,
    exercises: slots.map((slot) => ({
      exerciseId: pickExercise(slot, equipment),
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
    })),
  };
}

export function generateProgram(profile: UserProfile): Program {
  const days: ProgramDay[] = [
    buildDay("lower_a", "Lower A", ["squat_main", "hinge_secondary", "core"], profile.equipment),
    buildDay("upper_a", "Upper A", ["push_main", "pull_main"], profile.equipment),
    buildDay("lower_b", "Lower B", ["hinge_main", "squat_secondary", "core"], profile.equipment),
    buildDay("upper_b", "Upper B", ["pull_secondary", "push_secondary"], profile.equipment),
  ];

  return {
    days,
    createdAt: new Date().toISOString(),
  };
}
