import type { Exercise } from "../types";

export const EXERCISE_LIBRARY: Exercise[] = [
  { id: "barbell_back_squat", name: "Barbell Back Squat", slot: "squat_main", equipment: ["full_gym"] },
  { id: "goblet_squat", name: "Goblet Squat", slot: "squat_main", equipment: ["dumbbells_only"] },
  { id: "leg_press", name: "Leg Press", slot: "squat_secondary", equipment: ["full_gym"] },
  { id: "dumbbell_split_squat", name: "Dumbbell Split Squat", slot: "squat_secondary", equipment: ["dumbbells_only"] },
  { id: "barbell_deadlift", name: "Barbell Deadlift", slot: "hinge_main", equipment: ["full_gym"] },
  { id: "dumbbell_deadlift", name: "Dumbbell Deadlift", slot: "hinge_main", equipment: ["dumbbells_only"] },
  { id: "barbell_rdl", name: "Barbell Romanian Deadlift", slot: "hinge_secondary", equipment: ["full_gym"] },
  { id: "dumbbell_rdl", name: "Dumbbell Romanian Deadlift", slot: "hinge_secondary", equipment: ["dumbbells_only"] },
  { id: "barbell_bench_press", name: "Barbell Bench Press", slot: "push_main", equipment: ["full_gym"] },
  { id: "dumbbell_bench_press", name: "Dumbbell Bench Press", slot: "push_main", equipment: ["dumbbells_only"] },
  { id: "overhead_press", name: "Barbell Overhead Press", slot: "push_secondary", equipment: ["full_gym"] },
  { id: "dumbbell_shoulder_press", name: "Dumbbell Shoulder Press", slot: "push_secondary", equipment: ["dumbbells_only"] },
  { id: "barbell_row", name: "Barbell Row", slot: "pull_main", equipment: ["full_gym"] },
  { id: "dumbbell_row", name: "Dumbbell Row", slot: "pull_main", equipment: ["dumbbells_only"] },
  { id: "lat_pulldown", name: "Lat Pulldown", slot: "pull_secondary", equipment: ["full_gym"] },
  { id: "dumbbell_pullover", name: "Dumbbell Pullover", slot: "pull_secondary", equipment: ["dumbbells_only"] },
  { id: "plank", name: "Plank", slot: "core", equipment: ["full_gym", "dumbbells_only"] },
];
