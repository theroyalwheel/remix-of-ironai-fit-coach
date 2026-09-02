import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/store";
import type { Goal, Level } from "@/lib/types";
import { cn } from "@/lib/utils";

const GOALS: Goal[] = [
  "Build muscle",
  "Lose fat",
  "Get stronger",
  "Improve endurance",
  "Stay healthy",
];
const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function Onboarding() {
  const { profile, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [level, setLevel] = useState<Level>(profile.level);
  const [days, setDays] = useState<number[]>(profile.trainingDays);
  const [time, setTime] = useState(profile.reminderTime);

  const finish = () =>
    updateProfile({
      name: name.trim() || "Athlete",
      goal,
      level,
      trainingDays: days.length ? [...days].sort() : [1, 3, 5],
      reminderTime: time,
      onboarded: true,
    });

  const skip = () => updateProfile({ name: name.trim() || "Athlete", onboarded: true });

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set up IronAI Fitness"
      className="fixed inset-0 z-50 overflow-y-auto bg-background bg-iron-glow"
    >
      <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-between px-5 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Step {step + 1} of 3
          </p>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-secondary",
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="mt-8 space-y-5">
              <h1 className="font-display text-4xl font-bold uppercase leading-none">
                Welcome to <span className="text-gradient-iron">IronAI</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Coach Bolt builds your training around your real history. Start with your
                name — everything here can be edited later in settings.
              </p>
              <div className="space-y-2">
                <Label htmlFor="onb-name">What should Coach Bolt call you?</Label>
                <Input
                  id="onb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  autoComplete="given-name"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-8 space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase">Your goal</h1>
              <div className="grid gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={goal === g}
                    onClick={() => setGoal(g)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      goal === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground hover:border-primary/40",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Experience level</p>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={level === l}
                      onClick={() => setLevel(l)}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                        level === l
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 space-y-6">
              <h1 className="font-display text-3xl font-bold uppercase">Your week</h1>
              <div>
                <p className="mb-2 text-sm font-semibold">Preferred training days</p>
                <div className="flex gap-2">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Toggle day ${i}`}
                      aria-pressed={days.includes(i)}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "size-10 rounded-full border text-sm font-bold transition-colors",
                        days.includes(i)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-time">Daily reminder time</Label>
                <Input
                  id="onb-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  A gentle nudge if you haven't trained yet that day. It stops as soon as
                  you complete a workout.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-3">
          <Button variant="ghost" onClick={skip} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex-1" />
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button onClick={finish}>Start training</Button>
          )}
        </div>
      </div>
    </div>
  );
}
