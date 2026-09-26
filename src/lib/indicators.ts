// Technical-indicator based signal generator for tick-price series.
// All functions are index-based (no array slicing) so they stay cheap
// enough to run on every incoming tick and inside a full-history backtest.

export function smaAt(values: number[], end: number, period: number): number | null {
  if (end < period) return null
  let sum = 0
  for (let i = end - period; i < end; i++) sum += values[i]
  return sum / period
}

export function rsiAt(values: number[], end: number, period = 14): number | null {
  if (end < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = end - period; i < end; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgGain + avgLoss === 0) return 50
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export interface Signal {
  risePct: number
  fallPct: number
  label: 'RISE' | 'FALL' | 'NEUTRAL'
  reasons: string[]
}

const MOMENTUM_WINDOW = 10
const MIN_HISTORY = 20 + MOMENTUM_WINDOW + 1

/**
 * Combines three simple, independent indicators into a bounded probability
 * estimate (35%-65%) rather than a single "always confident" prediction.
 * Volatility indices are simulated random-walk instruments, so the model
 * intentionally caps confidence instead of implying a guaranteed edge.
 */
export function computeSignalAt(values: number[], end: number): Signal | null {
  if (end < MIN_HISTORY) return null

  const last = values[end - 1]
  const sma5 = smaAt(values, end, 5)!
  const sma20 = smaAt(values, end, 20)!
  const rsi14 = rsiAt(values, end, 14)!
  const momentum = last - values[end - 1 - MOMENTUM_WINDOW]

  let score = 0
  const reasons: string[] = []

  if (sma5 > sma20) {
    score += 1
    reasons.push('Fast average above slow average (uptrend bias)')
  } else if (sma5 < sma20) {
    score -= 1
    reasons.push('Fast average below slow average (downtrend bias)')
  }

  if (rsi14 < 35) {
    score += 1
    reasons.push('RSI shows oversold conditions')
  } else if (rsi14 > 65) {
    score -= 1
    reasons.push('RSI shows overbought conditions')
  }

  if (momentum > 0) {
    score += 1
    reasons.push('Positive short-term momentum')
  } else if (momentum < 0) {
    score -= 1
    reasons.push('Negative short-term momentum')
  }

  const risePct = 50 + score * 5
  const fallPct = 100 - risePct
  const label = risePct >= 55 ? 'RISE' : risePct <= 45 ? 'FALL' : 'NEUTRAL'

  return { risePct, fallPct, label, reasons }
}

export function computeSignal(values: number[]): Signal | null {
  return computeSignalAt(values, values.length)
}

export interface BacktestResult {
  winRate: number
  sampleSize: number
  wins: number
  losses: number
}

/**
 * Replays the same signal logic across historical prices to measure how
 * often it actually called the next-tick direction correctly. This is a
 * real, computed number (not a marketing claim) and will typically sit
 * close to 50% given these instruments are designed as fair random walks.
 */
export function backtestSignal(values: number[], horizon = 1): BacktestResult {
  let wins = 0
  let losses = 0

  for (let end = MIN_HISTORY; end < values.length - horizon; end++) {
    const signal = computeSignalAt(values, end)
    if (!signal || signal.label === 'NEUTRAL') continue
    const current = values[end - 1]
    const future = values[end - 1 + horizon]
    if (future === current) continue
    const actualUp = future > current
    const predictedUp = signal.label === 'RISE'
    if (actualUp === predictedUp) wins++
    else losses++
  }

  const sampleSize = wins + losses
  return {
    winRate: sampleSize > 0 ? (wins / sampleSize) * 100 : 0,
    sampleSize,
    wins,
    losses,
  }
}
