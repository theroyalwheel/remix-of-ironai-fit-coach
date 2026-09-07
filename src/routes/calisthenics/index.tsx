import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShieldAlert, Star } from "lucide-react";
import {
  CAL_EXERCISES,
  PROGRESSION_TREES,
  ROUTINES,
  filterCalExercises,
  getCalExercise,
} from "@/data/calisthenics";
import {
  CAL_CATEGORIES,
  CAL_GOALS,
  CAL_MUSCLES,
  CALISTHENICS_SAFETY,
  type CalCategory,
  type CalGoal,
  type CalMuscle,
} from "@/lib/calisthenics";
import type { Level } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calisthenics/")({
  head: () => ({
    meta: [
      { title: "Calisthenics — no-equipment training | IronAI Fitness" },
      {
        name: "description",
        content:
          "Over 80 bodyweight exercises, progression trees and 5-30 minute routines you can do anywhere with no gym equipment.",
      },
      { property: "og:title", content: "Calisthenics — no-equipment training | IronAI Fitness" },
      {
        property: "og:description",
        content: "Bodyweight exercises, progressions and timed routines for beginners to advanced.",
      },
    ],
  }),
  component: CalisthenicsHub,
});

type Tab = "Exercises" | "Routines" | "Progressions" | "Safety";
const TABS: Tab[] = ["Exercises", "Routines", "Progressions", "Safety"];
const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

function CalisthenicsHub() {
  const { favorites } = useApp();
  const [tab, setTab] = useState<Tab>("Exercises");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CalCategory | "All">("All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [muscle, setMuscle] = useState<CalMuscle | "All">("All");
  const [goal, setGoal] = useState<CalGoal | "All">("All");
  const [equipment, setEquipment] = useState<"All" | "No equipment" | "Everywhere">("All");
  const [minutes, setMinutes] = useState<number | null>(null);

  const results = useMemo(
    () => filterCalExercises({ query, category, level, muscle, goal, equipment, maxMinutes: minutes }),
    [query, category, level, muscle, goal, equipment, minutes],
  );

  return (
    <div className="space-y-4 px-4 py-6 pb-28">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase leading-none">Calisthenics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {CAL_EXERCISES.length} bodyweight exercises, {ROUTINES.length} timed routines and{" "}
          {PROGRESSION_TREES.length} progression trees — trainable anywhere.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Calisthenics sections"
        className="-mx-4 flex gap-2 overflow-x-auto px-4"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
              tab === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Exercises" && (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, muscle, pattern, goal…"
              aria-label="Search calisthenics exercises"
              className="pl-9"
            />
          </div>

          <Row
            label="Equipment"
            options={["All", "No equipment", "Everywhere"]}
            value={equipment}
            onChange={(v) => setEquipment(v as typeof equipment)}
          />
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">No equipment</strong> = bodyweight, floor and wall
            only. <strong className="text-foreground">Everywhere</strong> also allows a permanently
            fixed, weight-rated bar, step or heavy table — never improvised furniture or a door.
          </p>

          <Row
            label="Category"
            options={["All", ...CAL_CATEGORIES]}
            value={category}
            onChange={(v) => setCategory(v as CalCategory | "All")}
          />
          <Row
            label="Difficulty"
            options={["All", ...LEVELS]}
            value={level}
            onChange={(v) => setLevel(v as Level | "All")}
          />
          <Row
            label="Muscle"
            options={["All", ...CAL_MUSCLES]}
            value={muscle}
            onChange={(v) => setMuscle(v as CalMuscle | "All")}
          />
          <Row
            label="Goal"
            options={["All", ...CAL_GOALS]}
            value={goal}
            onChange={(v) => setGoal(v as CalGoal | "All")}
          />
          <Row
            label="Time per exercise"
            options={["Any", "≤3 min", "≤4 min", "≤6 min"]}
            value={minutes === null ? "Any" : `≤${minutes} min`}
            onChange={(v) => setMinutes(v === "Any" ? null : Number(v.replace(/\D/g, "")))}
          />

          <p className="text-xs text-muted-foreground" role="status">
            {results.length} exercise{results.length === 1 ? "" : "s"} match.
          </p>

          {results.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing matches that combination. Try clearing a filter.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/calisthenics/$exerciseId"
                    params={{ exerciseId: e.id }}
                    className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50 focus-visible:border-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-bold uppercase leading-tight">
                          {e.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{e.summary}</p>
                      </div>
                      {favorites.includes(e.id) && (
                        <Star className="size-4 shrink-0 text-primary" aria-label="Favourite" />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <Tag>{e.category}</Tag>
                      <Tag>{e.level}</Tag>
                      <Tag>{e.primary.join(", ")}</Tag>
                      <Tag>{e.equipment === "None" ? "No equipment" : "Fixed structure"}</Tag>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "Routines" && (
        <ul className="space-y-2">
          {ROUTINES.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-display text-lg font-bold uppercase leading-tight">{r.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <Tag>{r.minutes} min</Tag>
                <Tag>{r.level}</Tag>
                <Tag>{r.focus}</Tag>
                <Tag>{r.equipment === "None" ? "No equipment" : "Fixed structure"}</Tag>
              </div>
              <ol className="mt-3 space-y-1 text-sm">
                {r.blocks.map((b, i) => {
                  const ex = getCalExercise(b.exerciseId);
                  return (
                    <li key={`${r.id}-${b.exerciseId}-${i}`} className="flex justify-between gap-3">
                      <Link
                        to="/calisthenics/$exerciseId"
                        params={{ exerciseId: b.exerciseId }}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {ex?.name ?? b.exerciseId}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {b.work} · rest {b.rest}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ul>
      )}

      {tab === "Progressions" && (
        <ul className="space-y-2">
          {PROGRESSION_TREES.map((t) => (
            <li key={t.id} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-display text-lg font-bold uppercase leading-tight">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              <ol className="mt-3 space-y-1.5">
                {t.steps.map((id, i) => {
                  const ex = getCalExercise(id);
                  if (!ex) return null;
                  return (
                    <li key={id} className="flex items-center gap-3 text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-[11px] text-primary">
                        {i + 1}
                      </span>
                      <Link
                        to="/calisthenics/$exerciseId"
                        params={{ exerciseId: id }}
                        className="underline-offset-2 hover:underline"
                      >
                        {ex.name}
                      </Link>
                      <span className="ml-auto text-[11px] text-muted-foreground">{ex.level}</span>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ul>
      )}

      {tab === "Safety" && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
            <ShieldAlert className="size-5 text-primary" aria-hidden="true" /> Train safely
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {CALISTHENICS_SAFETY.map((s) => (
              <li key={s} className="rounded-xl border border-border bg-background p-3">
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2 py-0.5">{children}</span>
  );
}

function Row({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
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
              "min-h-10 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors",
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
