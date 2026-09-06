import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { CATEGORIES, LEVELS, MUSCLE_GROUPS, searchWorkouts } from "@/data/workouts";
import type { Category, Level } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workouts/")({
  head: () => ({
    meta: [
      { title: "Workout library — IronAI Fitness" },
      {
        name: "description",
        content:
          "Search a full library of strength, cardio and mobility workouts by muscle group, difficulty and equipment.",
      },
      { property: "og:title", content: "Workout library — IronAI Fitness" },
      {
        property: "og:description",
        content: "Strength, cardio and mobility sessions filtered by muscle group and difficulty.",
      },
    ],
  }),
  component: WorkoutsIndex,
});

function WorkoutsIndex() {
  const { favorites } = useApp();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [muscle, setMuscle] = useState<string>("All");

  const results = useMemo(
    () => searchWorkouts(q, category, level, muscle),
    [q, category, level, muscle],
  );

  return (
    <div className="space-y-4 px-4 py-6 pb-28">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase">Workout studio</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} session{results.length === 1 ? "" : "s"} match your filters.
        </p>
      </header>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, muscle, equipment…"
          aria-label="Search workouts"
          className="pl-9"
        />
      </div>

      <FilterRow
        label="Category"
        options={["All", ...CATEGORIES]}
        value={category}
        onChange={(v) => setCategory(v as Category | "All")}
      />
      <FilterRow
        label="Level"
        options={["All", ...LEVELS]}
        value={level}
        onChange={(v) => setLevel(v as Level | "All")}
      />
      <FilterRow
        label="Muscle group"
        options={["All", ...MUSCLE_GROUPS]}
        value={muscle}
        onChange={setMuscle}
      />

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nothing matches that combination. Try clearing a filter.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((w) => (
            <li key={w.id}>
              <Link
                to="/workouts/$workoutId"
                params={{ workoutId: w.id }}
                className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold uppercase leading-tight">
                      {w.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{w.muscles.join(" · ")}</p>
                  </div>
                  {favorites.includes(w.id) && (
                    <Star className="size-4 shrink-0 text-primary" aria-label="Favourite" />
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <Tag>{w.category}</Tag>
                  <Tag>{w.level}</Tag>
                  <Tag>{w.durationMin} min</Tag>
                  <Tag>{w.calories} kcal</Tag>
                  <Tag>{w.equipment}</Tag>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2 py-0.5">{children}</span>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              value === opt
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
