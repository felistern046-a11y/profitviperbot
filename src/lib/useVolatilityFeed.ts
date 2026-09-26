import { useEffect, useRef, useState } from 'react'
import { derivFeed } from './deriv'
import { backtestSignal, computeSignal, type BacktestResult, type Signal } from './indicators'

const LIVE_WINDOW = 600
const HISTORY_COUNT = 600
const BACKTEST_RECOMPUTE_EVERY = 15

export interface VolatilityState {
  prices: number[]
  lastPrice: number | null
  prevPrice: number | null
  lastUpdate: number | null
  signal: Signal | null
  backtest: BacktestResult | null
  ready: boolean
}

export function useVolatilityFeed(symbol: string): VolatilityState {
  const [state, setState] = useState<VolatilityState>({
    prices: [],
    lastPrice: null,
    prevPrice: null,
    lastUpdate: null,
    signal: null,
    backtest: null,
    ready: false,
  })

  const pricesRef = useRef<number[]>([])
  const tickCountRef = useRef(0)

  useEffect(() => {
    derivFeed.connect()

    derivFeed.requestHistory(symbol, HISTORY_COUNT, (prices) => {
      pricesRef.current = prices.slice(-LIVE_WINDOW)
      const signal = computeSignal(pricesRef.current)
      const backtest = backtestSignal(pricesRef.current)
      setState({
        prices: [...pricesRef.current],
        lastPrice: pricesRef.current[pricesRef.current.length - 1] ?? null,
        prevPrice: pricesRef.current[pricesRef.current.length - 2] ?? null,
        lastUpdate: Date.now(),
        signal,
        backtest,
        ready: true,
      })
    })

    const unsubscribe = derivFeed.onTick((tick) => {
      if (tick.symbol !== symbol) return
      const prev = pricesRef.current
      const next = [...prev, tick.price]
      if (next.length > LIVE_WINDOW) next.shift()
      pricesRef.current = next
      tickCountRef.current += 1

      const signal = computeSignal(next)
      const shouldRecomputeBacktest = tickCountRef.current % BACKTEST_RECOMPUTE_EVERY === 0

      setState((s) => ({
        prices: next,
        lastPrice: tick.price,
        prevPrice: prev[prev.length - 1] ?? null,
        lastUpdate: tick.epoch * 1000,
        signal,
        backtest: shouldRecomputeBacktest ? backtestSignal(next) : s.backtest,
        ready: true,
      }))
    })

    derivFeed.subscribeTicks(symbol)

    return () => {
      unsubscribe()
    }
  }, [symbol])

  return state
}
