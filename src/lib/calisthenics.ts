import type { Level } from "./types";

export const CAL_CATEGORIES = [
  "Push",
  "Pull",
  "Legs",
  "Glutes",
  "Core",
  "Full body",
  "Mobility",
  "Conditioning",
  "Balance",
  "Skills",
] as const;
export type CalCategory = (typeof CAL_CATEGORIES)[number];

export const CAL_MUSCLES = [
  "Chest",
  "Shoulders",
  "Triceps",
  "Back",
  "Biceps",
  "Forearms & grip",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
  "Obliques",
  "Lower back",
  "Hip flexors",
] as const;
export type CalMuscle = (typeof CAL_MUSCLES)[number];

export const CAL_PATTERNS = [
  "Push-up",
  "Vertical push",
  "Dip",
  "Horizontal pull",
  "Vertical pull",
  "Scapular",
  "Squat",
  "Lunge",
  "Hinge",
  "Calf",
  "Anti-extension",
  "Anti-rotation",
  "Flexion",
  "Rotation",
  "Locomotion",
  "Plyometric",
  "Stretch",
  "Balance",
  "Hold",
] as const;
export type CalPattern = (typeof CAL_PATTERNS)[number];

export const CAL_GOALS = ["Strength", "Muscle", "Fat loss", "Endurance", "Mobility", "Skill"] as const;
export type CalGoal = (typeof CAL_GOALS)[number];

/**
 * "None"      = literally bodyweight, floor and wall only.
 * "Structure" = uses an ordinary, permanently fixed, weight-rated structure
 *               (a fixed pull-up bar, a solid step, a heavy table that cannot tip).
 *               Never improvised furniture, never a door on its hinges.
 */
export type CalEquipment = "None" | "Structure";

export interface CalPrescription {
  sets: string;
  reps?: string;
  time?: string;
  rest: string;
}

export interface CalExercise {
  id: string;
  name: string;
  category: CalCategory;
  level: Level;
  pattern: CalPattern;
  primary: CalMuscle[];
  secondary: CalMuscle[];
  equipment: CalEquipment;
  structureNote?: string;
  summary: string;
  instructions: string[];
  cues: string[];
  mistakes: string[];
  breathing: string;
  regression: string;
  progression: string;
  rx: CalPrescription;
  safety: string;
  goals: CalGoal[];
  minutes: number;
}

export interface ProgressionTree {
  id: string;
  name: string;
  pattern: string;
  description: string;
  steps: string[]; // exercise ids, easiest first
}

export interface RoutineBlock {
  exerciseId: string;
  work: string;
  rest: string;
}

export interface Routine {
  id: string;
  name: string;
  minutes: 5 | 10 | 15 | 20 | 30;
  level: Level;
  focus: "Full body" | "Upper" | "Lower" | "Core" | "Mobility" | "Conditioning";
  equipment: CalEquipment;
  summary: string;
  blocks: RoutineBlock[];
}

/** A routine the user assembled in the workout builder. */
export interface CustomRoutine {
  id: string;
  name: string;
  createdAt: number;
  blocks: RoutineBlock[];
}

export const CALISTHENICS_SAFETY: string[] = [
  "Use only permanently fixed, weight-rated structures. Never hang from a door, a towel rail, a shelf or stacked furniture.",
  "Train on a stable, non-slip floor with clear space above and around you — especially for jumps, bridges and any inverted work.",
  "Sharp, stabbing or joint-line pain means stop. Dull muscular burn and heavy breathing are normal exertion.",
  "Stop immediately for dizziness, chest pain, tingling down an arm, vision changes or breathlessness that will not settle, and get medical advice.",
  "Warm up 3-5 minutes before hard sets, and progress by one step at a time — add reps before you add difficulty.",
  "If you are pregnant, recovering from injury or new to exercise, check with a clinician before starting inverted, plyometric or maximal work.",
];
