import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { getWorkout } from "@/data/workouts";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workouts/$workoutId")({
  loader: ({ params }) => {
    const workout = getWorkout(params.workoutId);
    if (!workout) throw notFound();
    return { workout };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.workout.title ?? "Workout";
    return {
      meta: [
        { title: `${title} — IronAI Fitness` },
        {
          name: "description",
          content:
            loaderData?.workout.description ??
            "A guided workout with technique cues inside IronAI Fitness.",
        },
        { property: "og:title", content: `${title} — IronAI Fitness` },
        {
          property: "og:description",
          content: loaderData?.workout.description ?? "A guided workout inside IronAI Fitness.",
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">That workout doesn&apos;t exist.</p>
      <Button asChild className="mt-4">
        <Link to="/workouts">Back to library</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="px-4 py-16 text-center text-sm text-muted-foreground">
      This workout couldn&apos;t be loaded.
    </div>
  ),
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { workout } = Route.useLoaderData();
  const { completeWorkout, favorites, toggleFavorite, sessions } = useApp();
  const [videoFailed, setVideoFailed] = useState(false);
  const [effort, setEffort] = useState(7);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const isFavorite = favorites.includes(workout.id);
  const timesDone = sessions.filter((s) => s.workoutId === workout.id).length;

  const complete = () => {
    completeWorkout(workout, { effort, notes: notes.trim() });
    setDone(true);
    toast.success("Session logged", {
      description: `${workout.title} · ${workout.durationMin} min added to your progress.`,
    });
  };

  return (
    <div className="space-y-5 px-4 py-4 pb-28">
      <Link
        to="/workouts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Library
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        {videoFailed ? (
          <div className="grid aspect-video place-items-center px-6 text-center text-sm text-muted-foreground">
            The demo video couldn&apos;t load. The cues below cover the full movement.
          </div>
        ) : (
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            src={workout.videoUrl}
            aria-label={`${workout.title} demonstration video`}
            onError={() => setVideoFailed(true)}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase leading-none">
            {workout.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {workout.category} · {workout.level} · {workout.durationMin} min ·{" "}
            {workout.calories} kcal · {workout.equipment}
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(workout.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors",
            isFavorite
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-surface text-muted-foreground",
          )}
        >
          <Star className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{workout.description}</p>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold uppercase">Target muscles</h2>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {workout.muscles.map((m) => (
            <span
              key={m}
              className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold uppercase">Coaching cues</h2>
        <ol className="space-y-2 text-sm">
          {workout.cues.map((c, i) => (
            <li key={c} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
              <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
              <span className="text-muted-foreground">{c}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <label htmlFor="effort" className="text-sm font-semibold">
          How hard was it? ({effort}/10)
        </label>
        <input
          id="effort"
          type="range"
          min={1}
          max={10}
          value={effort}
          onChange={(e) => setEffort(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--primary)]"
        />
        <label htmlFor="notes" className="mt-3 block text-sm font-semibold">
          Session notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Loads, how it felt, what to change next time…"
          className="mt-1"
          rows={3}
        />
        <Button onClick={complete} className="mt-4 w-full" disabled={done}>
          {done ? (
            <>
              <Check className="size-4" aria-hidden="true" /> Logged
            </>
          ) : (
            "Complete workout"
          )}
        </Button>
        {timesDone > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Completed {timesDone} time{timesDone === 1 ? "" : "s"} before.
          </p>
        )}
      </section>
    </div>
  );
}
