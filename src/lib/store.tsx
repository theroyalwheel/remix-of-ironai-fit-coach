import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppState, ChatMessage, Profile, SessionRecord, Workout } from "./types";

const STORAGE_KEY = "ironai.state.v1";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  goal: "Build muscle",
  level: "Beginner",
  trainingDays: [1, 3, 5],
  reminderTime: "18:00",
  remindersEnabled: true,
  onboarded: false,
};

const EMPTY_STATE: AppState = { profile: DEFAULT_PROFILE, sessions: [], chat: [] };

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

function readState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile ?? {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      chat: Array.isArray(parsed.chat) ? parsed.chat : [],
    };
  } catch {
    return EMPTY_STATE;
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

interface StoreValue {
  hydrated: boolean;
  profile: Profile;
  sessions: SessionRecord[];
  chat: ChatMessage[];
  stats: Stats;
  updateProfile: (patch: Partial<Profile>) => void;
  completeWorkout: (workout: Workout) => void;
  undoLastSession: () => void;
  appendChat: (msg: Omit<ChatMessage, "id" | "at">) => void;
  clearChat: () => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — app keeps working in memory */
    }
  }, [state, hydrated]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const completeWorkout = useCallback((workout: Workout) => {
    setState((s) => ({
      ...s,
      sessions: [
        ...s.sessions,
        {
          id: `${workout.id}-${Date.now()}`,
          workoutId: workout.id,
          title: workout.title,
          category: workout.category,
          muscles: workout.muscles,
          durationMin: workout.durationMin,
          calories: workout.calories,
          date: todayKey(),
          at: Date.now(),
        },
      ],
    }));
  }, []);

  const undoLastSession = useCallback(() => {
    setState((s) => {
      if (s.sessions.length === 0) return s;
      const sorted = [...s.sessions].sort((a, b) => b.at - a.at);
      const [last, ...rest] = sorted;
      void last;
      return { ...s, sessions: rest };
    });
  }, []);

  const appendChat = useCallback((msg: Omit<ChatMessage, "id" | "at">) => {
    setState((s) => ({
      ...s,
      chat: [
        ...s.chat,
        { ...msg, id: `${msg.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: Date.now() },
      ].slice(-60),
    }));
  }, []);

  const clearChat = useCallback(() => setState((s) => ({ ...s, chat: [] })), []);
  const resetAll = useCallback(() => setState(EMPTY_STATE), []);

  const stats = useMemo(() => computeStats(state.sessions), [state.sessions]);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      profile: state.profile,
      sessions: state.sessions,
      chat: state.chat,
      stats,
      updateProfile,
      completeWorkout,
      undoLastSession,
      appendChat,
      clearChat,
      resetAll,
    }),
    [
      hydrated,
      state.profile,
      state.sessions,
      state.chat,
      stats,
      updateProfile,
      completeWorkout,
      undoLastSession,
      appendChat,
      clearChat,
      resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}
