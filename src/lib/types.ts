export type Category = "Strength" | "Cardio" | "Mobility";
export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Workout {
  id: string;
  title: string;
  category: Category;
  muscles: string[];
  level: Level;
  durationMin: number;
  calories: number;
  equipment: string;
  description: string;
  cues: string[];
  videoUrl: string;
}

export interface Recipe {
  id: string;
  title: string;
  tag: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Shake";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  minutes: number;
  ingredients: string[];
  steps: string[];
  note: string;
}

export interface Lesson {
  id: string;
  title: string;
  topic: "Anatomy" | "Technique" | "Recovery" | "Nutrition" | "Programming";
  readMinutes: number;
  summary: string;
  body: string[];
}

export type Goal =
  | "Build muscle"
  | "Lose fat"
  | "Get stronger"
  | "Improve endurance"
  | "Stay healthy";

export interface Profile {
  name: string;
  goal: Goal;
  level: Level;
  trainingDays: number[]; // 0=Sun..6=Sat
  reminderTime: string; // "18:30"
  remindersEnabled: boolean;
  onboarded: boolean;
  weightKg?: number;
  heightCm?: number;
  calorieTarget?: number;
  proteinTarget?: number;
}

export interface SessionRecord {
  id: string; // unique log id, used as client_operation_id in the cloud
  workoutId: string;
  title: string;
  category: Category;
  muscles: string[];
  durationMin: number;
  calories: number;
  date: string; // ISO yyyy-mm-dd
  at: number; // timestamp
  notes?: string;
  effort?: number;
}

export interface MealLog {
  id: string;
  recipeId: string;
  title: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  at: number;
}

export interface Measurement {
  id: string;
  kind: "weight" | "sleep";
  value: number;
  date: string;
  at: number;
}

export interface AppState {
  profile: Profile;
  sessions: SessionRecord[];
  meals: MealLog[];
  measurements: Measurement[];
  favorites: string[];
  chat: ChatMessage[];
  conversationId: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  at: number;
}

/** A local mutation waiting to be pushed to the cloud. */
export interface PendingOp {
  id: string;
  table: "profiles" | "workout_sessions" | "nutrition_logs" | "measurements" | "favorites" | "coach_messages";
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
  at: number;
}
