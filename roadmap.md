# IronAI Fitness — production-readiness roadmap

Status of the survey (nothing below is done yet unless marked):

## Ready — in priority order
1. Extend data model (`src/lib/types.ts`, `src/lib/store.tsx`): profile stats (weightKg, heightCm, age, calorie/protein targets, browser-notification opt-in), meal logs, sleep logs, weigh-ins, session effort/notes; keep `ironai.state.v1` key and merge defaults; add cross-tab `storage` sync.
2. Coach Bolt: add nutrition/sleep/weight context to `buildCoachContext`, system prompt and local rules; add `getCoachStatus` server fn (honest "AI vs local rules" chip, no key leak); fetch timeout; verify gateway model name; ensure LOVABLE_API_KEY exists via ai_gateway--create.
3. Root wiring (`src/routes/__root.tsx`): AppStoreProvider + AppShell + Toaster, Google Fonts links (Barlow Condensed, Inter Tight), IronAI head metadata, manifest/theme-color/apple-touch-icon links.
4. Routes: `/` home dashboard (greeting, today's recommendation, quick stats, coach entry), `/coach` chat, `workouts.tsx` + `workouts.index.tsx` (search/filter by category, muscle, level) + `workouts.$workoutId.tsx` (video with error fallback, cues, session timer, complete + effort/notes, notFound), `/progress` (stats, weekly bars, 28-day streak grid, muscle activity, history with delete, sleep + weight logging), `nutrition.tsx` + index (search/filter, today's intake vs target) + `$recipeId` (macros, ingredients, steps, log meal with servings), `learn.tsx` + index + `$lessonId`, `/profile` (edit everything, reminder + notification settings with permission handling, export JSON, reset with confirm).
5. AppShell: desktop side rail on lg+, bottom nav on mobile (Home, Workouts, Progress, Nutrition, Learn); hydration skeletons; per-route head().
6. Reminders: keep in-app toast once/day when not trained; optional browser Notification while app is open (guard missing API / denied permission); "Test reminder" button; copy must say no background push.
7. PWA-friendly: `public/manifest.webmanifest`, generated icons (512/192/180) + favicon; no service worker.
8. Validation: add vitest + unit tests (computeStats streaks, searchWorkouts, localCoach), run tsgo + eslint, Playwright flows (onboarding, nav, filter/detail/complete, progress, recipe log, learn, coach, reload persistence, reminder toast), fix everything found.

## Notes
- Data catalogs already exist: 39 workouts, 24 recipes, 18 lessons.
- Existing pieces: store, coach engine, server fn abstraction, AppShell, Onboarding, ReminderWatcher. No route pages exist yet besides the placeholder index.
