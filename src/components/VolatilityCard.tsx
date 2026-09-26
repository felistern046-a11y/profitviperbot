import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { useVolatilityFeed } from '../lib/useVolatilityFeed'

function formatPrice(price: number | null) {
  if (price === null) return '—'
  return price.toFixed(price >= 1000 ? 2 : 4)
}

function formatAge(lastUpdate: number | null) {
  if (!lastUpdate) return 'connecting…'
  const seconds = Math.max(0, Math.round((Date.now() - lastUpdate) / 1000))
  if (seconds < 2) return 'live'
  return `${seconds}s ago`
}

export function VolatilityCard({ symbol, name }: { symbol: string; name: string }) {
  const { prices, lastPrice, prevPrice, lastUpdate, signal, backtest, ready } =
    useVolatilityFeed(symbol)

  const direction =
    lastPrice !== null && prevPrice !== null
      ? lastPrice > prevPrice
        ? 'up'
        : lastPrice < prevPrice
          ? 'down'
          : 'flat'
      : 'flat'

  const chartData = {
    labels: prices.map((_, i) => i),
    datasets: [
      {
        data: prices,
        borderColor:
          signal?.label === 'RISE'
            ? 'rgb(16, 185, 129)'
            : signal?.label === 'FALL'
              ? 'rgb(239, 68, 68)'
              : 'rgb(107, 114, 128)',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.25,
      },
    ],
  }

  const signalStyles =
    signal?.label === 'RISE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : signal?.label === 'FALL'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-xs text-gray-400 font-mono">{symbol}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Activity className="w-3.5 h-3.5" />
          {formatAge(lastUpdate)}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums">
            {formatPrice(lastPrice)}
          </p>
          <div
            className={`flex items-center gap-1 text-xs font-medium mt-1 ${
              direction === 'up'
                ? 'text-emerald-600'
                : direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-400'
            }`}
          >
            {direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {direction === 'flat' && <Minus className="w-3.5 h-3.5" />}
            last tick
          </div>
        </div>

        <div className="h-14 w-32">
          {ready && prices.length > 1 && (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: { x: { display: false }, y: { display: false } },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
              }}
            />
          )}
        </div>
      </div>

      {signal ? (
        <div className={`rounded-lg border px-3 py-2 ${signalStyles}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{signal.label}</span>
            <span className="text-sm font-mono">
              R {signal.risePct.toFixed(0)}% / F {signal.fallPct.toFixed(0)}%
            </span>
          </div>
          <p className="text-[11px] mt-1 opacity-80 leading-snug">
            {signal.reasons[0] ?? 'Indicators are balanced'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-400">
          Gathering ticks…
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
        <span>Backtested win rate</span>
        <span className="font-mono font-medium text-gray-600">
          {backtest && backtest.sampleSize > 20
            ? `${backtest.winRate.toFixed(1)}% (n=${backtest.sampleSize})`
            : '—'}
        </span>
      </div>
    </div>
  )
}
