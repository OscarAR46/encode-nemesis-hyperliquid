type ProbeStatus = 'healthy' | 'degraded' | 'failing' | 'unknown'
type ConnectionState = 'CONNECTED' | 'DEGRADED' | 'UNSTABLE' | 'DISCONNECTED'
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
type EventType = 'state_change' | 'probe_update' | 'reconnect' | 'error' | 'anomaly'
type AnomalyPattern = 'spike' | 'oscillation' | 'cascade' | 'partial_outage'

interface ProbeReport {
  name: string
  status: ProbeStatus
  lastUpdate: number
  latency?: number
  message?: string
}

interface ConnectionEvent {
  type: EventType
  timestamp: number
  data: Record<string, unknown>
}

interface LatencyStats {
  current: number
  min: number
  max: number
  mean: number
  median: number
  trend: 'improving' | 'stable' | 'degrading'
  trendRate: number
}

interface ConnectionSettings {
  staleFeedThresholdMs: number
  latencyWarningMs: number
  latencyCriticalMs: number
  failureThreshold: number
  recoveryThreshold: number
  healthCheckIntervalMs: number
  serverTimeoutMs: number
}

const DEFAULT_SETTINGS: ConnectionSettings = {
  staleFeedThresholdMs: 2000,
  latencyWarningMs: 100,
  latencyCriticalMs: 500,
  failureThreshold: 1,
  recoveryThreshold: 2,
  healthCheckIntervalMs: 500,
  serverTimeoutMs: 100,
}

const PROBE_WEIGHTS = {
  priceFeed: 0.30,
  webSocket: 0.30,
  serverHealth: 0.25,
  exchangeHealth: 0.10,
  browser: 0.05,
}

const STATUS_SCORES: Record<ProbeStatus, number> = {
  healthy: 1.0,
  degraded: 0.5,
  failing: 0.0,
  unknown: 0.5,
}

class RingBuffer<T> {
  private buffer: T[] = []
  private maxSize: number
  constructor(maxSize: number) { this.maxSize = maxSize }
  push(item: T) {
    this.buffer.push(item)
    if (this.buffer.length > this.maxSize) this.buffer.shift()
  }
  getAll(): T[] { return [...this.buffer] }
  getRecent(n: number): T[] { return this.buffer.slice(-n) }
  get length(): number { return this.buffer.length }
}

class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map()
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
  }
  off(event: string, handler: Function) { this.listeners.get(event)?.delete(handler) }
  emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach(h => { try { h(data) } catch (e) { console.error(e) } })
  }
}

class PriceFeedProbe {
  private lastUpdateTime = 0
  private updateCount = 0

  recordUpdate(timestamp: number) {
    this.lastUpdateTime = timestamp
    this.updateCount++
  }

  getReport(settings: ConnectionSettings): ProbeReport {
    const now = Date.now()
    const gap = now - this.lastUpdateTime

    if (this.lastUpdateTime === 0) {
      return { name: 'priceFeed', status: 'unknown', lastUpdate: 0, message: 'Awaiting' }
    }

    if (gap > settings.staleFeedThresholdMs * 5) {
      return { name: 'priceFeed', status: 'failing', lastUpdate: this.lastUpdateTime, message: `Stale ${(gap/1000).toFixed(0)}s` }
    }
    if (gap > settings.staleFeedThresholdMs) {
      return { name: 'priceFeed', status: 'degraded', lastUpdate: this.lastUpdateTime, message: 'Delayed' }
    }
    return { name: 'priceFeed', status: 'healthy', lastUpdate: this.lastUpdateTime, message: `${this.updateCount} ticks` }
  }
}

class WebSocketProbe {
  private state: 'open' | 'connecting' | 'closed' = 'closed'
  private lastConnected = 0
  private reconnects = 0
  private error: string | null = null

  recordOpen() { this.state = 'open'; this.lastConnected = Date.now(); this.reconnects = 0; this.error = null }
  recordClose(code?: number) { this.state = 'closed'; if (code && code !== 1000) this.error = `Code ${code}` }
  recordError(msg: string) { this.state = 'closed'; this.error = msg }
  recordReconnecting() { this.state = 'connecting'; this.reconnects++ }

