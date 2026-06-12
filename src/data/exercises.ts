import { Exercise } from '../types';

export const EXERCISE_LIBRARY: Exercise[] = [
  // CHEST
  { id: "barbell_bench_press", name: "Barbell Bench Press", slot: "chest", equipment: "barbell" },
  { id: "incline_barbell_bench_press", name: "Incline Barbell Bench Press", slot: "chest", equipment: "barbell" },
  { id: "flat_dumbbell_press", name: "Flat Dumbbell Press", slot: "chest", equipment: "dumbbells" },
  { id: "incline_dumbbell_press", name: "Incline Dumbbell Press", slot: "chest", equipment: "dumbbells" },
  { id: "dumbbell_fly", name: "Dumbbell Fly", slot: "chest", equipment: "dumbbells" },
  { id: "chest_press_machine", name: "Chest Press Machine", slot: "chest", equipment: "machines" },
  { id: "pec_deck", name: "Pec Deck", slot: "chest", equipment: "machines" },
  { id: "cable_fly_mid", name: "Cable Fly (Mid-Level)", slot: "chest", equipment: "cables" },
  { id: "push_up", name: "Push-Up", slot: "chest", equipment: "bodyweight" },
  { id: "dips_chest", name: "Dips", slot: "chest", equipment: "bodyweight" },

  // BACK
  { id: "deadlift", name: "Deadlift", slot: "back", equipment: "barbell" },
  { id: "bent_over_row", name: "Bent Over Row", slot: "back", equipment: "barbell" },
  { id: "pendlay_row", name: "Pendlay Row", slot: "back", equipment: "barbell" },
  { id: "one_arm_row", name: "One Arm Row", slot: "back", equipment: "dumbbells" },
  { id: "chest_supported_row", name: "Chest Supported Row", slot: "back", equipment: "dumbbells" },
  { id: "seated_row_machine", name: "Seated Row", slot: "back", equipment: "machines" },
  { id: "lat_pulldown", name: "Lat Pulldown", slot: "back", equipment: "machines" },
  { id: "cable_row", name: "Cable Row", slot: "back", equipment: "cables" },
  { id: "pull_up", name: "Pull-Up", slot: "back", equipment: "bodyweight" },
  { id: "chin_up", name: "Chin-Up", slot: "back", equipment: "bodyweight" },

  // SHOULDERS
  { id: "overhead_press", name: "Overhead Press", slot: "shoulders", equipment: "barbell" },
  { id: "push_press", name: "Push Press", slot: "shoulders", equipment: "barbell" },
  { id: "dumbbell_shoulder_press", name: "Dumbbell Shoulder Press", slot: "shoulders", equipment: "dumbbells" },
  { id: "arnold_press", name: "Arnold Press", slot: "shoulders", equipment: "dumbbells" },
  { id: "lateral_raise", name: "Lateral Raise", slot: "shoulders", equipment: "dumbbells" },
  { id: "shoulder_press_machine", name: "Shoulder Press Machine", slot: "shoulders", equipment: "machines" },
  { id: "cable_lateral_raise", name: "Cable Lateral Raise", slot: "shoulders", equipment: "cables" },
  { id: "pike_push_up", name: "Pike Push-Up", slot: "shoulders", equipment: "bodyweight" },
];
