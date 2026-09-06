import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  QUICK_PROMPTS,
  buildCoachContext,
  coachGreeting,
  coachSystemPrompt,
  localCoach,
} from "@/lib/coach";
import { askCoachRemote } from "@/lib/coach.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach Bolt — IronAI Fitness" },
      {
        name: "description",
        content:
          "Chat with Coach Bolt about technique, nutrition, recovery and what to train next — personalised to your real training history.",
      },
      { property: "og:title", content: "Coach Bolt — IronAI Fitness" },
      {
        property: "og:description",
        content: "Your personal AI strength coach, grounded in your own training history.",
      },
    ],
  }),
  component: Coach,
});

function Coach() {
  const { hydrated, profile, sessions, stats, chat, appendChat, clearChat } = useApp();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"ai" | "local" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, busy]);

  const ctx = buildCoachContext(profile, sessions, stats);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    appendChat({ role: "user", content: message });
    setBusy(true);
    try {
      const remote = await askCoachRemote({
        data: {
          message,
          systemPrompt: coachSystemPrompt(ctx),
          history: chat.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (remote.available) {
        setSource("ai");
        appendChat({ role: "coach", content: remote.content });
      } else {
        setSource("local");
        appendChat({ role: "coach", content: await localCoach.reply(message, ctx) });
      }
    } catch {
      setSource("local");
      appendChat({ role: "coach", content: await localCoach.reply(message, ctx) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col px-4 py-4 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase leading-none">Coach Bolt</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {source === "ai"
              ? "Answering with the AI model"
              : source === "local"
                ? "Answering with the built-in coaching rules (AI model unavailable)"
                : "Personalised to your training history"}
          </p>
        </div>
        {chat.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            aria-label="Clear conversation"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="mt-4 flex-1 space-y-3">
        {hydrated && chat.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
            <Sparkles className="mb-2 size-4 text-primary" aria-hidden="true" />
            {coachGreeting(ctx)}
          </div>
        )}
        {chat.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "border border-border bg-surface text-foreground",
            )}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="w-24 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground">
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chat.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void send(p)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        className="sticky bottom-20 mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Coach Bolt anything…"
          aria-label="Message Coach Bolt"
          disabled={busy}
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={busy || !input.trim()}>
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
