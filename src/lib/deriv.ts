// Thin client for Deriv's public WebSocket API (market data only — no
// authentication, no trading). Docs: https://developers.deriv.com
// app_id 1089 is Deriv's published demo app id for public API access.
const WS_URL = 'wss://ws.derivws.com/websockets/v3?app_id=1089'

export interface TickData {
  symbol: string
  price: number
  epoch: number
}

type TickListener = (tick: TickData) => void

export const VOLATILITY_SYMBOLS = [
  { symbol: 'R_10', name: 'Volatility 10 Index' },
  { symbol: 'R_25', name: 'Volatility 25 Index' },
  { symbol: 'R_50', name: 'Volatility 50 Index' },
  { symbol: 'R_75', name: 'Volatility 75 Index' },
  { symbol: 'R_100', name: 'Volatility 100 Index' },
  { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index' },
  { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index' },
  { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index' },
  { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index' },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index' },
] as const

class DerivFeed {
  private ws: WebSocket | null = null
  private reqId = 1
  private queue: string[] = []
  private activeSymbols = new Set<string>()
  private tickListeners = new Set<TickListener>()
  private historyCallbacks = new Map<string, (prices: number[]) => void>()
  private connecting = false

  connect() {
    if (this.ws || this.connecting || typeof window === 'undefined') return
    this.connecting = true
    const ws = new WebSocket(WS_URL)
    this.ws = ws

    ws.onopen = () => {
      this.connecting = false
      const pending = this.queue
      this.queue = []
      pending.forEach((raw) => ws.send(raw))
      this.activeSymbols.forEach((symbol) =>
        ws.send(JSON.stringify({ req_id: this.reqId++, ticks: symbol, subscribe: 1 })),
      )
    }

    ws.onmessage = (event) => {
      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      if (data.msg_type === 'tick' && data.tick) {
        const tick: TickData = {
          symbol: data.tick.symbol,
          price: parseFloat(data.tick.quote),
          epoch: data.tick.epoch,
        }
        this.tickListeners.forEach((cb) => cb(tick))
      } else if (data.msg_type === 'history') {
        const symbol = data.echo_req?.ticks_history
        const prices: number[] = (data.history?.prices ?? []).map((p: string) => parseFloat(p))
        if (symbol) this.historyCallbacks.get(symbol)?.(prices)
      }
    }

    ws.onclose = () => {
      this.ws = null
      this.connecting = false
      setTimeout(() => this.connect(), 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  private send(payload: object) {
    const raw = JSON.stringify({ req_id: this.reqId++, ...payload })
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw)
    } else {
      this.queue.push(raw)
      this.connect()
    }
  }

  subscribeTicks(symbol: string) {
    this.activeSymbols.add(symbol)
    this.send({ ticks: symbol, subscribe: 1 })
  }

  requestHistory(symbol: string, count: number, cb: (prices: number[]) => void) {
    this.historyCallbacks.set(symbol, cb)
    this.send({ ticks_history: symbol, count, end: 'latest', style: 'ticks' })
  }

  onTick(cb: TickListener) {
    this.tickListeners.add(cb)
    return () => this.tickListeners.delete(cb)
  }
}

export const derivFeed = new DerivFeed()
