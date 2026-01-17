import type { Datasource } from './datasource'
import type {
  Trade,
  TradeParams,
  PositionState,
  PositionParams,
  PnLData,
  PnLParams,
  LeaderboardEntry,
  LeaderboardParams,
  RawHyperliquidFill,
  RawHyperliquidFunding,
  RawClearinghouseState,
  RawAllMids,
  TradeDirection,
  LedgerConfig,
} from './types'

import { DEFAULT_CONFIG } from './types'

export class HyperliquidDatasource implements Datasource {
  readonly name = 'hyperliquid'
  private config: LedgerConfig
  private priceCache: { data: RawAllMids | null; timestamp: number } = { data: null, timestamp: 0 }
  
  constructor(config?: Partial<LedgerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }
  
  async getTrades(params: TradeParams): Promise<Trade[]> {
    const fills = await this.fetchUserFills(params.user)
    let trades = fills.map(f => this.normalizeFill(f))
    
    if (params.coin) {
      trades = trades.filter(t => t.coin.toUpperCase() === params.coin!.toUpperCase())
    }
    if (params.fromMs !== undefined) {
      trades = trades.filter(t => t.timeMs >= params.fromMs!)
    }
    if (params.toMs !== undefined) {
      trades = trades.filter(t => t.timeMs <= params.toMs!)
    }
    if (params.builderOnly) {
      trades = this.filterBuilderOnly(trades)
    }
    
    return trades.sort((a, b) => a.timeMs - b.timeMs)
  }
  
  async getPositionHistory(params: PositionParams): Promise<PositionState[]> {
    const allTrades = await this.getTrades({
      user: params.user,
      coin: params.coin,
      fromMs: params.fromMs,
      toMs: params.toMs,
      builderOnly: false,
    })
    
    if (allTrades.length === 0) return []
    
    const prices = await this.getCurrentPrices()
    const clearinghouse = await this.fetchClearinghouseState(params.user)
    const states = this.reconstructPositions(allTrades, prices, params.builderOnly ?? false)
    
    if (clearinghouse && states.length > 0) {
      this.addRiskFields(states, clearinghouse)
    }
    
    return states
  }
  
