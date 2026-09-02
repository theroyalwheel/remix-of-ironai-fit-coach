import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp, todayKey } from "@/lib/store";
import { recommendWorkout } from "@/lib/coach";

const NUDGE_KEY = "ironai.lastNudge";

export function ReminderWatcher() {
  const { hydrated, profile, sessions, stats } = useApp();
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    if (!hydrated || !profile.onboarded || !profile.remindersEnabled) return;
    if (stats.trainedToday) return;

    const check = () => {
      const now = new Date();
      const [h, m] = profile.reminderTime.split(":").map(Number);
      const due = now.getHours() * 60 + now.getMinutes() >= (h || 0) * 60 + (m || 0);
      if (!due) return;
      if (window.localStorage.getItem(NUDGE_KEY) === todayKey()) return;
      window.localStorage.setItem(NUDGE_KEY, todayKey());

      const { workout } = recommendWorkout(profile, sessions);
      toast(`Time to move, ${profile.name || "athlete"}`, {
        description: `No session logged today. Coach Bolt suggests ${workout.title} (${workout.durationMin} min).`,
        duration: 12000,
        action: {
          label: "Start",
          onClick: () =>
            navRef.current({ to: "/workouts/$workoutId", params: { workoutId: workout.id } }),
        },
      });
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [hydrated, profile, sessions, stats.trainedToday]);

  return null;
}
