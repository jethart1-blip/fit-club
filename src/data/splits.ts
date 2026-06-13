import type { SplitId, SplitDefinition, DayTemplate, MuscleGroupSlot } from "../types";

const DEFAULT_REP_RANGE: DayTemplate["repRange"] = { sets: 3, min: 8, max: 10 };
const DEFAULT_REST_SECONDS = 90;

export const SPLITS: Record<SplitId, SplitDefinition> = {
  full_body: {
    id: "full_body",
    name: "Full Body",
    description: "Best for beginners and busy schedules.",
    dayTemplates: [
      {
        id: "full_body",
        name: "Full Body",
        slots: ["chest", "back", "shoulders", "quads", "hamstrings", "abs", "back", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  upper_lower: {
    id: "upper_lower",
    name: "Upper / Lower",
    description: "Best for most lifters training 4 days/week.",
    dayTemplates: [
      {
        id: "upper",
        name: "Upper",
        slots: ["chest", "back", "shoulders", "biceps", "triceps", "chest", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "lower",
        name: "Lower",
        slots: ["quads", "hamstrings", "glutes", "calves", "abs", "quads", "hamstrings"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    description: "Best for intermediate to advanced lifters training 5-6 days/week.",
    dayTemplates: [
      {
        id: "push",
        name: "Push (Chest, Shoulders, Triceps)",
        slots: ["chest", "shoulders", "triceps", "chest"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "pull",
        name: "Pull (Back, Biceps)",
        slots: ["back", "biceps", "forearms", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "legs",
        name: "Legs",
        slots: ["quads", "hamstrings", "glutes", "calves", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  bro_split: {
    id: "bro_split",
    name: "Body Part Split",
    description: "Best for high-volume bodybuilding.",
    dayTemplates: [
      {
        id: "chest_day",
        name: "Chest",
        slots: ["chest", "abs"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "back_day",
        name: "Back",
        slots: ["back", "forearms"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "shoulders_day",
        name: "Shoulders",
        slots: ["shoulders", "abs"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "arms_day",
        name: "Arms",
        slots: ["biceps", "triceps", "forearms"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "legs_day",
        name: "Legs",
        slots: ["quads", "hamstrings", "glutes", "calves", "quads", "hamstrings"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  arnold: {
    id: "arnold",
    name: "Arnold Split",
    description: "Best for bodybuilding and high frequency training.",
    dayTemplates: [
      {
        id: "chest_back",
        name: "Chest + Back",
        slots: ["chest", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "shoulders_arms",
        name: "Shoulders + Arms",
        slots: ["shoulders", "biceps", "triceps"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "legs",
        name: "Legs",
        slots: ["quads", "hamstrings", "glutes", "calves", "abs", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  pplul: {
    id: "pplul",
    name: "Push / Pull / Legs / Upper / Lower",
    description: "Best for 5-day training with good recovery.",
    dayTemplates: [
      {
        id: "push",
        name: "Push",
        slots: ["chest", "shoulders", "triceps", "chest"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "pull",
        name: "Pull",
        slots: ["back", "biceps", "forearms", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "legs",
        name: "Legs",
        slots: ["quads", "hamstrings", "glutes", "calves", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "upper",
        name: "Upper",
        slots: ["chest", "back", "shoulders", "biceps", "triceps", "chest", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "lower",
        name: "Lower",
        slots: ["quads", "hamstrings", "glutes", "calves", "abs", "quads", "hamstrings"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  ulppl: {
    id: "ulppl",
    name: "Upper / Lower / Push / Pull / Legs",
    description: "Best for advanced hypertrophy trainees.",
    dayTemplates: [
      {
        id: "upper",
        name: "Upper",
        slots: ["chest", "back", "shoulders", "biceps", "triceps", "chest", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "lower",
        name: "Lower",
        slots: ["quads", "hamstrings", "glutes", "calves", "abs", "quads", "hamstrings"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "push",
        name: "Push",
        slots: ["chest", "shoulders", "triceps", "chest"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "pull",
        name: "Pull",
        slots: ["back", "biceps", "forearms", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "legs",
        name: "Legs",
        slots: ["quads", "hamstrings", "glutes", "calves", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  torso_limbs: {
    id: "torso_limbs",
    name: "Torso / Limbs",
    description: "Best for bodybuilding with extra arm focus.",
    dayTemplates: [
      {
        id: "torso",
        name: "Torso",
        slots: ["chest", "back", "shoulders", "abs", "chest", "back"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "limbs",
        name: "Limbs",
        slots: ["biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "forearms", "quads"] as MuscleGroupSlot[],
        repRange: DEFAULT_REP_RANGE,
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  powerbuilding: {
    id: "powerbuilding",
    name: "Powerbuilding",
    description: "Best for building strength and size simultaneously.",
    dayTemplates: [
      {
        id: "upper_power",
        name: "Upper Power",
        slots: ["chest", "back", "shoulders", "triceps", "biceps"] as MuscleGroupSlot[],
        repRange: { sets: 4, min: 4, max: 6 },
        restSeconds: 180,
      },
      {
        id: "lower_power",
        name: "Lower Power",
        slots: ["quads", "hamstrings", "glutes"] as MuscleGroupSlot[],
        repRange: { sets: 4, min: 4, max: 6 },
        restSeconds: 180,
      },
      {
        id: "upper_hypertrophy",
        name: "Upper Hypertrophy",
        slots: ["chest", "back", "shoulders", "biceps", "triceps"] as MuscleGroupSlot[],
        repRange: { sets: 3, min: 10, max: 12 },
        restSeconds: DEFAULT_REST_SECONDS,
      },
      {
        id: "lower_hypertrophy",
        name: "Lower Hypertrophy",
        slots: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroupSlot[],
        repRange: { sets: 3, min: 10, max: 12 },
        restSeconds: DEFAULT_REST_SECONDS,
      },
    ],
  },

  strength_athlete: {
    id: "strength_athlete",
    name: "Strength Athlete Split",
    description: "Best for powerlifting.",
    dayTemplates: [
      {
        id: "squat_focus",
        name: "Squat Focus",
        slots: ["quads", "hamstrings", "abs"] as MuscleGroupSlot[],
        repRange: { sets: 5, min: 3, max: 5 },
        restSeconds: 180,
      },
      {
        id: "bench_focus",
        name: "Bench Focus",
        slots: ["chest", "triceps", "shoulders"] as MuscleGroupSlot[],
        repRange: { sets: 5, min: 3, max: 5 },
        restSeconds: 180,
      },
      {
        id: "deadlift_focus",
        name: "Deadlift Focus",
        slots: ["back", "hamstrings", "glutes"] as MuscleGroupSlot[],
        repRange: { sets: 5, min: 3, max: 5 },
        restSeconds: 180,
      },
      {
        id: "accessories",
        name: "Accessories",
        slots: ["biceps", "forearms", "calves", "abs"] as MuscleGroupSlot[],
        repRange: { sets: 3, min: 12, max: 15 },
        restSeconds: 60,
      },
    ],
  },

  custom: {
    id: "custom",
    name: "My Custom Split",
    description: "Built from the workouts you created in the Workout Builder.",
    dayTemplates: [],
  },

  basketball: {
    id: "basketball",
    name: "Basketball Performance",
    description: "Lower-body power, core stability, and balanced upper-body strength for explosiveness on the court.",
    dayTemplates: [
      { id: "bb_lower_power", name: "Lower Power", slots: ["quads", "hamstrings", "glutes", "calves", "abs"] as MuscleGroupSlot[], repRange: { sets: 4, min: 4, max: 6 }, restSeconds: 150 },
      { id: "bb_upper", name: "Upper Push/Pull", slots: ["chest", "back", "shoulders", "abs"] as MuscleGroupSlot[], repRange: { sets: 3, min: 8, max: 10 }, restSeconds: 90 },
      { id: "bb_lower_hyp", name: "Lower Hypertrophy + Core", slots: ["quads", "hamstrings", "glutes", "abs", "calves"] as MuscleGroupSlot[], repRange: { sets: 3, min: 10, max: 12 }, restSeconds: 90 },
    ],
  },

  football: {
    id: "football",
    name: "Football Performance",
    description: "Full-body strength and power, built around heavy lower-body and pressing/pulling work.",
    dayTemplates: [
      { id: "fb_lower", name: "Lower Strength", slots: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroupSlot[], repRange: { sets: 4, min: 4, max: 6 }, restSeconds: 150 },
      { id: "fb_push", name: "Upper Push", slots: ["chest", "shoulders", "triceps"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 8 }, restSeconds: 120 },
      { id: "fb_pull", name: "Upper Pull", slots: ["back", "biceps", "forearms"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 8 }, restSeconds: 120 },
      { id: "fb_power", name: "Power & Core", slots: ["quads", "glutes", "abs", "hamstrings"] as MuscleGroupSlot[], repRange: { sets: 5, min: 3, max: 5 }, restSeconds: 180 },
    ],
  },

  baseball: {
    id: "baseball",
    name: "Baseball Performance",
    description: "Rotational power, shoulder health, and lower-body strength for throwing and explosive movement.",
    dayTemplates: [
      { id: "bs_lower", name: "Lower Power", slots: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroupSlot[], repRange: { sets: 4, min: 4, max: 6 }, restSeconds: 150 },
      { id: "bs_upper", name: "Upper Balanced", slots: ["chest", "back", "shoulders", "biceps", "triceps"] as MuscleGroupSlot[], repRange: { sets: 3, min: 8, max: 10 }, restSeconds: 90 },
      { id: "bs_core_legs", name: "Core & Legs", slots: ["abs", "forearms", "quads", "hamstrings", "glutes"] as MuscleGroupSlot[], repRange: { sets: 3, min: 10, max: 12 }, restSeconds: 90 },
    ],
  },

  soccer: {
    id: "soccer",
    name: "Soccer Performance",
    description: "Endurance-focused leg work with core stability and balanced upper-body strength.",
    dayTemplates: [
      { id: "sc_lower", name: "Lower Endurance", slots: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroupSlot[], repRange: { sets: 3, min: 12, max: 15 }, restSeconds: 60 },
      { id: "sc_upper_core", name: "Upper + Core", slots: ["chest", "back", "shoulders", "abs"] as MuscleGroupSlot[], repRange: { sets: 3, min: 10, max: 12 }, restSeconds: 75 },
      { id: "sc_lower_core", name: "Lower + Core", slots: ["hamstrings", "glutes", "calves", "abs"] as MuscleGroupSlot[], repRange: { sets: 3, min: 12, max: 15 }, restSeconds: 60 },
    ],
  },

  stronglifts: {
    id: "stronglifts",
    name: "StrongLifts 5x5",
    description: "A classic beginner strength program: 2 alternating full-body workouts, 5 sets of 5 reps on the big barbell lifts.",
    dayTemplates: [
      { id: "sl_a", name: "Workout A", slots: ["quads", "chest", "back"] as MuscleGroupSlot[], repRange: { sets: 5, min: 5, max: 5 }, restSeconds: 120 },
      { id: "sl_b", name: "Workout B", slots: ["quads", "shoulders", "back"] as MuscleGroupSlot[], repRange: { sets: 5, min: 5, max: 5 }, restSeconds: 120 },
    ],
  },

  gzclp: {
    id: "gzclp",
    name: "GZCLP (Simplified)",
    description: "A simplified 4-day adaptation of GZCLP, rotating squat/bench/deadlift/OHP as the main lift each day with accessory work. Note: true GZCLP uses tiered set/rep schemes (T1/T2/T3) per exercise, which this app approximates with a single rep range per day.",
    dayTemplates: [
      { id: "gz_1", name: "Day 1: Squat Focus", slots: ["quads", "chest", "back", "abs"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 5 }, restSeconds: 120 },
      { id: "gz_2", name: "Day 2: OHP Focus", slots: ["shoulders", "back", "biceps", "abs"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 5 }, restSeconds: 120 },
      { id: "gz_3", name: "Day 3: Bench Focus", slots: ["chest", "quads", "back", "triceps"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 5 }, restSeconds: 120 },
      { id: "gz_4", name: "Day 4: Deadlift Focus", slots: ["back", "shoulders", "biceps", "abs"] as MuscleGroupSlot[], repRange: { sets: 4, min: 5, max: 5 }, restSeconds: 120 },
    ],
  },
};
