import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  ChatMessage,
  MealLog,
  Measurement,
  PendingOp,
  Profile,
  Recipe,
  SessionRecord,
  Workout,
} from "./types";

const STORAGE_KEY = "ironai.state.v1";
const QUEUE_KEY = "ironai.queue.v1";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  goal: "Build muscle",
  level: "Beginner",
  trainingDays: [1, 3, 5],
  reminderTime: "18:00",
  remindersEnabled: true,
  onboarded: false,
};

const EMPTY_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  sessions: [],
  meals: [],
  measurements: [],
  favorites: [],
  chat: [],
  conversationId: null,
};

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOffsetKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return todayKey(d);
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile ?? {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      chat: Array.isArray(parsed.chat) ? parsed.chat : [],
      conversationId: typeof parsed.conversationId === "string" ? parsed.conversationId : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function readQueue(): PendingOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PendingOp[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface Stats {
  total: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  totalMinutes: number;
  totalCalories: number;
  trainedToday: boolean;
  muscleActivity: { muscle: string; count: number }[];
  weekly: { label: string; date: string; count: number; minutes: number }[];
  recent: SessionRecord[];
}

function computeStats(sessions: SessionRecord[]): Stats {
  const dates = new Set(sessions.map((s) => s.date));
  const today = todayKey();
  const trainedToday = dates.has(today);

  let currentStreak = 0;
  for (let i = trainedToday ? 0 : 1; i < 400; i++) {
    if (dates.has(dayOffsetKey(i))) currentStreak++;
    else break;
  }

  const sorted = Array.from(dates).sort();
  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = new Date(`${d}T00:00:00`).getTime();
    if (prev !== null && Math.round((t - prev) / 86400000) === 1) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
    prev = t;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const weekly = Array.from({ length: 7 }, (_, idx) => {
    const offset = 6 - idx;
    const key = dayOffsetKey(offset);
    const d = new Date(`${key}T00:00:00`);
    const daySessions = sessions.filter((s) => s.date === key);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      date: key,
      count: daySessions.length,
      minutes: daySessions.reduce((a, s) => a + s.durationMin, 0),
    };
  });

  const weekKeys = new Set(weekly.map((x) => x.date));
  const thisWeek = sessions.filter((s) => weekKeys.has(s.date)).length;

  const counts = new Map<string, number>();
  for (const s of sessions) {
    for (const m of s.muscles) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const muscleActivity = Array.from(counts, ([muscle, count]) => ({ muscle, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    total: sessions.length,
    currentStreak,
    longestStreak,
    thisWeek,
    totalMinutes: sessions.reduce((a, s) => a + s.durationMin, 0),
    totalCalories: sessions.reduce((a, s) => a + s.calories, 0),
    trainedToday,
    muscleActivity,
    weekly,
    recent: [...sessions].sort((a, b) => b.at - a.at).slice(0, 10),
  };
}

export interface TodayIntake {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: MealLog[];
}

interface StoreValue {
  hydrated: boolean;
  profile: Profile;
  sessions: SessionRecord[];
  meals: MealLog[];
  measurements: Measurement[];
  favorites: string[];
  chat: ChatMessage[];
  conversationId: string | null;
  stats: Stats;
  todayIntake: TodayIntake;
  queue: PendingOp[];
  updateProfile: (patch: Partial<Profile>) => void;
  completeWorkout: (workout: Workout, extra?: { effort?: number; notes?: string }) => void;
  deleteSession: (id: string) => void;
  undoLastSession: () => void;
  logMeal: (recipe: Recipe, servings: number) => void;
  deleteMeal: (id: string) => void;
  logMeasurement: (kind: Measurement["kind"], value: number) => void;
  toggleFavorite: (workoutId: string) => void;
  appendChat: (msg: Omit<ChatMessage, "id" | "at">) => ChatMessage;
  setConversationId: (id: string | null) => void;
  clearChat: () => void;
  resetAll: () => void;
  replaceState: (next: Partial<AppState>) => void;
  mergeRemote: (patch: Partial<AppState>) => void;
  enqueue: (op: Omit<PendingOp, "id" | "at">) => void;
  clearQueue: (ids: string[]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [queue, setQueue] = useState<PendingOp[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  useEffect(() => {
    setState(readState());
    setQueue(readQueue());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      /* storage full or unavailable — app keeps working in memory */
    }
  }, [state, queue, hydrated]);

  // Keep other tabs of the same app in sync.
  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readState());
      if (e.key === QUEUE_KEY) setQueue(readQueue());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

  const enqueue = useCallback((op: Omit<PendingOp, "id" | "at">) => {
    setQueue((q) => [...q, { ...op, id: uid("op"), at: Date.now() }].slice(-500));
  }, []);

  const clearQueue = useCallback((ids: string[]) => {
    const drop = new Set(ids);
    setQueue((q) => q.filter((op) => !drop.has(op.id)));
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => {
      setState((s) => {
        const profile = { ...s.profile, ...patch };
        return { ...s, profile };
      });
      enqueue({ table: "profiles", action: "upsert", payload: patch as Record<string, unknown> });
    },
    [enqueue],
  );

  const completeWorkout = useCallback(
    (workout: Workout, extra?: { effort?: number; notes?: string }) => {
      const record: SessionRecord = {
        id: uid(workout.id),
        workoutId: workout.id,
        title: workout.title,
        category: workout.category,
        muscles: workout.muscles,
        durationMin: workout.durationMin,
        calories: workout.calories,
        date: todayKey(),
        at: Date.now(),
        ...(extra?.effort !== undefined ? { effort: extra.effort } : {}),
        ...(extra?.notes ? { notes: extra.notes } : {}),
      };
      setState((s) => ({ ...s, sessions: [...s.sessions, record] }));
      enqueue({
        table: "workout_sessions",
        action: "upsert",
        payload: record as unknown as Record<string, unknown>,
      });
    },
    [enqueue],
  );

  const deleteSession = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
      enqueue({ table: "workout_sessions", action: "delete", payload: { id } });
    },
    [enqueue],
  );

  const undoLastSession = useCallback(() => {
    const last = [...stateRef.current.sessions].sort((a, b) => b.at - a.at)[0];
    if (last) deleteSession(last.id);
  }, [deleteSession]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const logMeal = useCallback(
    (recipe: Recipe, servings: number) => {
      const s = Math.max(0.25, servings);
      const record: MealLog = {
        id: uid(recipe.id),
        recipeId: recipe.id,
        title: recipe.title,
        servings: s,
        calories: Math.round(recipe.calories * s),
        protein: Math.round(recipe.protein * s),
        carbs: Math.round(recipe.carbs * s),
        fat: Math.round(recipe.fat * s),
        date: todayKey(),
        at: Date.now(),
      };
      setState((prev) => ({ ...prev, meals: [...prev.meals, record] }));
      enqueue({
        table: "nutrition_logs",
        action: "upsert",
        payload: record as unknown as Record<string, unknown>,
      });
    },
    [enqueue],
  );

  const deleteMeal = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
      enqueue({ table: "nutrition_logs", action: "delete", payload: { id } });
    },
    [enqueue],
  );

  const logMeasurement = useCallback(
    (kind: Measurement["kind"], value: number) => {
      const record: Measurement = { id: uid(kind), kind, value, date: todayKey(), at: Date.now() };
      setState((s) => ({ ...s, measurements: [...s.measurements, record] }));
      enqueue({
        table: "measurements",
        action: "upsert",
        payload: record as unknown as Record<string, unknown>,
      });
    },
    [enqueue],
  );

  const toggleFavorite = useCallback(
    (workoutId: string) => {
      const has = stateRef.current.favorites.includes(workoutId);
      setState((s) => ({
        ...s,
        favorites: has ? s.favorites.filter((f) => f !== workoutId) : [...s.favorites, workoutId],
      }));
      enqueue({
        table: "favorites",
        action: has ? "delete" : "upsert",
        payload: { workout_id: workoutId },
      });
    },
    [enqueue],
  );

  const appendChat = useCallback((msg: Omit<ChatMessage, "id" | "at">) => {
    const full: ChatMessage = { ...msg, id: uid(msg.role), at: Date.now() };
    setState((s) => ({ ...s, chat: [...s.chat, full].slice(-80) }));
    return full;
  }, []);

  const setConversationId = useCallback(
    (id: string | null) => setState((s) => ({ ...s, conversationId: id })),
    [],
  );

  const clearChat = useCallback(
    () => setState((s) => ({ ...s, chat: [], conversationId: null })),
    [],
  );

  const resetAll = useCallback(() => {
    setState(EMPTY_STATE);
    setQueue([]);
  }, []);

  const replaceState = useCallback((next: Partial<AppState>) => {
    setState((s) => ({ ...s, ...next, profile: { ...s.profile, ...(next.profile ?? {}) } }));
  }, []);

  const mergeRemote = useCallback((patch: Partial<AppState>) => {
    setState((s) => {
      const byId = <T extends { id: string; at: number }>(local: T[], remote?: T[]): T[] => {
        if (!remote) return local;
        const map = new Map(local.map((x) => [x.id, x]));
        for (const r of remote) map.set(r.id, { ...(map.get(r.id) ?? r), ...r });
        return Array.from(map.values()).sort((a, b) => a.at - b.at);
      };
      return {
        ...s,
        profile: patch.profile ? { ...s.profile, ...patch.profile } : s.profile,
        sessions: byId(s.sessions, patch.sessions),
        meals: byId(s.meals, patch.meals),
        measurements: byId(s.measurements, patch.measurements),
        favorites: patch.favorites
          ? Array.from(new Set([...patch.favorites]))
          : s.favorites,
        chat: patch.chat ? byId(s.chat, patch.chat) : s.chat,
        conversationId: patch.conversationId ?? s.conversationId,
      };
    });
  }, []);

  const stats = useMemo(() => computeStats(state.sessions), [state.sessions]);

  const todayIntake = useMemo<TodayIntake>(() => {
    const today = todayKey();
    const meals = state.meals.filter((m) => m.date === today);
    return {
      meals,
      calories: meals.reduce((a, m) => a + m.calories, 0),
      protein: meals.reduce((a, m) => a + m.protein, 0),
      carbs: meals.reduce((a, m) => a + m.carbs, 0),
      fat: meals.reduce((a, m) => a + m.fat, 0),
    };
  }, [state.meals]);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      profile: state.profile,
      sessions: state.sessions,
      meals: state.meals,
      measurements: state.measurements,
      favorites: state.favorites,
      chat: state.chat,
      conversationId: state.conversationId,
      stats,
      todayIntake,
      queue,
      updateProfile,
      completeWorkout,
      deleteSession,
      undoLastSession,
      logMeal,
      deleteMeal,
      logMeasurement,
      toggleFavorite,
      appendChat,
      setConversationId,
      clearChat,
      resetAll,
      replaceState,
      mergeRemote,
      enqueue,
      clearQueue,
    }),
    [
      hydrated,
      state,
      stats,
      todayIntake,
      queue,
      updateProfile,
      completeWorkout,
      deleteSession,
      undoLastSession,
      logMeal,
      deleteMeal,
      logMeasurement,
      toggleFavorite,
      appendChat,
      setConversationId,
      clearChat,
      resetAll,
      replaceState,
      mergeRemote,
      enqueue,
      clearQueue,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}
