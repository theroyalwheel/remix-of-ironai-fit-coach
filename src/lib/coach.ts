import { WORKOUTS, getWorkout } from "@/data/workouts";
import { RECIPES } from "@/data/recipes";
import { LESSONS } from "@/data/lessons";
import type { Profile, SessionRecord, Workout } from "./types";
import type { Stats } from "./store";

export interface CoachContextData {
  profile: Profile;
  stats: Pick<
    Stats,
    "total" | "currentStreak" | "longestStreak" | "thisWeek" | "totalMinutes" | "trainedToday"
  >;
  recentSessions: { title: string; date: string; category: string }[];
  recommendation: { id: string; title: string; reason: string };
}

export interface CoachProvider {
  id: string;
  reply(message: string, ctx: CoachContextData): Promise<string>;
}

/* ---------------- recommendation engine ---------------- */

const GOAL_BIAS: Record<Profile["goal"], { Strength: number; Cardio: number; Mobility: number }> = {
  "Build muscle": { Strength: 3, Cardio: 1, Mobility: 1 },
  "Lose fat": { Strength: 2, Cardio: 3, Mobility: 1 },
  "Get stronger": { Strength: 4, Cardio: 1, Mobility: 1 },
  "Improve endurance": { Strength: 1, Cardio: 4, Mobility: 1 },
  "Stay healthy": { Strength: 2, Cardio: 2, Mobility: 2 },
};

export function recommendWorkout(
  profile: Profile,
  sessions: SessionRecord[],
): { workout: Workout; reason: string } {
  const recent = [...sessions].sort((a, b) => b.at - a.at).slice(0, 5);
  const recentIds = new Set(recent.map((s) => s.workoutId));
  const recentMuscles = new Set(recent.slice(0, 2).flatMap((s) => s.muscles));
  const bias = GOAL_BIAS[profile.goal];

  const levelScore = (w: Workout) => {
    if (w.level === profile.level) return 3;
    if (profile.level === "Intermediate") return 2;
    if (profile.level === "Beginner" && w.level === "Intermediate") return 1;
    if (profile.level === "Advanced" && w.level === "Intermediate") return 2;
    return 0;
  };

  let best = WORKOUTS[0] as Workout;
  let bestScore = -Infinity;
  for (const w of WORKOUTS) {
    let score = bias[w.category] * 2 + levelScore(w);
    if (recentIds.has(w.id)) score -= 5;
    const overlap = w.muscles.filter((m) => recentMuscles.has(m)).length;
    score -= overlap * 1.5;
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }

  const lastTitle = recent[0]?.title;
  const reason = lastTitle
    ? `Balances your last session (${lastTitle}) and fits your goal to ${profile.goal.toLowerCase()}.`
    : `A ${best.level.toLowerCase()}-friendly ${best.category.toLowerCase()} session matched to your goal to ${profile.goal.toLowerCase()}.`;

  return { workout: best, reason };
}

export function buildCoachContext(
  profile: Profile,
  sessions: SessionRecord[],
  stats: Stats,
): CoachContextData {
  const { workout, reason } = recommendWorkout(profile, sessions);
  return {
    profile,
    stats: {
      total: stats.total,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      thisWeek: stats.thisWeek,
      totalMinutes: stats.totalMinutes,
      trainedToday: stats.trainedToday,
    },
    recentSessions: stats.recent.slice(0, 5).map((s) => ({
      title: s.title,
      date: s.date,
      category: s.category,
    })),
    recommendation: { id: workout.id, title: workout.title, reason },
  };
}

export function coachSystemPrompt(ctx: CoachContextData): string {
  const p = ctx.profile;
  return [
    "You are Coach Bolt, the personal strength and conditioning coach inside the IronAI Fitness app.",
    "Be warm, direct and specific. Never invent medical advice. Keep replies under 160 words and use short paragraphs or bullets.",
    `Athlete: ${p.name || "Athlete"} | goal: ${p.goal} | experience: ${p.level} | trains ${p.trainingDays.length} days/week.`,
    `Stats: ${ctx.stats.total} total workouts, ${ctx.stats.currentStreak}-day streak (best ${ctx.stats.longestStreak}), ${ctx.stats.thisWeek} this week, ${ctx.stats.totalMinutes} total minutes, trained today: ${ctx.stats.trainedToday ? "yes" : "no"}.`,
    `Recent sessions: ${ctx.recentSessions.map((s) => `${s.title} (${s.date})`).join(", ") || "none yet"}.`,
    `Today's recommended session: ${ctx.recommendation.title} — ${ctx.recommendation.reason}`,
  ].join("\n");
}

