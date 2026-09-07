import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import type { Goal, Level } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & settings — IronAI Fitness" },
      {
        name: "description",
        content:
          "Edit your name, goal, experience level, training days, targets and reminder settings in IronAI Fitness.",
      },
      { property: "og:title", content: "Profile & settings — IronAI Fitness" },
      {
        property: "og:description",
        content: "Your goal, experience, training days, targets and reminders.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, updateProfile, sessions, meals, measurements, resetAll } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, sessions, meals, measurements }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ironai-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDay = (d: number) => {
    const has = profile.trainingDays.includes(d);
    updateProfile({
      trainingDays: has
        ? profile.trainingDays.filter((x) => x !== d)
        : [...profile.trainingDays, d].sort(),
    });
  };

  return (
    <div className="space-y-6 px-4 py-6 pb-28">
      <h1 className="font-display text-3xl font-bold uppercase">Profile</h1>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Alex"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Goal</p>
          <div className="grid gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={profile.goal === g}
                onClick={() => updateProfile({ goal: g })}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                  profile.goal === g
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground",
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Experience level</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={profile.level === l}
                onClick={() => updateProfile({ level: l })}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                  profile.level === l
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Training days</p>
          <div className="flex gap-2">
            {DAYS.map((d, i) => (
              <button
                key={`${d}-${i}`}
                type="button"
                aria-label={`Toggle training day ${i}`}
                aria-pressed={profile.trainingDays.includes(i)}
                onClick={() => toggleDay(i)}
                className={cn(
                  "size-10 rounded-full border text-sm font-bold transition-colors",
                  profile.trainingDays.includes(i)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl font-bold uppercase">Daily targets</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cal">Calories</Label>
            <Input
              id="cal"
              inputMode="numeric"
              value={profile.calorieTarget || ""}
              placeholder="2200"
              onChange={(e) =>
                updateProfile({ calorieTarget: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pro">Protein (g)</Label>
            <Input
              id="pro"
              inputMode="numeric"
              value={profile.proteinTarget || ""}
              placeholder="150"
              onChange={(e) =>
                updateProfile({ proteinTarget: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl font-bold uppercase">Reminders</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="reminders">Daily nudge when you haven&apos;t trained</Label>
          <Switch
            id="reminders"
            checked={profile.remindersEnabled}
            onCheckedChange={(v) => updateProfile({ remindersEnabled: v })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Reminder time</Label>
          <Input
            id="time"
            type="time"
            className="w-40"
            value={profile.reminderTime}
            onChange={(e) => updateProfile({ reminderTime: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Reminders appear inside the app while it&apos;s open. There is no background push
          delivery.
        </p>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Reminder preview", {
              description: "This is how your daily nudge will look.",
            })
          }
        >
          Test reminder
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-display text-xl font-bold uppercase">Your data</h2>
        <p className="text-xs text-muted-foreground">
          Everything is stored on this device so the app keeps working offline.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportData}>
            Export JSON
          </Button>
          {confirmReset ? (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  toast.success("All data cleared");
                }}
              >
                Confirm reset
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              Reset everything
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
