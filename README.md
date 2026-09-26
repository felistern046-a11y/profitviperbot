# Rise/Fall Signal Monitor

A real-time analysis dashboard for Deriv's synthetic Volatility Indices
(Volatility 10/25/50/75/100 and their 1s variants). It streams live prices
directly from Deriv's public market-data API and scores each index with a
technical-indicator based Rise/Fall bias, alongside a backtested win rate
computed by replaying that same logic against recent price history.

## Why it's built this way

Volatility Indices are simulated, random-walk instruments — no indicator can
give a reliable, large edge on their next tick. Rather than fabricate a
"guaranteed high accuracy" number, this tool:

- Bounds every signal's confidence to a realistic 35%–65% range.
- Shows a **backtested** win rate — a real number computed by replaying the
  exact same signal against recent history, not a marketing claim.
- Displays a clear risk disclaimer on the dashboard itself.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + React 19 + Vite 7
- Tailwind CSS 4 for styling
- Chart.js / react-chartjs-2 for the live sparklines
- Deriv's public WebSocket API for live ticks and tick history (no account
  or API key required — market data only, no trading)

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. The dashboard connects to Deriv's public
WebSocket feed directly from your browser, so live data works immediately —
no environment variables or backend setup needed.

## Project structure

See [AGENTS.md](./AGENTS.md) for a full breakdown of the codebase, including
how the signal and backtest math work.

## Disclaimer

This tool is for market analysis and educational purposes only. It is not
financial advice, and the displayed win rates are historical statistics, not
guarantees of future performance. Trading synthetic indices or any other
financial instrument carries risk of loss.
