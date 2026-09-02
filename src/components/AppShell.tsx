import { Link, useRouterState } from "@tanstack/react-router";
import { Dumbbell, Flame, Home, Salad, GraduationCap, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import { Onboarding } from "./Onboarding";
import { ReminderWatcher } from "./ReminderWatcher";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: Flame },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/learn", label: "Learn", icon: GraduationCap },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, profile, stats } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold uppercase tracking-wide">
              Iron<span className="text-gradient-iron">AI</span> Fitness
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary"
              title="Current streak"
            >
              {stats.currentStreak}d streak
            </span>
            <Link
              to="/profile"
              aria-label="Profile and settings"
              className="grid size-9 place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 safe-bottom">{children}</main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {hydrated && !profile.onboarded ? <Onboarding /> : null}
      <ReminderWatcher />
    </div>
  );
}
