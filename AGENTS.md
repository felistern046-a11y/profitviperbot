# AGENTS.md

Overview of this project for developers and AI agents working on this codebase.

## Project Overview

Rise/Fall Signal Monitor — a real-time analysis dashboard for Deriv's synthetic
Volatility Indices. It streams live tick prices directly from Deriv's public
WebSocket API in the browser, scores each index with a technical-indicator
based Rise/Fall bias, and shows a backtested win rate computed by replaying
that same signal logic against recent price history.

There is no backend, no authentication, and no persistence — everything runs
client-side against Deriv's public market-data API (no Deriv account or API
token required, since only public tick/history data is used).

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js + react-chartjs-2 (sparklines) |
| Market data | Deriv public WebSocket API (`wss://ws.derivws.com/websockets/v3`) |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── src
│   ├── components
│   │   └── VolatilityCard.tsx   # One index's live price, sparkline, signal, backtest
│   ├── lib
│   │   ├── deriv.ts             # WebSocket client: subscribes to ticks, requests history
│   │   ├── indicators.ts        # SMA/RSI/momentum signal + backtest math
│   │   └── useVolatilityFeed.ts # Hook wiring the feed + indicators into React state
│   ├── routes
│   │   ├── __root.tsx           # Root layout: meta/title, global styles
│   │   └── index.tsx            # The dashboard page (grid of VolatilityCards)
│   ├── router.tsx
│   └── styles.css
├── netlify.toml
├── vite.config.ts
└── tsconfig.json
```

## How the signal works

`src/lib/indicators.ts` combines three independent, well-known indicators
(fast/slow SMA crossover, RSI(14), short-term momentum) into a single vote.
Each indicator can push the estimate up or down by a fixed 5 percentage
points, bounding the output between 35% and 65%. This is intentional:
Volatility Indices are simulated random-walk instruments, so the model
avoids implying a large, unrealistic edge.

`backtestSignal` replays that exact same logic tick-by-tick across the
symbol's recent price history and checks whether the predicted direction
matched the next tick, producing a real, computed win-rate percentage
(`src/lib/useVolatilityFeed.ts` recomputes it periodically as new ticks
arrive). Expect this number to sit close to 50% most of the time — that is
the correct, honest result for a fair random-walk process, not a bug.

## Market data

`src/lib/deriv.ts` opens one shared WebSocket connection to Deriv's public
API using the documented demo `app_id=1089` (market data only — no login).
For each symbol in `VOLATILITY_SYMBOLS` it requests recent tick history to
seed the charts/indicators, then subscribes to live ticks. The connection
auto-reconnects with a fixed backoff if it drops.

## Conventions

- Components: PascalCase, one per file in `src/components/`
- Hooks/utilities: camelCase in `src/lib/`
- Tailwind utility classes for all styling — no CSS-in-JS
- Strict TypeScript; avoid `any` outside of raw WebSocket message parsing

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
```