  getReport(): ProbeReport {
    if (this.state === 'open') return { name: 'webSocket', status: 'healthy', lastUpdate: this.lastConnected, message: 'Connected' }
    if (this.state === 'connecting') return { name: 'webSocket', status: 'degraded', lastUpdate: Date.now(), message: `Reconnecting (${this.reconnects})` }
    return { name: 'webSocket', status: 'failing', lastUpdate: Date.now(), message: this.error || 'Disconnected' }
  }
}

class ServerHealthProbe {
  private lastCheck = 0
  private lastLatency = 0
  private latencyHistory: number[] = []
  private healthy = false

  async check(timeoutMs: number): Promise<ProbeReport> {
    const start = Date.now()
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), timeoutMs)
      // Use /health (local-only) not /v1/health (calls external API)
      await fetch('/health', { method: 'GET', signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(t)
      
      this.lastLatency = Date.now() - start
      this.lastCheck = Date.now()
      this.healthy = true
      this.latencyHistory.push(this.lastLatency)
      if (this.latencyHistory.length > 30) this.latencyHistory.shift()

      const status: ProbeStatus = this.lastLatency > 50 ? 'degraded' : 'healthy'
      return { name: 'serverHealth', status, lastUpdate: this.lastCheck, latency: this.lastLatency, message: `${this.lastLatency}ms` }
    } catch {
      this.lastCheck = Date.now()
      this.healthy = false
      return { name: 'serverHealth', status: 'failing', lastUpdate: this.lastCheck, message: 'Offline' }
    }
  }

  getLastReport(): ProbeReport {
    if (!this.lastCheck) return { name: 'serverHealth', status: 'unknown', lastUpdate: 0, message: 'Checking' }
    return {
      name: 'serverHealth',
      status: this.healthy ? 'healthy' : 'failing',
      lastUpdate: this.lastCheck,
      latency: this.lastLatency,
      message: this.healthy ? `${this.lastLatency}ms` : 'Offline'
    }
  }

  getLatencyStats(): LatencyStats | null {
    if (!this.latencyHistory.length) return null
    const sorted = [...this.latencyHistory].sort((a,b) => a-b)
    const mean = this.latencyHistory.reduce((a,b) => a+b, 0) / this.latencyHistory.length
    return { current: this.lastLatency, min: sorted[0], max: sorted[sorted.length-1], mean: Math.round(mean), median: sorted[Math.floor(sorted.length/2)], trend: 'stable', trendRate: 0 }
  }
}

class ExchangeHealthProbe {
  private lastCheck = 0
  private lastLatency = 0
  private latencyHistory: number[] = []
  private healthy = false

  async check(): Promise<ProbeReport> {
    const start = Date.now()
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 5000)
      await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
        signal: ctrl.signal
      })
      clearTimeout(t)
      
      this.lastLatency = Date.now() - start
      this.lastCheck = Date.now()
      this.healthy = true
      this.latencyHistory.push(this.lastLatency)
      if (this.latencyHistory.length > 30) this.latencyHistory.shift()

      return { name: 'exchangeHealth', status: this.lastLatency > 1000 ? 'degraded' : 'healthy', lastUpdate: this.lastCheck, latency: this.lastLatency, message: `${this.lastLatency}ms` }
    } catch {
      this.lastCheck = Date.now()
      this.healthy = false
      return { name: 'exchangeHealth', status: 'failing', lastUpdate: this.lastCheck, message: 'Unreachable' }
    }
  }

  getLastReport(): ProbeReport {
    if (!this.lastCheck) return { name: 'exchangeHealth', status: 'unknown', lastUpdate: 0, message: 'Checking' }
    return { name: 'exchangeHealth', status: this.healthy ? 'healthy' : 'failing', lastUpdate: this.lastCheck, latency: this.lastLatency, message: this.healthy ? `${this.lastLatency}ms` : 'Unreachable' }
  }

  getLatencyStats(): LatencyStats | null {
    if (!this.latencyHistory.length) return null
    const sorted = [...this.latencyHistory].sort((a,b) => a-b)
    const mean = this.latencyHistory.reduce((a,b) => a+b, 0) / this.latencyHistory.length
    return { current: this.lastLatency, min: sorted[0], max: sorted[sorted.length-1], mean: Math.round(mean), median: sorted[Math.floor(sorted.length/2)], trend: 'stable', trendRate: 0 }
  }
}