/* ---------------- local fallback coach ---------------- */

function firstName(name: string): string {
  return name.trim().split(" ")[0] || "athlete";
}

function encouragement(ctx: CoachContextData): string {
  const n = firstName(ctx.profile.name);
  const s = ctx.stats;
  if (s.total === 0)
    return `Everyone starts at zero, ${n}. One session logged today changes the whole trajectory.`;
  if (s.trainedToday)
    return `Session already banked today, ${n}. That's ${s.thisWeek} this week and a ${s.currentStreak}-day streak — recovery is now part of the work.`;
  if (s.currentStreak >= 3)
    return `${s.currentStreak} days straight, ${n}. Streaks like this are how ${s.total} sessions turned into real training. Don't break it today.`;
  return `You're at ${s.total} logged sessions, ${n}, with ${s.thisWeek} this week. Consistency beats intensity — let's get one in.`;
}

function techniqueAnswer(query: string): string | null {
  const q = query.toLowerCase();
  const map: { keys: string[]; text: string }[] = [
    {
      keys: ["squat"],
      text: "Squat: bar set, big brace, feet shoulder-width with toes out 15-30°. Break at hips and knees together, knees track over the middle toes, descend until the hip crease is below the knee without your pelvis tucking. Drive the whole foot through the floor on the way up.",
    },
    {
      keys: ["deadlift"],
      text: "Deadlift: bar over mid-foot, hinge to it without moving it. Grip, pull the slack out until the bar clicks, set the lats by 'squeezing oranges' in the armpits. Hips and chest rise together — if the hips shoot first, lighten the load and do paused pulls below the knee.",
    },
    {
      keys: ["bench", "press", "push-up", "pushup"],
      text: "Pressing: shoulder blades pinned down and back, ribs stacked, elbows 45-70° from the torso. Lower under control for 3 seconds to mid-chest, no bounce, then press in a slight arc back over the shoulders. If an angle pinches, switch to neutral-grip dumbbells.",
    },
    {
      keys: ["pull-up", "pullup", "row", "lat"],
      text: "Pulling: the shoulder blade moves first, then the elbow bends. Start from a dead hang or a full stretch, pull the elbows to your pockets, pause a second at the top and control a 3-second negative. Keep the torso still on rows — no heaving.",
    },
    {
      keys: ["plank", "core", "abs"],
      text: "Core work should be anti-movement: planks for anti-extension, Pallof presses for anti-rotation, suitcase carries for anti-side-bend. Exhale, pull the ribs down, squeeze the glutes and stop the set the moment the low back sags.",
    },
    {
      keys: ["warm", "warmup", "warm-up"],
      text: "Warm-up: 5 minutes easy cardio, 5 minutes of mobility for the day's joints, then ramp the main lift — empty bar, 40%, 60%, 80% for low reps. Skip long static stretching beforehand; it briefly lowers force output.",
    },
  ];
  for (const item of map) if (item.keys.some((k) => q.includes(k))) return item.text;
  return null;
}

function nutritionAnswer(query: string, ctx: CoachContextData): string | null {
  const q = query.toLowerCase();
  if (/(protein|macro)/.test(q)) {
    return "Aim for 1.6-2.2g of protein per kg of bodyweight daily, split across 3-5 meals. In the Nutrition tab, the Grilled Chicken & Quinoa Bowl (55g) and the Post-Workout Recovery Shake (42g) are the fastest ways to hit that.";
  }
  if (/(calorie|deficit|bulk|lose weight|fat loss|cut)/.test(q)) {
    return ctx.profile.goal === "Lose fat"
      ? "For fat loss, sit 15-20% below maintenance and target 0.5-1% bodyweight lost per week. Keep protein high and keep lifting — that's what protects muscle while the scale moves."
      : "Set calories from your goal: 10-15% above maintenance to build, 15-20% below to lose. Track weekly weight averages rather than daily readings — daily swings are mostly water.";
  }
  if (/(meal|recipe|eat|breakfast|dinner|lunch|snack)/.test(q)) {
    const picks = RECIPES.filter((r) => r.protein >= 40)
      .slice(0, 3)
      .map((r) => `${r.title} (${r.protein}g protein)`);
    return `Three high-protein options from your Nutrition tab: ${picks.join(", ")}. Build every meal around a palm-sized protein source, then add carbs to match your training load.`;
  }
  if (/(water|hydrat|electrolyte)/.test(q)) {
    return "Roughly 30-40ml of water per kg of bodyweight a day, plus 500-750ml per hour of hard training. Add sodium if you sweat heavily — cramps are usually electrolytes, not effort.";
  }
  return null;
}

