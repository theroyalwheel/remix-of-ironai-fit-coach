import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LESSONS } from "@/data/lessons";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn/$lessonId")({
  loader: ({ params }) => {
    const lesson = LESSONS.find((l) => l.id === params.lessonId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.lesson.title ?? "Lesson"} — IronAI Fitness` },
      {
        name: "description",
        content: loaderData?.lesson.summary ?? "A training lesson inside IronAI Fitness.",
      },
      { property: "og:title", content: `${loaderData?.lesson.title ?? "Lesson"} — IronAI Fitness` },
      {
        property: "og:description",
        content: loaderData?.lesson.summary ?? "A training lesson inside IronAI Fitness.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">That lesson doesn&apos;t exist.</p>
      <Button asChild className="mt-4">
        <Link to="/learn">Back to lessons</Link>
      </Button>
    </div>
  ),
  errorComponent: () => (
    <div className="px-4 py-16 text-center text-sm text-muted-foreground">
      This lesson couldn&apos;t be loaded.
    </div>
  ),
  component: LessonDetail,
});

function LessonDetail() {
  const { lesson } = Route.useLoaderData();
  return (
    <article className="space-y-4 px-4 py-4 pb-28">
      <Link
        to="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Lessons
      </Link>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
        {lesson.topic} · {lesson.readMinutes} min read
      </p>
      <h1 className="font-display text-3xl font-bold uppercase leading-none">{lesson.title}</h1>
      <p className="text-sm font-medium">{lesson.summary}</p>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {lesson.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </article>
  );
}
