import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RECIPES, RECIPE_TAGS } from "@/data/recipes";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nutrition/")({
  head: () => ({
    meta: [
      { title: "Nutrition — IronAI Fitness" },
      {
        name: "description",
        content:
          "High-protein recipes with calories, macros, ingredients and prep steps — searchable and loggable against your daily targets.",
      },
      { property: "og:title", content: "Nutrition — IronAI Fitness" },
      {
        property: "og:description",
        content: "High-protein recipes with full macros and one-tap meal logging.",
      },
    ],
  }),
  component: NutritionIndex,
});

function NutritionIndex() {
  const { todayIntake, profile } = useApp();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string>("All");
  const [highProtein, setHighProtein] = useState(false);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (tag !== "All" && r.tag !== tag) return false;
      if (highProtein && r.protein < 35) return false;
      if (!query) return true;
      return (
        r.title.toLowerCase().includes(query) ||
        r.tag.toLowerCase().includes(query) ||
        r.ingredients.some((i) => i.toLowerCase().includes(query))
      );
    });
  }, [q, tag, highProtein]);

  const calorieTarget = profile.calorieTarget ?? 2200;
  const proteinTarget = profile.proteinTarget ?? 150;

  return (
    <div className="space-y-4 px-4 py-6 pb-28">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase">Nutrition</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} recipe{results.length === 1 ? "" : "s"} available.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Today</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <Meter
            label="Calories"
            value={todayIntake.calories}
            target={calorieTarget}
            unit="kcal"
          />
          <Meter label="Protein" value={todayIntake.protein} target={proteinTarget} unit="g" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {todayIntake.meals.length} meal{todayIntake.meals.length === 1 ? "" : "s"} logged ·{" "}
          {todayIntake.carbs}g carbs · {todayIntake.fat}g fat
        </p>
      </section>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search recipes or ingredients…"
          aria-label="Search recipes"
          className="pl-9"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["All", ...RECIPE_TAGS].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tag === t}
            onClick={() => setTag(t)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              tag === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={highProtein}
          onClick={() => setHighProtein((v) => !v)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            highProtein
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          35g+ protein
        </button>
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No recipes match. Try a different search.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                to="/nutrition/$recipeId"
                params={{ recipeId: r.id }}
                className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <p className="font-display text-lg font-bold uppercase leading-tight">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.tag} · {r.minutes} min
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border bg-background px-2 py-0.5">
                    {r.calories} kcal
                  </span>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-primary">
                    {r.protein}g protein
                  </span>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5">
                    {r.carbs}g carbs
                  </span>
                  <span className="rounded-full border border-border bg-background px-2 py-0.5">
                    {r.fat}g fat
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Meter({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {value}/{target} {unit}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-secondary">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