function recoveryAnswer(query: string): string | null {
  const q = query.toLowerCase();
  if (/(sore|doms|ache)/.test(q))
    return "Soreness peaks 24-48h after unfamiliar work and clears within 72. Light movement, enough protein and sleep help most — try the Active Recovery Flow in the Mobility category rather than skipping the day entirely.";
  if (/(sleep|tired|fatigue|rest day|deload)/.test(q))
    return "Under 7 hours of sleep and both strength and fat loss suffer measurably. If lifts have stalled two weeks running and joints ache before sessions, take a deload: same exercises, half the sets, one week.";
  if (/(injur|pain|hurt)/.test(q))
    return "Sharp or joint pain is a stop signal, not something to push through — see a physio if it persists beyond a few days. In the meantime train around it: pain-free ranges, lighter loads and mobility work.";
  return null;
}

function workoutAnswer(query: string, ctx: CoachContextData): string | null {
  const q = query.toLowerCase();
  if (/(what should i do|next workout|today|recommend|what.*train)/.test(q)) {
    const rec = getWorkout(ctx.recommendation.id);
    const extra = rec ? ` It's ${rec.durationMin} minutes, ${rec.level}, hitting ${rec.muscles.join(", ")}.` : "";
    return `Today: ${ctx.recommendation.title}. ${ctx.recommendation.reason}${extra} Open it from the Workouts tab and hit Complete Workout when you're done.`;
  }
  const match = WORKOUTS.find((w) => q.includes(w.title.toLowerCase()));
  if (match) {
    return `${match.title} — ${match.description} Key cues: ${match.cues.slice(0, 2).join("; ")}. ${match.durationMin} min, ${match.level}, ${match.equipment}.`;
  }
  if (/(program|split|how many days|frequency|routine)/.test(q)) {
    return "Train each muscle twice a week. Three days available: full body. Four: upper/lower. Five to six: push/pull/legs. Start at 10-12 hard sets per muscle per week and only add sets when progress stalls.";
  }
  if (/(streak|progress|stats|how am i)/.test(q)) {
    const s = ctx.stats;
    return `You're on ${s.currentStreak} day(s), best ever ${s.longestStreak}. ${s.total} sessions and ${s.totalMinutes} minutes logged, ${s.thisWeek} this week. ${s.thisWeek >= 3 ? "That's a solid training week." : "Two or three more this week puts you in a strong rhythm."}`;
  }
  return null;
}

export const localCoach: CoachProvider = {
  id: "local",
  async reply(message, ctx) {
    const answer =
      workoutAnswer(message, ctx) ??
      techniqueAnswer(message) ??
      nutritionAnswer(message, ctx) ??
      recoveryAnswer(message);

    if (answer) return answer;

    const q = message.toLowerCase();
    if (/(hi|hey|hello|yo)\b/.test(q) || q.trim().length < 4) {
      return `${encouragement(ctx)} Ask me about technique, your next session, nutrition or recovery — I'll answer using your actual training history.`;
    }
    if (/(learn|explain|why|anatomy)/.test(q)) {
      const lesson = LESSONS.find((l) =>
        l.title.toLowerCase().split(" ").some((word) => word.length > 4 && q.includes(word)),
      );
      if (lesson) return `${lesson.summary} ${lesson.body[0]} Full lesson: "${lesson.title}" in the Learn tab.`;
    }
    return `${encouragement(ctx)} I can go deeper on squat, deadlift, pressing and pulling technique, protein and calorie targets, recovery and deloads, or what to train next. Your recommended session right now is ${ctx.recommendation.title}.`;
  },
};

export function coachGreeting(ctx: CoachContextData): string {
  return `${encouragement(ctx)} Today I'd put you on ${ctx.recommendation.title}. Ask me anything — technique, nutrition, recovery or programming.`;
}

export const QUICK_PROMPTS = [
  "What should I train today?",
  "How is my progress looking?",
  "Fix my squat technique",
  "How much protein do I need?",
  "I'm sore — should I train?",
];