  async getPnL(params: PnLParams): Promise<PnLData> {
    const trades = await this.getTrades({
      user: params.user,
      coin: params.coin,
      fromMs: params.fromMs,
      toMs: params.toMs,
      builderOnly: false,
    })
    
    const funding = await this.fetchUserFunding(params.user)
    let relevantFunding = funding
    
    if (params.coin) {
      relevantFunding = funding.filter(f => f.coin.toUpperCase() === params.coin!.toUpperCase())
    }
    if (params.fromMs !== undefined) {
      relevantFunding = relevantFunding.filter(f => f.time >= params.fromMs!)
    }
    if (params.toMs !== undefined) {
      relevantFunding = relevantFunding.filter(f => f.time <= params.toMs!)
    }
    
    const builderTrades = params.builderOnly ? this.filterBuilderOnly(trades) : trades
    const tainted = params.builderOnly ? this.detectTaint(trades) : false
    
    const realizedPnl = builderTrades.reduce((sum, t) => sum + t.closedPnl, 0)
    const feesPaid = builderTrades.reduce((sum, t) => sum + t.fee, 0)
    const fundingPaid = relevantFunding.reduce((sum, f) => sum + parseFloat(f.usdc), 0)
    const volume = builderTrades.reduce((sum, t) => sum + (t.px * t.sz), 0)
    
    const closingTrades = builderTrades.filter(t => t.closedPnl !== 0)
    const wins = closingTrades.filter(t => t.closedPnl > 0)
    const losses = closingTrades.filter(t => t.closedPnl < 0)
    
    const winCount = wins.length
    const lossCount = losses.length
    const winRate = closingTrades.length > 0 ? winCount / closingTrades.length : 0
    
    const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.closedPnl)) : 0
    const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.closedPnl)) : 0
    
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.closedPnl, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.closedPnl, 0) / losses.length : 0
    
    const grossProfit = wins.reduce((s, t) => s + t.closedPnl, 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.closedPnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
    
    const equityAtStart = await this.getUserEquity(params.user, params.fromMs)
    const effectiveCapital = params.maxStartCapital 
      ? Math.min(equityAtStart, params.maxStartCapital)
      : equityAtStart
    
    const returnPct = effectiveCapital > 0 
      ? (realizedPnl / effectiveCapital) * 100 
      : 0
    
    const currentState = await this.fetchClearinghouseState(params.user)
    let unrealizedPnl = 0
    
    if (currentState) {
      if (params.coin) {
        const pos = currentState.assetPositions.find(
          p => p.position.coin.toUpperCase() === params.coin!.toUpperCase()
        )
        unrealizedPnl = pos ? parseFloat(pos.position.unrealizedPnl) : 0
      } else {
        unrealizedPnl = currentState.assetPositions.reduce(
          (sum, p) => sum + parseFloat(p.position.unrealizedPnl), 0
        )
      }
    }
    
    return {
      user: params.user,
      coin: params.coin ?? null,
      fromMs: params.fromMs ?? null,
      toMs: params.toMs ?? null,
      realizedPnl,
      unrealizedPnl,
      totalPnl: realizedPnl + unrealizedPnl,
      returnPct,
      feesPaid,
      fundingPaid,
      tradeCount: builderTrades.length,
      volume,
      winCount,
      lossCount,
      winRate,
      largestWin,
      largestLoss,
      avgWin,
      avgLoss,
      profitFactor,
      effectiveCapital,
      tainted,
    }
  }
  
  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardEntry[]> {
    const users = await this.getTrackedUsers()
    if (users.length === 0) return []
    
    const entries: LeaderboardEntry[] = []
    
    for (const user of users) {
      try {
        const pnl = await this.getPnL({
          user,
          coin: params.coin,
          fromMs: params.fromMs,
          toMs: params.toMs,
          builderOnly: params.builderOnly,
          maxStartCapital: params.maxStartCapital,
        })
        
        if (params.builderOnly && pnl.tainted) continue
        
        let metricValue: number
        switch (params.metric) {
          case 'volume': metricValue = pnl.volume; break
          case 'pnl': metricValue = pnl.realizedPnl; break
          case 'returnPct': metricValue = pnl.returnPct; break
          default: metricValue = pnl.realizedPnl
        }
        
        entries.push({
          rank: 0,
          user,
          metricValue,
          metricName: params.metric,
          tradeCount: pnl.tradeCount,
          volume: pnl.volume,
          realizedPnl: pnl.realizedPnl,
          returnPct: pnl.returnPct,
          winRate: pnl.winRate,
          tainted: pnl.tainted,
        })
      } catch (error) {
        console.error(`[Hyperliquid] Failed to fetch P&L for ${user}:`, error)
      }
    }
    
    entries.sort((a, b) => b.metricValue - a.metricValue)
    entries.forEach((e, i) => { e.rank = i + 1 })
    
    const limit = params.limit ?? this.config.maxLeaderboardSize
    return entries.slice(0, limit)
  }
  
  async getUserEquity(user: string, _atTimeMs?: number): Promise<number> {
    const state = await this.fetchClearinghouseState(user)
    if (!state) return 0
    return parseFloat(state.marginSummary.accountValue)
  }
  
  async getCurrentPrices(): Promise<RawAllMids> {
    const now = Date.now()
    if (this.priceCache.data && (now - this.priceCache.timestamp) < 5000) {
      return this.priceCache.data
    }
    const response = await this.makeRequest<RawAllMids>({ type: 'allMids' })
    this.priceCache = { data: response, timestamp: now }
    return response
  }
  
  async getTrackedUsers(): Promise<string[]> {
    if (this.config.trackedUsers.length > 0) {
      return this.config.trackedUsers
    }
    return [
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000002',
      '0x0000000000000000000000000000000000000003',
    ]
  }
  
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message?: string }> {
    const start = Date.now()
    try {
      await this.makeRequest({ type: 'allMids' })
      return { healthy: true, latencyMs: Date.now() - start, message: 'Hyperliquid Info API responding' }
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  private async makeRequest<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.config.hyperliquidInfoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }
  
  private async fetchUserFills(user: string): Promise<RawHyperliquidFill[]> {
    return this.makeRequest({ type: 'userFills', user })
  }
  
  private async fetchUserFunding(user: string): Promise<RawHyperliquidFunding[]> {
    return this.makeRequest({ type: 'userFunding', user })
  }
  
  private async fetchClearinghouseState(user: string): Promise<RawClearinghouseState | null> {
    try {
      return await this.makeRequest({ type: 'clearinghouseState', user })
    } catch {
      return null
    }
  }
  
  private normalizeFill(raw: RawHyperliquidFill): Trade {
    return {
      timeMs: raw.time,
      coin: raw.coin,
      side: raw.side === 'B' ? 'buy' : 'sell',
      px: parseFloat(raw.px),
      sz: parseFloat(raw.sz),
      fee: parseFloat(raw.fee),
      closedPnl: parseFloat(raw.closedPnl),
      direction: raw.dir as TradeDirection,
      hash: raw.hash,
      oid: raw.oid,
      tid: raw.tid,
      builder: raw.builder ?? null,
      liquidation: raw.liquidation ? (parseFloat(raw.startPosition) === 0 ? null : 'partial') : null,
      crossed: raw.crossed,
    }
  }
  
  private reconstructPositions(trades: Trade[], prices: RawAllMids, builderOnly: boolean): PositionState[] {
    const states: PositionState[] = []
    const positionsByCoins = new Map<string, {
      netSize: number
      totalCost: number
      avgEntryPx: number
      realizedPnl: number
      lifecycleId: number
      hasBuilderTrades: boolean
      hasNonBuilderTrades: boolean
    }>()
    
    let globalLifecycleId = 0
    const targetBuilder = this.config.targetBuilder
    
    for (const trade of trades) {
      const coin = trade.coin.toUpperCase()
      
      let pos = positionsByCoins.get(coin)
      if (!pos) {
        pos = {
          netSize: 0,
          totalCost: 0,
          avgEntryPx: 0,
          realizedPnl: 0,
          lifecycleId: 0,
          hasBuilderTrades: false,
          hasNonBuilderTrades: false,
        }
        positionsByCoins.set(coin, pos)
      }
      
      const isBuilderTrade = targetBuilder !== null && trade.builder === targetBuilder
      if (isBuilderTrade) {
        pos.hasBuilderTrades = true
      } else {
        pos.hasNonBuilderTrades = true
      }
      
      const wasFlat = pos.netSize === 0
      if (wasFlat) {
        globalLifecycleId++
        pos.lifecycleId = globalLifecycleId
        pos.hasBuilderTrades = isBuilderTrade
        pos.hasNonBuilderTrades = !isBuilderTrade
        pos.realizedPnl = 0
      }
      
      const signedSize = trade.side === 'buy' ? trade.sz : -trade.sz
      const prevSize = pos.netSize
      const newSize = prevSize + signedSize
      
      const isIncreasing = (prevSize >= 0 && signedSize > 0) || (prevSize <= 0 && signedSize < 0)
      
      if (isIncreasing) {
        pos.totalCost += trade.px * Math.abs(signedSize)
        pos.netSize = newSize
        pos.avgEntryPx = pos.netSize !== 0 ? pos.totalCost / Math.abs(pos.netSize) : 0
      } else {
        const closeSize = Math.min(Math.abs(signedSize), Math.abs(prevSize))
        pos.realizedPnl += trade.closedPnl
        
        if (prevSize !== 0) {
          const fractionClosed = closeSize / Math.abs(prevSize)
          pos.totalCost *= (1 - fractionClosed)
        }
        
        pos.netSize = newSize
        
        if ((prevSize > 0 && newSize < 0) || (prevSize < 0 && newSize > 0)) {
          const flipSize = Math.abs(newSize)
          pos.totalCost = trade.px * flipSize
          pos.avgEntryPx = trade.px
        } else if (newSize !== 0) {
          pos.avgEntryPx = pos.totalCost / Math.abs(pos.netSize)
        } else {
          pos.avgEntryPx = 0
        }
      }
      
      let unrealizedPnl = 0
      if (pos.netSize !== 0) {
        const currentPrice = parseFloat(prices[coin] || '0')
        if (currentPrice > 0) {
          const notional = Math.abs(pos.netSize) * currentPrice
          const costBasis = Math.abs(pos.netSize) * pos.avgEntryPx
          unrealizedPnl = pos.netSize > 0 ? notional - costBasis : costBasis - notional
        }
      }
      
      const tainted = builderOnly && pos.hasBuilderTrades && pos.hasNonBuilderTrades
      
      states.push({
        timeMs: trade.timeMs,
        coin,
        netSize: pos.netSize,
        avgEntryPx: pos.avgEntryPx,
        unrealizedPnl,
        realizedPnl: pos.realizedPnl,
        lifecycleId: pos.lifecycleId,
        tainted,
        liqPx: null,
        marginUsed: null,
      })
      
      if (pos.netSize === 0) {
        pos.hasBuilderTrades = false
        pos.hasNonBuilderTrades = false
        pos.realizedPnl = 0
      }
    }
    
    return states
  }
  
  private addRiskFields(states: PositionState[], clearinghouse: RawClearinghouseState): void {
    const currentRisk = new Map<string, { liqPx: number | null; marginUsed: number }>()
    
    for (const ap of clearinghouse.assetPositions) {
      const coin = ap.position.coin.toUpperCase()
      currentRisk.set(coin, {
        liqPx: ap.position.liquidationPx ? parseFloat(ap.position.liquidationPx) : null,
        marginUsed: parseFloat(ap.position.marginUsed),
      })
    }
    
    const lastStateIndex = new Map<string, number>()
    states.forEach((s, i) => { lastStateIndex.set(s.coin, i) })
    
    for (const [coin, idx] of lastStateIndex) {
      const state = states[idx]
      if (state.netSize !== 0) {
        const risk = currentRisk.get(coin)
        if (risk) {
          state.liqPx = risk.liqPx
          state.marginUsed = risk.marginUsed
        }
      }
    }
  }
  
  private filterBuilderOnly(trades: Trade[]): Trade[] {
    const targetBuilder = this.config.targetBuilder
    if (!targetBuilder) return trades
    return trades.filter(t => t.builder === targetBuilder)
  }
  
  private detectTaint(trades: Trade[]): boolean {
    const targetBuilder = this.config.targetBuilder
    if (!targetBuilder) return false
    
    const byCoin = new Map<string, Trade[]>()
    for (const t of trades) {
      const coin = t.coin.toUpperCase()
      const list = byCoin.get(coin) || []
      list.push(t)
      byCoin.set(coin, list)
    }
    
    for (const [, coinTrades] of byCoin) {
      let inLifecycle = false
      let hasBuilder = false
      let hasNonBuilder = false
      let netSize = 0
      
      for (const t of coinTrades) {
        const signedSize = t.side === 'buy' ? t.sz : -t.sz
        const prevSize = netSize
        netSize += signedSize
        
        if (prevSize === 0 && netSize !== 0) {
          inLifecycle = true
          hasBuilder = false
          hasNonBuilder = false
        }
        
        if (inLifecycle) {
          if (t.builder === targetBuilder) {
            hasBuilder = true
          } else {
            hasNonBuilder = true
          }
        }
        
        if (netSize === 0 && inLifecycle) {
          if (hasBuilder && hasNonBuilder) return true
          inLifecycle = false
        }
      }
      
      if (inLifecycle && hasBuilder && hasNonBuilder) return true
    }
    
    return false
  }
}
