# Carbon Footprint Awareness Platform

A browser-based carbon footprint tracker that turns simple lifestyle inputs into annual emissions, practical suggestions, and progress you can revisit later.

Live demo: [ADD AFTER DEPLOY]

## Vertical

This app follows an Understand -> Track -> Reduce flow:

- Understand: the onboarding modal, tooltips, and validated form make it easier to answer questions about transport, home energy, diet, and consumption.
- Track: the app calculates annual emissions, saves entries to localStorage, shows a history table and trend chart, and lets users set a personal carbon goal.
- Reduce: personalized insights suggest specific actions, then users can share a summary or download a PDF report.

## How It Works

1. `App.tsx` opens with `OnboardingModal` on first visit and renders the lifestyle form in collapsible sections.
2. User inputs are validated before saving to state; invalid numeric values are rejected and shown inline.
3. `calculateTotalFootprint()` in `src/lib/carbonEngine.ts` converts weekly and monthly inputs into annual emissions in tonnes CO2e.
4. `ResultsBreakdown` shows the total, category bars, target comparisons, and a detailed emissions table.
5. `PersonalizedInsights` loads `generatePersonalizedInsights()` from `src/lib/insightsEngine.ts`. If `VITE_GEMINI_API_KEY` is set, the app calls Google GenAI; otherwise it uses rule-based recommendations.
6. `GoalSetting` stores a target in localStorage and `GoalProgress` compares the latest saved result to that target.
7. `HistorySection` stores past results in localStorage, renders a trend chart, and opens `HistoryDetailModal` for saved entries.
8. `shareUtils` and `pdfExport` let users share or export their footprint.

## Tech Stack

| Package | Version | Purpose |
| --- | --- | --- |
| React / React DOM | 19.2.6 | UI rendering |
| TypeScript | ~6.0.2 | Static typing |
| Vite | ^8.0.12 | Dev server and build tool |
| Recharts | ^3.8.1 | Result chart and trend chart |
| jsPDF | ^4.2.1 | PDF export |
| @google/genai | ^2.8.0 | Optional Gemini-powered recommendations |
| Vitest | ^4.1.8 | Test runner |
| Testing Library packages | various | Component and interaction tests |
| jsdom | ^29.1.1 | Browser-like test environment |

## Emission Factor Sources

The emission engine comments cite these sources:

- DEFRA 2023 for car, transit, home energy, and goods and waste factors.
- ICAO for flight modeling, combined with DEFRA 2023.
- Our World in Data and IPCC for diet-based annual emissions.
- EPA, mentioned alongside DEFRA for transit context.
- WRAP, mentioned alongside DEFRA for goods and waste context.

## Assumptions In The Code

- Emissions are calculated as annual totals and displayed in tonnes CO2e.
- Household size is validated in the UI, and home energy emissions are divided per person.
- The transit UI uses the average transit factor, not separate bus/train factors.
- Short-haul flights use a fixed average distance of 300 km, and long-haul flights use 6000 km.
- Diet uses fixed annual totals by diet type instead of meal-level tracking.
- Goods spending is treated as a linear emissions proxy, and landfill waste is assumed to go to landfill.
- History, goals, and completed actions live in browser localStorage only.
- AI recommendations are optional; if the Gemini key is missing or invalid, the app falls back to built-in rules.
- Share and PDF features depend on browser support for Web Share, clipboard access, and PDF generation.

## How To Run Locally

```bash
npm install
npm run dev
```

Optional preview:

```bash
npm run build
npm run preview
```

## How To Run Tests

```bash
npm test
```

- `npm test` runs Vitest in watch mode.
- `npm test -- --run` runs the suite once, which is the command used for verification here.
- Current suite: 14 test files, 81 tests.

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

If the key is missing or invalid, the app still works and uses rule-based recommendations.

## Rubric Alignment

| Criterion | Actual implementation | Status |
| --- | --- | --- |
| Understand | Onboarding, tooltips, validated lifestyle form, clear result summaries | Complete |
| Track | localStorage history, goal progress, trend chart, saved-entry details | Complete |
| Reduce | Personalized tips, goal setting, PDF export, sharing flow | Complete |
| Accuracy | Pure calculation engine with cited emission sources and explicit assumptions | Complete |
| Accessibility | Skip link, scoped table headers, dialog semantics, hidden legend, keyboard-friendly modals | Complete |
| Reliability | NaN guards, storage parsing guards, browser API guards, lint/test/build passing | Complete |

## Verification

Last verified with:

```bash
npm run lint
npm test -- --run
npm run build
```

## License

[MIT](LICENSE) — created for PromptWars Virtual Challenge 3.
