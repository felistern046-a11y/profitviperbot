import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { AlertTriangle, Radio } from 'lucide-react'
import { VolatilityCard } from '../components/VolatilityCard'
import { VOLATILITY_SYMBOLS } from '../lib/deriv'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wide">
            <Radio className="w-3.5 h-3.5" />
            Live market feed
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Rise/Fall Signal Monitor
          </h1>
          <p className="text-gray-500 max-w-2xl">
            Streams live prices for every Deriv synthetic Volatility Index and
            scores each one with a real-time Rise/Fall bias, using RSI,
            moving-average, and momentum indicators. Every card also shows a
            backtested win rate computed by replaying that same signal against
            recent price history.
          </p>
        </div>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-8 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Volatility Indices are simulated instruments driven by a random
            number generator, not real markets. No indicator can reliably
            predict their next tick, and the win rates below are historical
            statistics, not a guarantee — they typically hover close to 50%
            since the underlying process has no persistent edge. Use this as
            an analysis aid, never as financial advice, and never risk money
            you cannot afford to lose.
          </p>
        </div>

        {mounted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {VOLATILITY_SYMBOLS.map(({ symbol, name }) => (
              <VolatilityCard key={symbol} symbol={symbol} name={name} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
