# Carbon Footprint Awareness Platform

A modern, interactive web application that empowers users to understand, track, and reduce their personal carbon footprint through data-driven insights and actionable recommendations.

## Project Overview

This platform addresses climate awareness through a **Understand → Track → Reduce** approach, helping users quantify their environmental impact across multiple lifestyle categories and providing AI-powered recommendations for meaningful reduction strategies.

### Core Features

- **Comprehensive Footprint Calculation**: Calculates annual CO2e emissions across transport, home energy, diet, and goods/waste
- **AI-Powered Insights**: Integrates Google Gemini API for personalized recommendations with intelligent rule-based fallback
- **History Tracking**: Maintains calculation history for trend analysis and progress monitoring
- **PDF Export**: Generate shareable carbon footprint reports
- **Social Sharing**: Built-in sharing utilities for awareness campaigns

## Chosen Vertical & Approach

### The Understand → Track → Reduce Loop

1. **Understand**: Users input lifestyle data (transportation, energy, diet, consumption habits)
2. **Track**: Platform calculates precise emissions using peer-reviewed emission factors
3. **Reduce**: AI generates personalized, actionable recommendations targeting the user's largest emission categories
4. **Monitor**: History tracking enables users to see impact of behavior changes over time

This cyclical approach drives continuous improvement and measurable environmental impact.

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (TypeScript)                  │
│  - Modular Components (OnboardingModal, HistorySection, Insights)│
│  - State Management via React Hooks                              │
│  - Recharts Visualizations                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────┐
        │                             │
┌───────▼──────────────┐   ┌─────────▼──────────────────┐
│ Calculation Engine   │   │  AI Insights Engine        │
│ (carbonEngine.ts)    │   │ (insightsEngine.ts)        │
│                      │   │                            │
│ - Transport Calc     │   │ - Gemini API Integration   │
│ - Energy Calc        │   │ - Rule-Based Fallback      │
│ - Diet Calc          │   │ - Recommendation Gen       │
│ - Goods/Waste Calc   │   │ - Category Ranking         │
│ - Total Breakdown    │   │                            │
└─────────────────────┘   └────────────────────────────┘
        │                             │
        │         ┌───────────────────┘
        │         │
