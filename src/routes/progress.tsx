import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — IronAI Fitness" },
      {
        name: "description",
        content:
          "Track workouts, streaks, weekly minutes, muscle-group balance, bodyweight and sleep in IronAI Fitness.",
      },
      { property: "og:title", content: "Progress — IronAI Fitness" },
      {
        property: "og:description",
        content: "Streaks, weekly volume, muscle balance and session history.",
      },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { hydrated, stats, measurements, logMeasurement, deleteSession } = useApp();
  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");

  if (!hydrated) {
    return (
      <div className="space-y-4 px-4 py-6 pb-28">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const maxMinutes = Math.max(1, ...stats.weekly.map((d) => d.minutes));
  const maxMuscle = Math.max(1, ...stats.muscleActivity.map((m) => m.count));
  const lastWeight = [...measurements].reverse().find((m) => m.kind === "weight");
  const lastSleep = [...measurements].reverse().find((m) => m.kind === "sleep");

  return (
    <div className="space-y-6 px-4 py-6 pb-28">
      <h1 className="font-display text-3xl font-bold uppercase">Progress</h1>

      <section className="grid grid-cols-2 gap-2">
        <Card label="Total workouts" value={`${stats.total}`} />
        <Card label="Current streak" value={`${stats.currentStreak} d`} />
        <Card label="Longest streak" value={`${stats.longestStreak} d`} />
        <Card label="This week" value={`${stats.thisWeek}`} />
        <Card label="Total minutes" value={`${stats.totalMinutes}`} />
        <Card label="Calories burned" value={`${stats.totalCalories}`} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Last 7 days</h2>
        <div className="flex items-end justify-between gap-2 rounded-2xl border border-border bg-surface p-4">
          {stats.weekly.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{d.minutes || ""}</span>
              <div
                className="w-full rounded-md bg-primary/80"
                style={{ height: `${8 + (d.minutes / maxMinutes) * 80}px` }}
                role="img"
                aria-label={`${d.label}: ${d.count} workouts, ${d.minutes} minutes`}
              />
              <span className="text-[11px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Muscle activity</h2>
        {stats.muscleActivity.length === 0 ? (
          <Empty>Complete a workout to see which muscles you&apos;re hitting.</Empty>
        ) : (
          <ul className="space-y-2">
            {stats.muscleActivity.map((m) => (
              <li key={m.muscle} className="text-sm">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{m.muscle}</span>
                  <span>{m.count}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(m.count / maxMuscle) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl font-bold uppercase">Body check-in</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="weight" className="text-xs text-muted-foreground">
              Bodyweight (kg)
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                id="weight"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={lastWeight ? `${lastWeight.value}` : "78"}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const v = Number(weight);
                  if (!Number.isFinite(v) || v <= 0) return;
                  logMeasurement("weight", v);
                  setWeight("");
                }}
              >
                Log
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="sleep" className="text-xs text-muted-foreground">
              Sleep (hours)
            </label>
            <div className="mt-1 flex gap-2">
              <Input
                id="sleep"
                inputMode="decimal"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder={lastSleep ? `${lastSleep.value}` : "7.5"}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const v = Number(sleep);
                  if (!Number.isFinite(v) || v <= 0) return;
                  logMeasurement("sleep", v);
                  setSleep("");
                }}
              >
                Log
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold uppercase">Recent sessions</h2>
        {stats.recent.length === 0 ? (
          <Empty>No sessions logged yet. Your first one starts the streak.</Empty>
        ) : (
          <ul className="space-y-2">
            {stats.recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.date} · {s.durationMin} min{s.effort ? ` · effort ${s.effort}/10` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${s.title} logged on ${s.date}`}
                  onClick={() => deleteSession(s.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
