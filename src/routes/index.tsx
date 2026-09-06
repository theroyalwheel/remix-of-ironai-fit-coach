import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Flame, MessageSquare, Timer } from "lucide-react";
import { useApp } from "@/lib/store";
import { recommendWorkout } from "@/lib/coach";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IronAI Fitness — Your AI strength coach" },
      {
        name: "description",
        content:
          "Train with Coach Bolt: personalised workouts, streak tracking, high-protein recipes and technique lessons in one mobile-first app.",
      },
      { property: "og:title", content: "IronAI Fitness — Your AI strength coach" },
      {
        property: "og:description",
        content:
          "Personalised workouts, streak tracking, high-protein recipes and technique lessons with Coach Bolt.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { hydrated, profile, sessions, stats } = useApp();

  if (!hydrated) {
    return (
      <div className="space-y-4 px-4 py-6 pb-28">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { workout, reason } = recommendWorkout(profile, sessions);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 px-4 py-6 pb-28">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {greeting}
        </p>
        <h1 className="font-display text-4xl font-bold uppercase leading-none">
          {profile.name || "Athlete"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stats.trainedToday
            ? "Session logged today — recovery counts as training."
            : "No session logged yet today. Coach Bolt has a plan for you."}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`${stats.currentStreak}d`} />
        <Stat label="This week" value={`${stats.thisWeek}`} />
        <Stat label="Minutes" value={`${stats.totalMinutes}`} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Today&apos;s recommendation
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-tight">
          {workout.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{reason}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Chip icon={<Dumbbell className="size-3.5" />}>{workout.category}</Chip>
          <Chip icon={<Timer className="size-3.5" />}>{workout.durationMin} min</Chip>
          <Chip icon={<Flame className="size-3.5" />}>{workout.calories} kcal</Chip>
        </div>
        <Button asChild className="mt-4 w-full">
          <Link to="/workouts/$workoutId" params={{ workoutId: workout.id }}>
            Start workout <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/coach"
          className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
        >
          <MessageSquare className="size-5 text-accent" aria-hidden="true" />
          <p className="mt-2 font-semibold">Coach Bolt</p>
          <p className="text-xs text-muted-foreground">Ask about technique or nutrition</p>
        </Link>
        <Link
          to="/progress"
          className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
        >
          <Flame className="size-5 text-primary" aria-hidden="true" />
          <p className="mt-2 font-semibold">Progress</p>
          <p className="text-xs text-muted-foreground">{stats.total} sessions logged</p>
        </Link>
      </section>

      {stats.recent.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-xl font-bold uppercase">Recent sessions</h2>
          <ul className="space-y-2">
            {stats.recent.slice(0, 4).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-muted-foreground">{s.date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
      {icon}
      {children}
    </span>
  );
}