┌───────▼─────────▼──────────────────┐
│   Data Persistence & Utilities      │
├─────────────────────────────────────┤
│ - History Hook (useHistory.ts)      │
│ - PDF Export (pdfExport.ts)         │
│ - Share Utils (shareUtils.ts)       │
│ - LocalStorage Integration          │
└─────────────────────────────────────┘
```

### Key Design Patterns

- **Pure Calculation Layer**: All emission calculations in `carbonEngine.ts` have zero UI dependencies, enabling easy testing and reuse
- **Fallback Architecture**: If Gemini API fails/isn't configured, rule-based recommendations activate automatically
- **Hook-Based State**: `useHistory` hook abstracts localStorage complexity
- **Modular Components**: Each feature (onboarding, history, insights, export) is self-contained

## Emission Factor Sources & Citations

All emission factors comply with international standards and are regularly updated:

### Transport Emissions
- **Cars (DEFRA 2023)**: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
  - Petrol: 191.6 g CO2/km
  - Diesel: 167.8 g CO2/km (includes lifecycle)
  - Hybrid: 103.8 g CO2/km
  - Electric: 56 g CO2/km (UK grid 2023)
  - LPG: 140 g CO2/km

- **Public Transit (DEFRA 2023 & EPA)**:
  - Bus: 89 g CO2/km per passenger
  - Train: 41 g CO2/km per passenger (UK average)

- **Flights (ICAO & DEFRA 2023)**: https://www.icao.int/environmental-protection/Pages/default.aspx
  - Short-haul (<900km): 255 g CO2e/km (includes radiative forcing index ~2.7x)
  - Long-haul (>900km): 195 g CO2e/km (with RFI)

### Home Energy
- **Electricity**: 192 g CO2/kWh (UK grid 2023)
- **Natural Gas**: 185 g CO2/kWh (includes extraction & distribution)
- Source: DEFRA 2023 GHG Conversion Factors

### Diet
Based on peer-reviewed LCA (Life Cycle Assessment) data:
- **Vegan**: 1.5 tonnes CO2e/year
- **Vegetarian**: 1.7 tonnes CO2e/year
- **Pescatarian**: 1.9 tonnes CO2e/year
- **Meat (Low consumption)**: 2.2 tonnes CO2e/year
- **Meat (Medium consumption)**: 2.5 tonnes CO2e/year
- **Meat (High consumption)**: 2.9 tonnes CO2e/year
- Source: Our World in Data (https://ourworldindata.org/food-choice-vs-eating-local) & IPCC

### Goods & Waste
- **New Goods**: 0.45 kg CO2/£ spent (UK average across all consumer goods)
- **Landfill Waste**: 0.6 kg CO2/kg disposed
- Source: DEFRA 2023 & Waste & Resources Action Programme (WRAP)

## Assumptions Made

1. **Annual Calculations**: All weekly/monthly inputs are annualized (×52 weeks or ×12 months) to provide yearly totals
2. **Household Energy Sharing**: Energy emissions are calculated per household and not normalized by household size (users should estimate their personal consumption)
3. **UK-Centric**: Default factors reflect UK grid emissions and DEFRA standards; may vary by region/country
4. **Average Flight Distances**: 
   - Short-haul: 300 km assumed distance
   - Long-haul: 6,000 km assumed distance
5. **Radiative Forcing Index**: Flight emissions include ~2.7× multiplier for high-altitude climate effects beyond CO2 alone
6. **Average Public Transit**: If transit type unknown, conservative estimate of 65 g CO2/km is used
7. **Consumer Spending Pattern**: Assumes average UK consumption mix when calculating goods emissions
8. **API Graceful Degradation**: If Gemini API key is missing/invalid, rule-based recommendations activate automatically

## Tech Stack

### Frontend Framework
- **React 19.2.6**: Component library and state management
- **TypeScript 6.0**: Type safety and developer experience
- **Vite 8.0**: Lightning-fast build tool and dev server

### UI & Visualization
- **Recharts 3.8.1**: Responsive charts for carbon breakdown visualization
- **CSS-in-JS**: Component-scoped styling

### Data Export & Sharing
- **jsPDF 4.2.1**: PDF generation for downloadable carbon reports
- **HTML5 Canvas**: Chart image rendering for PDFs

### AI Integration
- **Google Gemini 1.5 Flash API**: Personalized recommendation generation
- **Fallback Logic**: Rule-based recommendations when API unavailable

### Development & Testing
- **TypeScript ESLint**: Code quality and type checking
- **Vitest 4.1.8**: Unit test runner with jsdom
- **React Testing Library 16.3.2**: Component testing
- **jsdom 29.1.1**: DOM simulation for tests

### Build & Deploy
- **npm**: Package management
- **GitHub**: Version control (implied from git setup)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- A Google Gemini API key (free tier available at https://aistudio.google.com/app/apikeys)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd carbon-footprint
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your Gemini API key in `.env`:
```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Running Locally

Start the development server with hot module replacement:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Output will be in the `dist/` directory. Preview the production build:
```bash
npm run preview
```

### Running Tests

Execute all tests with coverage:
```bash
npm test
```

Test files are colocated with source files (e.g., `carbonEngine.test.ts` alongside `carbonEngine.ts`).

Watch mode for development:
```bash
npm test -- --watch
```

## Environment Setup

### Development Environment

1. **Create `.env` file** from template:
```bash
cp .env.example .env
```

