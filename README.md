# Remix of IronAI Fit Coach

Build IronAI Fitness as a polished, production-oriented mobile-first fitness coaching app. Use the supplied IronAI prototype as the functional/design reference, preserving the dark slate UI with lime/cyan accents, Workout Studio, Nutrition, Coach Bolt, and Knowledge Base.

Implement these requirements without asking me design questions:
1. Coach Bolt must feel like a real personal coach: personalized by the user's name, goals, recent workout history, current streak, weekly activity, and whether they trained today. It should give specific encouragement, recommend the next workout, explain exercise technique, and answer nutrition/training questions. Use a clean abstraction so a real AI model/API can be connected securely later; include a useful local fallback rather than fake API calls.
2. Searchable workout video library with a substantially expanded catalog organized by Strength, Cardio, Mobility, plus muscle groups and difficulty. Include search by title, muscle group, category, and level. Workout detail should have video playback, description, target muscles, difficulty, duration, and Complete Workout.
3. Progress dashboard: total workouts, current streak, longest streak, weekly workout count, total minutes, muscle-group activity, weekly history, recent sessions, and completion state. Persist progress locally.
4. Gentle workout reminders/notifications. They should nudge users when they have not trained today, stop after today's workout is completed, support configurable reminder time, and never crash React rendering. Use proper UI elements for toast actions.
5. Nutrition section with many high-protein recipes, calories/macros, ingredients, preparation, and searchable/filterable content.
6. Learn section with anatomy, technique, recovery, nutrition, and programming lessons.
7. User profile/settings where the user can set/edit name, fitness goal, experience level, preferred training days, and reminder time.
8. Bottom navigation should include Home/Coach, Workouts, Progress, Nutrition, and Learn. Make Home useful as a dashboard with today's recommendation and quick actions.
9. Responsive mobile UI optimized for Android-sized screens, but usable on desktop.
10. Robust TypeScript/React implementation with clean components, no invalid React children, no console errors, loading/empty states, and accessible controls.
11. Seed enough workout content and recipe/lesson content that the app feels like a real product, not a demo.
12. Make the architecture suitable for packaging as an Android app/PWA later. Avoid dependencies that require server-side browser hacks.
13. Include a polished onboarding flow that collects name and basic goals, with sensible defaults and the ability to skip/edit later.
14. Keep user data persistent across reloads using local storage or the project's database if appropriate.

Use the product name IronAI Fitness and coach name Coach Bolt. Prioritize working functionality over decorative mockups.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/44ac99bc-1c29-456b-86bc-c61e596f6bf9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
