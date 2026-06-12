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

  // BICEPS
  { id: "barbell_curl", name: "Barbell Curl", slot: "biceps", equipment: "barbell" },
  { id: "ez_bar_curl", name: "EZ Bar Curl", slot: "biceps", equipment: "barbell" },
  { id: "alternating_dumbbell_curl", name: "Alternating Dumbbell Curl", slot: "biceps", equipment: "dumbbells" },
  { id: "hammer_curl", name: "Hammer Curl", slot: "biceps", equipment: "dumbbells" },
  { id: "preacher_curl_machine", name: "Preacher Curl Machine", slot: "biceps", equipment: "machines" },
  { id: "cable_curl", name: "Cable Curl", slot: "biceps", equipment: "cables" },
  { id: "chin_up_biceps", name: "Chin-Up", slot: "biceps", equipment: "bodyweight" },

  // TRICEPS
  { id: "close_grip_bench_press", name: "Close Grip Bench Press", slot: "triceps", equipment: "barbell" },
  { id: "skullcrusher", name: "Skullcrusher", slot: "triceps", equipment: "barbell" },
  { id: "overhead_dumbbell_extension", name: "Overhead Dumbbell Extension", slot: "triceps", equipment: "dumbbells" },
  { id: "dip_machine", name: "Dip Machine", slot: "triceps", equipment: "machines" },
  { id: "triceps_pushdown", name: "Triceps Pushdown", slot: "triceps", equipment: "cables" },
  { id: "rope_pushdown", name: "Rope Pushdown", slot: "triceps", equipment: "cables" },
  { id: "bench_dip", name: "Bench Dip", slot: "triceps", equipment: "bodyweight" },

  // QUADS
  { id: "back_squat", name: "Back Squat", slot: "quads", equipment: "barbell" },
  { id: "front_squat", name: "Front Squat", slot: "quads", equipment: "barbell" },
  { id: "goblet_squat", name: "Goblet Squat", slot: "quads", equipment: "dumbbells" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", slot: "quads", equipment: "dumbbells" },
  { id: "leg_press", name: "Leg Press", slot: "quads", equipment: "machines" },
  { id: "leg_extension", name: "Leg Extension", slot: "quads", equipment: "machines" },
  { id: "air_squat", name: "Air Squat", slot: "quads", equipment: "bodyweight" },
  { id: "walking_lunge_quads", name: "Walking Lunge", slot: "quads", equipment: "bodyweight" },
];