2. **Add Gemini API Key**:
   - Visit https://aistudio.google.com/app/apikeys
   - Create a new API key (free tier available)
   - Paste into `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Verify `.gitignore`** (already configured):
   - ✅ `node_modules` (dependencies)
   - ✅ `dist` (build output)
   - ✅ `dist-ssr` (SSR build output)
   - ✅ `.env` (secrets)
   - ✅ `.env.local` (local overrides)
   - ✅ `*.local` (editor-specific files)

### API Key Management

- **Development**: Set in `.env` locally (not committed to git)
- **Production**: Set via environment variables in your hosting platform (Vercel, Netlify, etc.)
- **Fallback**: If no valid API key, the app uses rule-based recommendations automatically

## Project Structure

```
carbon-footprint/
├── src/
│   ├── components/
│   │   ├── OnboardingModal.tsx         # User input collection
│   │   ├── PersonalizedInsights.tsx    # Recommendation display
│   │   └── HistorySection.tsx          # Calculation history
│   ├── hooks/
│   │   └── useHistory.ts               # History state management
│   ├── lib/
│   │   ├── carbonEngine.ts             # Emission calculations
│   │   ├── insightsEngine.ts           # AI recommendations + fallback
│   │   ├── pdfExport.ts                # PDF generation
│   │   └── shareUtils.ts               # Social sharing utilities
│   ├── App.tsx                         # Main application component
│   └── main.tsx                        # Entry point
├── public/                             # Static assets
├── .env.example                        # Environment template
├── vite.config.ts                      # Vite configuration
├── vitest.config.ts                    # Test configuration
├── tsconfig.json                       # TypeScript configuration
├── eslint.config.js                    # Linting rules
└── package.json                        # Dependencies & scripts
```

## Key Features in Detail

### 1. Carbon Calculation Engine
Pure, testable calculation logic with no side effects:
- Calculates transport emissions (cars, transit, flights)
- Computes home energy impact (electricity, gas)
- Estimates diet-based emissions
- Quantifies goods purchasing and waste impact

### 2. AI-Powered Insights
Gemini API integration with intelligent fallback:
- Analyzes user's emission breakdown
- Generates 2-4 personalized recommendations
- Each recommendation includes realistic CO2e reduction potential
- Targets user's highest-impact categories
- Automatically falls back to rule-based engine if API unavailable

### 3. History Tracking
localStorage-based calculation history:
- Stores timestamped carbon footprint snapshots
- Enables trend visualization
- Supports historical comparison
- Data persists across browser sessions

### 4. PDF Export & Sharing
- Generates professional carbon footprint reports
- Includes visualizations and breakdown charts
- Shareable via social media or email
- Includes timestamp and data summary

## Testing

The project includes comprehensive unit tests:

- **`carbonEngine.test.ts`**: Transport, energy, diet, goods/waste calculations
- **`insightsEngine.test.ts`**: Recommendation generation and fallback logic
- **`useHistory.test.ts`**: History hook and localStorage integration
- **`shareUtils.test.ts`**: Sharing and data formatting utilities
- **`OnboardingModal.test.tsx`**: Component rendering and user interactions

Run tests:
```bash
npm test
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage report
```

## Contributing

To maintain code quality:
1. Run tests before committing: `npm test`
2. Check linting: `npm run lint`
3. Build production version: `npm run build`
4. Keep components modular and testable

## Performance Optimization

- **Code Splitting**: Vite handles automatic chunk splitting
- **Lazy Loading**: Components load on demand
- **Caching**: Emission factors are constants (no recalculation)
- **Efficient Rendering**: React 19 automatic batching

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is provided as-is for educational and personal use.

## Support & Feedback

For questions about carbon calculation methodology, visit:
- DEFRA GHG Reporting Factors: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023
- Our World in Data: https://ourworldindata.org/food-choice-vs-eating-local
- ICAO Aviation Emissions: https://www.icao.int/environmental-protection/Pages/default.aspx

---

**Built with React, TypeScript, and commitment to climate action.**