class BrowserProbe {
  private online = navigator.onLine
  constructor() {
    window.addEventListener('online', () => { this.online = true })
    window.addEventListener('offline', () => { this.online = false })
  }
  getReport(): ProbeReport {
    return { name: 'browser', status: this.online ? 'healthy' : 'failing', lastUpdate: Date.now(), message: this.online ? 'Online' : 'Offline' }
  }
}

class ConnectionMonitor extends EventEmitter {
  private settings: ConnectionSettings
  private priceFeed = new PriceFeedProbe()
  private webSocket = new WebSocketProbe()
  private server = new ServerHealthProbe()
  private exchange = new ExchangeHealthProbe()
  private browser = new BrowserProbe()
  private events = new RingBuffer<ConnectionEvent>(500)
  private currentState: ConnectionState = 'DISCONNECTED'
  private currentConfidence: Confidence = 'NONE'
  private downCount = 0
  private upCount = 0
  private serverInterval: number | null = null
  private exchangeInterval: number | null = null
  private initialized = false

  // Race condition fix: track which probes have reported their first status
  private initialProbesDone = new Set<string>()
  private initializing = true
  private static readonly ALL_PROBES = ['priceFeed', 'webSocket', 'serverHealth', 'exchangeHealth', 'browser']

  constructor() {
    super()
    this.settings = { ...DEFAULT_SETTINGS }
  }

  init(settings?: Partial<ConnectionSettings>) {
    if (this.initialized) return
    if (settings) this.settings = { ...this.settings, ...settings }

    // Browser probe is immediately available (synchronous)
    this.markProbeReady('browser')
    this.emit('probeUpdate', { probe: 'browser', report: this.browser.getReport() })

    this.startChecks()
    this.initialized = true
    this.log('state_change', { previous: null, current: this.currentState })
  }

  destroy() {
    if (this.serverInterval) clearInterval(this.serverInterval)
    if (this.exchangeInterval) clearInterval(this.exchangeInterval)
    this.initialized = false
  }

