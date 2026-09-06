import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { RECIPES } from "@/data/recipes";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/nutrition/$recipeId")({
  loader: ({ params }) => {
    const recipe = RECIPES.find((r) => r.id === params.recipeId);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.recipe.title ?? "Recipe"} — IronAI Fitness` },
      {
        name: "description",
        content:
          loaderData?.recipe.note ?? "A high-protein recipe with full macros in IronAI Fitness.",
      },
      { property: "og:title", content: `${loaderData?.recipe.title ?? "Recipe"} — IronAI Fitness` },
      {
        property: "og:description",
        content: loaderData?.recipe.note ?? "High-protein recipe with full macros.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">That recipe doesn&apos;t exist.</p>
      <Button asChild className="mt-4">
        <Link to="/nutrition">Back to nutrition</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="px-4 py-16 text-center text-sm text-muted-foreground">
      This recipe couldn&apos;t be loaded.
    </div>
  ),
  component: RecipeDetail,
});

function RecipeDetail() {
  const { recipe } = Route.useLoaderData();
  const { logMeal } = useApp();
  const [servings, setServings] = useState(1);

  return (
    <div className="space-y-5 px-4 py-4 pb-28">
      <Link
        to="/nutrition"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Nutrition
      </Link>

      <header>
        <h1 className="font-display text-3xl font-bold uppercase leading-none">{recipe.title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {recipe.tag} · {recipe.minutes} min prep
        </p>
      </header>

      <section className="grid grid-cols-4 gap-2 text-center">
        <Macro label="kcal" value={Math.round(recipe.calories * servings)} />
        <Macro label="protein" value={Math.round(recipe.protein * servings)} accent />
        <Macro label="carbs" value={Math.round(recipe.carbs * servings)} />
        <Macro label="fat" value={Math.round(recipe.fat * servings)} />
      </section>

      <p className="text-sm text-muted-foreground">{recipe.note}</p>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold uppercase">Ingredients</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {recipe.ingredients.map((i) => (
            <li key={i} className="rounded-lg border border-border bg-surface px-3 py-2">
              {i}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold uppercase">Preparation</h2>
        <ol className="space-y-2 text-sm">
          {recipe.steps.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
              <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Servings</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Fewer servings"
              onClick={() => setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 2) / 2))}
              className="size-9 rounded-lg border border-border bg-background text-lg"
            >
              −
            </button>
            <span className="w-8 text-center font-display text-xl font-bold">{servings}</span>
            <button
              type="button"
              aria-label="More servings"
              onClick={() => setServings((s) => Math.min(6, s + 0.5))}
              className="size-9 rounded-lg border border-border bg-background text-lg"
            >
              +
            </button>
          </div>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            logMeal(recipe, servings);
            toast.success("Meal logged", {
              description: `${recipe.title} · ${Math.round(recipe.protein * servings)}g protein added to today.`,
            });
          }}
        >
          Log this meal
        </Button>
      </section>
    </div>
  );
}

function Macro({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface py-3">
      <p
        className={`font-display text-xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
