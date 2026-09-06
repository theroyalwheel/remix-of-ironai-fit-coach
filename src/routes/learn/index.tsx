import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LESSONS, LESSON_TOPICS } from "@/data/lessons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn — IronAI Fitness" },
      {
        name: "description",
        content:
          "Short lessons on anatomy, technique, recovery, nutrition and programming, written for lifters who want the why.",
      },
      { property: "og:title", content: "Learn — IronAI Fitness" },
      {
        property: "og:description",
        content: "Anatomy, technique, recovery, nutrition and programming lessons.",
      },
    ],
  }),
  component: LearnIndex,
});

function LearnIndex() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string>("All");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return LESSONS.filter((l) => {
      if (topic !== "All" && l.topic !== topic) return false;
      if (!query) return true;
      return (
        l.title.toLowerCase().includes(query) ||
        l.summary.toLowerCase().includes(query) ||
        l.topic.toLowerCase().includes(query)
      );
    });
  }, [q, topic]);

  return (
    <div className="space-y-4 px-4 py-6 pb-28">
      <header>
        <h1 className="font-display text-3xl font-bold uppercase">Knowledge base</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} lesson{results.length === 1 ? "" : "s"}.
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
          placeholder="Search lessons…"
          aria-label="Search lessons"
          className="pl-9"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["All", ...LESSON_TOPICS].map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={topic === t}
            onClick={() => setTopic(t)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              topic === t
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No lessons match that search.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((l) => (
            <li key={l.id}>
              <Link
                to="/learn/$lessonId"
                params={{ lessonId: l.id }}
                className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {l.topic} · {l.readMinutes} min read
                </p>
                <p className="mt-1 font-display text-lg font-bold uppercase leading-tight">
                  {l.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{l.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