  private startChecks() {
    this.checkServer()
    this.checkExchange()
    this.serverInterval = window.setInterval(() => this.checkServer(), this.settings.healthCheckIntervalMs)
    this.exchangeInterval = window.setInterval(() => this.checkExchange(), 5000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { this.checkServer(); this.checkExchange() }
    })
  }

  private async checkServer() {
    const report = await this.server.check(this.settings.serverTimeoutMs)
    this.markProbeReady('serverHealth')
    this.emit('probeUpdate', { probe: 'serverHealth', report })
    this.evaluate()
  }

  private async checkExchange() {
    const report = await this.exchange.check()
    this.markProbeReady('exchangeHealth')
    this.emit('probeUpdate', { probe: 'exchangeHealth', report })
    this.evaluate()
  }

  private markProbeReady(probeName: string) {
    if (!this.initializing) return
    this.initialProbesDone.add(probeName)

    // Check if all probes have reported
    const allReady = ConnectionMonitor.ALL_PROBES.every(p => this.initialProbesDone.has(p))
    if (allReady) {
      this.initializing = false
      console.log('[Connection] All probes ready, evaluating initial state')
      // Force immediate evaluation now that all probes have data
      this.evaluate()
    }
  }

  private evaluate() {
    // Race condition fix: don't compute overall state until all probes have reported
    if (this.initializing) {
      // Still emit probe updates for the diagnostic panel, but don't change overall state
      return
    }

    const reports = this.getAllProbeReports()
    let score = 0
    for (const r of reports) {
      const w = PROBE_WEIGHTS[r.name as keyof typeof PROBE_WEIGHTS] || 0
      score += STATUS_SCORES[r.status] * w
    }

    const conf: Confidence = score > 0.85 ? 'HIGH' : score > 0.6 ? 'MEDIUM' : score > 0.3 ? 'LOW' : 'NONE'
    const newState: ConnectionState = conf === 'HIGH' ? 'CONNECTED' : conf === 'MEDIUM' ? 'DEGRADED' : conf === 'LOW' ? 'UNSTABLE' : 'DISCONNECTED'

    this.currentConfidence = conf

    if (newState !== this.currentState) {
      const order = ['CONNECTED', 'DEGRADED', 'UNSTABLE', 'DISCONNECTED']
      const isDown = order.indexOf(newState) > order.indexOf(this.currentState)

      if (isDown) {
        this.downCount++
        this.upCount = 0
        if (this.downCount < this.settings.failureThreshold) return
      } else {
        this.upCount++
        this.downCount = 0
        if (this.upCount < this.settings.recoveryThreshold) return
      }

      const prev = this.currentState
      this.currentState = newState
      this.downCount = 0
      this.upCount = 0

      this.log('state_change', { previous: prev, current: newState, confidence: conf })
      this.emit('stateChange', { previous: prev, current: newState })
    }
  }

  private log(type: EventType, data: Record<string, unknown>) {
    this.events.push({ type, timestamp: Date.now(), data })
  }

  recordPriceUpdate(ts: number) {
    this.priceFeed.recordUpdate(ts)
    this.markProbeReady('priceFeed')
    this.emit('probeUpdate', { probe: 'priceFeed', report: this.priceFeed.getReport(this.settings) })
    this.evaluate()
  }

  recordWebSocketOpen() {
    this.webSocket.recordOpen()
    this.markProbeReady('webSocket')
    this.log('reconnect', { success: true })
    this.emit('probeUpdate', { probe: 'webSocket', report: this.webSocket.getReport() })
    this.evaluate()
  }

  recordWebSocketClose(code?: number, reason?: string) {
    this.webSocket.recordClose(code)
    this.log('error', { probe: 'webSocket', code, reason })
    this.emit('probeUpdate', { probe: 'webSocket', report: this.webSocket.getReport() })
    this.evaluate()
  }

  recordWebSocketError(error: string) {
    this.webSocket.recordError(error)
    this.log('error', { probe: 'webSocket', error })
    this.emit('probeUpdate', { probe: 'webSocket', report: this.webSocket.getReport() })
    this.evaluate()
  }

  recordWebSocketReconnecting() {
    this.webSocket.recordReconnecting()
    this.emit('probeUpdate', { probe: 'webSocket', report: this.webSocket.getReport() })
  }

  getState(): ConnectionState { return this.currentState }
  getConfidence(): Confidence { return this.currentConfidence }
  isInitializing(): boolean { return this.initializing }
  getInitializationProgress(): { ready: string[]; pending: string[] } {
    const ready = [...this.initialProbesDone]
    const pending = ConnectionMonitor.ALL_PROBES.filter(p => !this.initialProbesDone.has(p))
    return { ready, pending }
  }

  getAllProbeReports(): ProbeReport[] {
    return [
      this.priceFeed.getReport(this.settings),
      this.webSocket.getReport(),
      this.server.getLastReport(),
      this.exchange.getLastReport(),
      this.browser.getReport(),
    ]
  }

  getHistory(n?: number): ConnectionEvent[] {
    return n ? this.events.getRecent(n) : this.events.getAll()
  }

  getLatencyStats(probe: 'serverHealth' | 'exchangeHealth'): LatencyStats | null {
    return probe === 'serverHealth' ? this.server.getLatencyStats() : this.exchange.getLatencyStats()
  }

  getSettings(): ConnectionSettings { return { ...this.settings } }

  getLastUpdateTime(): number {
    return Math.max(...this.getAllProbeReports().map(r => r.lastUpdate).filter(t => t > 0), 0)
  }

  getFormattedLastUpdate(): string {
    const t = this.getLastUpdateTime()
    if (!t) return 'Never'
    const d = Date.now() - t
    if (d < 1000) return 'Just now'
    if (d < 60000) return `${Math.floor(d/1000)}s ago`
    return `${Math.floor(d/60000)}m ago`
  }
}

export const connectionMonitor = new ConnectionMonitor()
export type { ConnectionState, Confidence, ProbeReport, ConnectionEvent, LatencyStats, ConnectionSettings, AnomalyPattern }
