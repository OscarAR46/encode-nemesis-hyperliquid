import { connectionMonitor } from '@app/connection'
import { state } from '@app/state'
import { render } from '@app/render'
import { showRandomDialogue } from '@app/signal'

type WebSocketState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface HyperliquidMessage {
  channel: string
  data: {
    mids?: Record<string, string>
    coin?: string
    levels?: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>]
  }
}

interface PriceSnapshot { price: number; timestamp: number }

const WS_URL = 'wss://api.hyperliquid.xyz/ws'
const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000
const HEARTBEAT_INTERVAL = 30000
const PRICE_HISTORY_LENGTH = 60
const DIALOGUE_COOLDOWN = 15000

const THRESHOLDS = { medium: 2.5, large: 5.0, massive: 10.0, extreme: 15.0 }
const WATCHED = ['BTC', 'ETH', 'SOL', 'HYPE', 'ARB', 'DOGE', 'XRP', 'AVAX', 'LINK']

class HyperliquidWebSocket {
  private ws: WebSocket | null = null
  private wsState: WebSocketState = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private lastMessageTime = 0
  private priceHistory: Map<string, PriceSnapshot[]> = new Map()
  private lastPrices: Map<string, number> = new Map()
  private lastDialogueTime = 0

  connect() {
    if (this.wsState === 'connecting' || this.wsState === 'connected') return
    this.wsState = 'connecting'
    connectionMonitor.recordWebSocketReconnecting()
    try {
      this.ws = new WebSocket(WS_URL)
      this.setupHandlers()
    } catch (e) {
      this.handleError(e instanceof Error ? e.message : 'Connection failed')
    }
  }

  disconnect() {
    this.cleanup()
    if (this.ws) { this.ws.close(1000, 'Client disconnect'); this.ws = null }
    this.wsState = 'disconnected'
  }

  private setupHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.wsState = 'connected'
      this.reconnectAttempts = 0
      this.lastMessageTime = Date.now()
      connectionMonitor.recordWebSocketOpen()
      this.send({ method: 'subscribe', subscription: { type: 'allMids' } })
      this.startHeartbeat()
      console.log('[WebSocket] Connected')
    }

    this.ws.onmessage = (e) => {
      this.lastMessageTime = Date.now()
      try {
        this.handleMessage(JSON.parse(e.data))
      } catch {}
    }

    this.ws.onclose = (e) => {
      const wasConnected = this.wsState === 'connected'
      this.wsState = 'disconnected'
      this.cleanup()
      connectionMonitor.recordWebSocketClose(e.code, e.reason)
      if (wasConnected || e.code !== 1000) this.scheduleReconnect()
    }

    this.ws.onerror = () => this.handleError('WebSocket error')
  }

  private send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data))
  }

  private handleMessage(msg: HyperliquidMessage) {
    if (msg.channel === 'allMids' && msg.data.mids) this.handlePrices(msg.data.mids)
    if (msg.channel === 'l2Book' && msg.data.levels && msg.data.coin) this.handleOrderBook(msg.data.coin, msg.data.levels)
  }

  private handleOrderBook(coin: string, levels: [Array<{ px: string; sz: string; n: number }>, Array<{ px: string; sz: string; n: number }>]) {
    const [bids, asks] = levels

    state.orderBook = {
      coin,
      bids: bids.slice(0, 15).map(l => ({ price: parseFloat(l.px), size: parseFloat(l.sz) })),
      asks: asks.slice(0, 15).map(l => ({ price: parseFloat(l.px), size: parseFloat(l.sz) })),
      lastUpdate: Date.now(),
    }

    if (state.showOrderBook) render()
  }

  subscribeToOrderBook(coin: string) {
    // Unsubscribe from previous if any
    if (state.orderBookCoin && state.orderBookCoin !== coin) {
      this.send({ method: 'unsubscribe', subscription: { type: 'l2Book', coin: state.orderBookCoin } })
    }
    state.orderBookCoin = coin
    state.orderBook = null
    this.send({ method: 'subscribe', subscription: { type: 'l2Book', coin } })
    console.log(`[WebSocket] Subscribed to L2 book: ${coin}`)
  }

  unsubscribeFromOrderBook() {
    if (state.orderBookCoin) {
      this.send({ method: 'unsubscribe', subscription: { type: 'l2Book', coin: state.orderBookCoin } })
      state.orderBook = null
      console.log(`[WebSocket] Unsubscribed from L2 book: ${state.orderBookCoin}`)
    }
  }

  private handlePrices(mids: Record<string, string>) {
    const now = Date.now()
    connectionMonitor.recordPriceUpdate(now)

    const prices: Record<string, number> = {}
    for (const [coin, priceStr] of Object.entries(mids)) {
      const price = parseFloat(priceStr)
      prices[coin] = price

      const last = this.lastPrices.get(coin)
      if (last && last > 0 && WATCHED.includes(coin)) {
        const pct = ((price - last) / last) * 100
        this.checkAlert(coin, pct)
        this.updateHistory(coin, price, now)
      }
      this.lastPrices.set(coin, price)
    }

    state.prices = prices
    state.lastPriceUpdate = now
    if (state.scene === 'main') render()
  }

  private checkAlert(coin: string, pct: number) {
    const abs = Math.abs(pct)
    if (abs < THRESHOLDS.large) return

    const now = Date.now()
    if (now - this.lastDialogueTime < DIALOGUE_COOLDOWN) return
    if (state.scene !== 'main' || !state.introComplete) return

    this.lastDialogueTime = now

    if (abs >= THRESHOLDS.extreme) {
      showRandomDialogue(pct > 0 ? 'priceExtremePump' : 'priceExtremeDump')
    } else if (abs >= THRESHOLDS.massive) {
      showRandomDialogue(pct > 0 ? 'priceMassivePump' : 'priceMassiveDump')
    } else {
      showRandomDialogue(pct > 0 ? 'pricePump' : 'priceDump')
    }
    console.log(`[Price] ${coin}: ${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`)
  }

  private updateHistory(coin: string, price: number, ts: number) {
    let h = this.priceHistory.get(coin)
    if (!h) { h = []; this.priceHistory.set(coin, h) }
    h.push({ price, timestamp: ts })
    if (h.length > PRICE_HISTORY_LENGTH) h.shift()
  }

  private handleError(msg: string) {
    connectionMonitor.recordWebSocketError(msg)
    console.error('[WebSocket]', msg)
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        if (Date.now() - this.lastMessageTime > HEARTBEAT_INTERVAL * 2) {
          this.ws.close(4000, 'Heartbeat timeout')
        } else {
          this.send({ method: 'ping' })
        }
      }
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return
    this.wsState = 'reconnecting'
    this.reconnectAttempts++
    const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1), RECONNECT_MAX_DELAY)
    console.log(`[WebSocket] Reconnecting in ${delay}ms`)
    this.reconnectTimeout = setTimeout(() => { this.reconnectTimeout = null; this.connect() }, delay)
  }

  private cleanup() {
    this.stopHeartbeat()
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null }
  }

  isConnected(): boolean { return this.wsState === 'connected' && this.ws?.readyState === WebSocket.OPEN }
  getPrice(coin: string): number | undefined { return this.lastPrices.get(coin) }
}

export const hyperliquidWS = new HyperliquidWebSocket()

export function initWebSocket() {
  hyperliquidWS.connect()
  window.addEventListener('online', () => { if (!hyperliquidWS.isConnected()) hyperliquidWS.connect() })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !hyperliquidWS.isConnected()) hyperliquidWS.connect()
  })
}
