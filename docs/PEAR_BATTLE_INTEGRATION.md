# Pear Protocol Battle Trading Integration

## Executive Summary

Transform Nemesis from a prediction market trading platform into a **competitive pair/basket trading arena** that executes real trades through the Pear Execution API. The core innovation: **trading battles are literally pair trades** - when you challenge someone to a 1v1, you're betting your asset outperforms theirs.

---

## The Core Concept: "Battle = Pair Trade"

### Current System
```
1v1 Duel: Player bets YES/NO on a prediction market against a rival
```

### New Paradigm
```
1v1 Battle: Player A picks LONG ETH → competes against → Player B picks LONG BTC
            This IS a pair trade: Long ETH / Short BTC
            Winner = whoever's asset outperforms over the battle duration
```

This is **not just gamification** - it's a fundamental insight that competitive trading between assets IS pair trading. Pear Protocol literally settles these as paired positions on Hyperliquid.

---

## Battle Modes Mapped to Pear Trades

### 1. Solo Pair Trade (Practice/Training Mode)
**Pear API**: Standard pair trade with 1 long + 1 short asset
```typescript
{
  longAssets: [{ asset: "ETH", weight: 1.0 }],
  shortAssets: [{ asset: "BTC", weight: 1.0 }],
  usdValue: 100,
  leverage: 2
}
```
- No opponent - just you vs the market
- "I think ETH will outperform BTC"
- NPC coaches you: "Hmm, betting ETH over BTC? Bold move~"

### 2. 1v1 Battle (Duel Mode)
**Pear API**: Mirror pair trades (opposite sides)
```typescript
// Player A's position
{
  longAssets: [{ asset: "HYPE", weight: 1.0 }],
  shortAssets: [{ asset: "ARB", weight: 1.0 }],
  usdValue: 250,
  leverage: 3
}

// Player B's position (automatically the inverse)
{
  longAssets: [{ asset: "ARB", weight: 1.0 }],
  shortAssets: [{ asset: "HYPE", weight: 1.0 }],
  usdValue: 250,
  leverage: 3
}
```
- Two wallets, opposing positions
- One wins, one loses (zero-sum on relative performance)
- Challenge flow: A creates battle → B accepts → both positions open via Pear
- Settlement: Winner = positive PnL on their pair trade

### 3. 2v2 Team Battle (Lobby Mode)
**Pear API**: Basket trades (multiple assets per side)
```typescript
// Team A: "AI Bulls" - Long AI ecosystem
{
  longAssets: [
    { asset: "TAO", weight: 0.4 },
    { asset: "RENDER", weight: 0.3 },
    { asset: "FET", weight: 0.3 }
  ],
  shortAssets: [
    { asset: "ETH", weight: 1.0 }  // Benchmark
  ],
  usdValue: 500,  // Split among team
  leverage: 2
}

// Team B: "L2 Maxis" - Long L2 ecosystem
{
  longAssets: [
    { asset: "ARB", weight: 0.4 },
    { asset: "OP", weight: 0.3 },
    { asset: "STRK", weight: 0.3 }
  ],
  shortAssets: [
    { asset: "ETH", weight: 1.0 }  // Same benchmark
  ],
  usdValue: 500,
  leverage: 2
}
```
- Each team picks their "narrative basket"
- Both are long their thesis, short a common benchmark
- Winner = better performing narrative
- NPC: "Team AI Bulls vs Team L2 Maxis... this is going to be EPIC!"

### 4. Battle Royale (Tournament Mode)
**Pear API**: Multiple basket trades + conditional execution
```typescript
// Each participant picks a theme basket
// All go long their basket, short BTC.D or ETH as benchmark
// Winner after X hours = best relative performance

// Entry conditions
{
  executionType: "TRIGGER",
  triggerType: "BTC_DOM",
  direction: "LESS_THAN",
  triggerValue: "55",  // Start when BTC dominance drops
  ...basketConfig
}
```
- 4-8 participants, each picks their narrative
- All baskets execute simultaneously
- Time-limited (1hr, 4hr, 24hr durations)
- Real-time leaderboard tracking relative performance

### 5. Conditional Battles (Trigger Mode)
**Pear API**: TRIGGER execution type
```typescript
{
  executionType: "TRIGGER",
  triggerType: "CROSS_ASSET_PRICE",
  assetName: "BTC",
  direction: "MORE_THAN",
  triggerValue: "100000",
  longAssets: [...],
  shortAssets: [...]
}
```
- "If BTC breaks $100K, I'll long memes against ETH"
- Schedule battles for specific market conditions
- NPC: "Setting a trap for when BTC moons? Clever~"

---

## Architecture Integration

### New Types (`app/types.ts`)

```typescript
// Battle system types
export type BattleMode = 'solo' | 'duel' | 'team' | 'royale'
export type BattleStatus = 'pending' | 'matching' | 'active' | 'settled' | 'cancelled'
export type BattleDuration = '1h' | '4h' | '24h' | '7d'

export interface BattleAsset {
  symbol: string
  weight: number
  currentPrice?: number
  entryPrice?: number
}

export interface BattlePosition {
  longAssets: BattleAsset[]
  shortAssets: BattleAsset[]
  entryValue: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

export interface Battle {
  id: string
  mode: BattleMode
  status: BattleStatus
  duration: BattleDuration
  createdAt: number
  startedAt?: number
  endsAt?: number
  stake: number
  leverage: number

  // Participants
  challenger: {
    address: string
    position: BattlePosition
    team?: string
  }
  opponent?: {
    address: string
    position: BattlePosition
    team?: string
  }

  // For team/royale
  participants?: Array<{
    address: string
    position: BattlePosition
    team: string
    rank?: number
  }>

  // Pear order tracking
  pearOrderId?: string

  // Winner determination
  winner?: string
  settlementTxHash?: string
}

export interface BattleState {
  activeBattles: Battle[]
  pendingChallenges: Battle[]
  battleHistory: Battle[]
  currentBattle: Battle | null

  // Creation state
  isCreatingBattle: boolean
  selectedMode: BattleMode
  selectedDuration: BattleDuration
  selectedAssets: BattleAsset[]
  challengeAddress: string

  // Matching
  isMatchmaking: boolean
}

// Preset battle themes (for quick selection)
export interface BattleTheme {
  id: string
  name: string
  description: string
  icon: string
  assets: BattleAsset[]
}
```

### Preset Battle Themes

```typescript
export const BATTLE_THEMES: BattleTheme[] = [
  {
    id: 'ai-revolution',
    name: 'AI Revolution',
    description: 'The AI narrative will dominate',
    icon: '🤖',
    assets: [
      { symbol: 'TAO', weight: 0.35 },
      { symbol: 'RENDER', weight: 0.25 },
      { symbol: 'FET', weight: 0.20 },
      { symbol: 'NEAR', weight: 0.20 },
    ]
  },
  {
    id: 'l2-summer',
    name: 'L2 Summer',
    description: 'Layer 2s will outperform',
    icon: '🔷',
    assets: [
      { symbol: 'ARB', weight: 0.35 },
      { symbol: 'OP', weight: 0.30 },
      { symbol: 'STRK', weight: 0.20 },
      { symbol: 'MANTA', weight: 0.15 },
    ]
  },
  {
    id: 'meme-lords',
    name: 'Meme Lords',
    description: 'Memes will outperform everything',
    icon: '🐕',
    assets: [
      { symbol: 'DOGE', weight: 0.30 },
      { symbol: 'SHIB', weight: 0.25 },
      { symbol: 'PEPE', weight: 0.25 },
      { symbol: 'WIF', weight: 0.20 },
    ]
  },
  {
    id: 'solana-szn',
    name: 'Solana SZN',
    description: 'Solana ecosystem dominance',
    icon: '☀️',
    assets: [
      { symbol: 'SOL', weight: 0.50 },
      { symbol: 'JTO', weight: 0.25 },
      { symbol: 'BONK', weight: 0.25 },
    ]
  },
  {
    id: 'eth-killer',
    name: 'ETH Killers',
    description: 'Alt L1s will dethrone Ethereum',
    icon: '⚔️',
    assets: [
      { symbol: 'SOL', weight: 0.35 },
      { symbol: 'AVAX', weight: 0.25 },
      { symbol: 'SUI', weight: 0.20 },
      { symbol: 'SEI', weight: 0.20 },
    ]
  },
  {
    id: 'defi-revival',
    name: 'DeFi Revival',
    description: 'DeFi blue chips will lead',
    icon: '🏦',
    assets: [
      { symbol: 'AAVE', weight: 0.30 },
      { symbol: 'UNI', weight: 0.25 },
      { symbol: 'MKR', weight: 0.25 },
      { symbol: 'SNX', weight: 0.20 },
    ]
  },
  {
    id: 'gaming-guild',
    name: 'Gaming Guild',
    description: 'GameFi will moon',
    icon: '🎮',
    assets: [
      { symbol: 'IMX', weight: 0.35 },
      { symbol: 'GALA', weight: 0.25 },
      { symbol: 'AXS', weight: 0.20 },
      { symbol: 'BEAM', weight: 0.20 },
    ]
  },
  {
    id: 'hyperliquid-maxi',
    name: 'Hyperliquid Maxi',
    description: 'HYPE will outperform all',
    icon: '💎',
    assets: [
      { symbol: 'HYPE', weight: 1.0 },
    ]
  }
]
```

### New Service: Pear API Client (`app/pear/client.ts`)

```typescript
import { signTypedData } from '@wagmi/core'
import { wagmiConfig } from '@config/wagmi'

const PEAR_API = 'https://hl-v2.pearprotocol.io'
const CLIENT_ID = 'HLHackathon1'  // Or HLHackathon2-10

interface PearTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

let pearTokens: PearTokens | null = null

// ============================================
// Authentication
// ============================================

export async function authenticatePear(address: string): Promise<PearTokens> {
  // Step 1: Get EIP-712 message
  const msgResponse = await fetch(`${PEAR_API}/auth/message`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  const { domain, types, message } = await msgResponse.json()

  // Step 2: Sign with wallet
  const signature = await signTypedData(wagmiConfig, {
    domain,
    types,
    primaryType: 'Auth',
    message
  })

  // Step 3: Submit signature
  const authResponse = await fetch(`${PEAR_API}/auth/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature,
      address,
      clientId: CLIENT_ID
    })
  })

  const { accessToken, refreshToken, expiresIn } = await authResponse.json()

  pearTokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000
  }

  return pearTokens
}

async function getAccessToken(): Promise<string> {
  if (!pearTokens) throw new Error('Not authenticated with Pear')

  // Refresh if expired
  if (Date.now() > pearTokens.expiresAt - 60000) {
    const refreshResponse = await fetch(`${PEAR_API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: pearTokens.refreshToken })
    })
    const { accessToken, expiresIn } = await refreshResponse.json()
    pearTokens.accessToken = accessToken
    pearTokens.expiresAt = Date.now() + expiresIn * 1000
  }

  return pearTokens.accessToken
}

// ============================================
// Position Creation (Battles)
// ============================================

interface CreateBattlePositionParams {
  longAssets: Array<{ asset: string; weight: number }>
  shortAssets: Array<{ asset: string; weight: number }>
  usdValue: number
  leverage: number
  slippage?: number
  executionType?: 'SYNC' | 'MARKET' | 'TRIGGER' | 'TWAP'

  // Trigger conditions
  trigger?: {
    type: 'PRICE' | 'CROSS_ASSET_PRICE' | 'BTC_DOM'
    value: string
    direction: 'MORE_THAN' | 'LESS_THAN'
    assetName?: string
  }

  // Risk management
  stopLoss?: { type: 'PERCENTAGE'; value: number }
  takeProfit?: { type: 'PERCENTAGE'; value: number }
}

export async function createBattlePosition(params: CreateBattlePositionParams): Promise<{
  orderId: string
  fills: any[]
}> {
  const token = await getAccessToken()

  const body: any = {
    slippage: params.slippage || 0.01,
    executionType: params.executionType || 'MARKET',
    leverage: params.leverage,
    usdValue: params.usdValue,
    longAssets: params.longAssets,
    shortAssets: params.shortAssets
  }

  if (params.trigger) {
    body.executionType = 'TRIGGER'
    body.triggerType = params.trigger.type
    body.triggerValue = params.trigger.value
    body.direction = params.trigger.direction
    if (params.trigger.assetName) {
      body.assetName = params.trigger.assetName
    }
  }

  if (params.stopLoss) {
    body.stopLoss = params.stopLoss
  }

  if (params.takeProfit) {
    body.takeProfit = params.takeProfit
  }

  const response = await fetch(`${PEAR_API}/positions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create position')
  }

  return response.json()
}

// ============================================
// Position Management
// ============================================

export async function getOpenPositions(): Promise<any[]> {
  const token = await getAccessToken()
  const response = await fetch(`${PEAR_API}/positions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

export async function closePosition(positionId: string): Promise<any> {
  const token = await getAccessToken()
  const response = await fetch(`${PEAR_API}/positions/${positionId}/close`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.json()
}

// ============================================
// Market Data
// ============================================

export async function getPearMarkets(): Promise<any[]> {
  const response = await fetch(`${PEAR_API}/markets`)
  return response.json()
}

export async function getAssetPrices(assets: string[]): Promise<Record<string, number>> {
  const response = await fetch(`${PEAR_API}/markets/prices?assets=${assets.join(',')}`)
  return response.json()
}
```

### New Widget: Battle Widget (`app/widgets/battle.ts`)

```typescript
import type { WidgetDefinition } from '@app/widgets/base'
import { wrapWidget } from '@app/widgets/base'
import { state } from '@app/state'
import { BATTLE_THEMES } from '@app/pear/themes'
import { formatUSD } from '@app/utils'
import { ICONS } from '@app/icons'

const battleWidget: WidgetDefinition = {
  id: 'battle',
  title: 'Battle Arena',
  render: renderBattleContent,
}

function renderBattleContent(): string {
  const mode = state.battle.selectedMode

  return `
    <div class="battle-arena">
      <!-- Mode Selection -->
      <div class="battle-modes">
        <button class="battle-mode ${mode === 'solo' ? 'active' : ''}" data-mode="solo">
          ${ICONS.target} Solo
        </button>
        <button class="battle-mode ${mode === 'duel' ? 'active' : ''}" data-mode="duel">
          ${ICONS.swords} 1v1
        </button>
        <button class="battle-mode ${mode === 'team' ? 'active' : ''}" data-mode="team">
          ${ICONS.lobby} 2v2
        </button>
        <button class="battle-mode ${mode === 'royale' ? 'active' : ''}" data-mode="royale">
          ${ICONS.crown} Royale
        </button>
      </div>

      <!-- Theme Selection (Quick Picks) -->
      <div class="battle-themes">
        <label class="form-label">Choose Your Narrative</label>
        <div class="theme-grid">
          ${BATTLE_THEMES.map(theme => `
            <button class="theme-card ${state.battle.selectedTheme === theme.id ? 'selected' : ''}"
                    data-theme="${theme.id}">
              <span class="theme-icon">${theme.icon}</span>
              <span class="theme-name">${theme.name}</span>
              <span class="theme-assets">${theme.assets.map(a => a.symbol).join(', ')}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- vs Indicator -->
      ${mode !== 'solo' ? `
        <div class="battle-vs">
          <div class="vs-side yours">
            <span class="vs-label">Your Basket</span>
            <span class="vs-assets">${getCurrentBasketDisplay()}</span>
          </div>
          <div class="vs-icon">${ICONS.swords}</div>
          <div class="vs-side theirs">
            <span class="vs-label">${mode === 'duel' ? 'Opponent' : 'Other Team'}</span>
            <span class="vs-assets">???</span>
          </div>
        </div>
      ` : ''}

      <!-- Stake & Duration -->
      <div class="battle-config">
        <div class="form-group">
          <label class="form-label">Battle Stakes</label>
          <div class="form-input-wrap">
            <input type="number" class="form-input" id="battle-stake"
                   value="${state.battle.stake}" min="10" step="10">
            <span class="form-suffix">USDC</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Duration</label>
          <div class="duration-buttons">
            <button class="duration-btn ${state.battle.duration === '1h' ? 'active' : ''}"
                    data-duration="1h">1H</button>
            <button class="duration-btn ${state.battle.duration === '4h' ? 'active' : ''}"
                    data-duration="4h">4H</button>
            <button class="duration-btn ${state.battle.duration === '24h' ? 'active' : ''}"
                    data-duration="24h">24H</button>
            <button class="duration-btn ${state.battle.duration === '7d' ? 'active' : ''}"
                    data-duration="7d">7D</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Leverage</label>
          <input type="range" class="leverage-slider" id="battle-leverage"
                 min="1" max="10" value="${state.battle.leverage}">
          <span class="leverage-value">${state.battle.leverage}x</span>
        </div>
      </div>

      <!-- Target Address (for 1v1) -->
      ${mode === 'duel' ? `
        <div class="form-group">
          <label class="form-label">Challenge Rival</label>
          <div class="form-input-wrap">
            <input type="text" class="form-input" id="battle-target"
                   placeholder="0x... or name.eth" value="${state.battle.targetAddress}">
          </div>
        </div>
      ` : ''}

      <!-- Action Button -->
      <button class="battle-btn ${mode}" id="battle-submit"
              ${state.battle.isCreating ? 'disabled' : ''}>
        ${getBattleButtonText(mode)}
      </button>
    </div>
  `
}

function getBattleButtonText(mode: string): string {
  if (state.battle.isCreating) return 'Creating Battle...'

  switch (mode) {
    case 'solo': return 'OPEN PAIR TRADE'
    case 'duel': return 'SEND CHALLENGE'
    case 'team': return 'CREATE TEAM BATTLE'
    case 'royale': return 'JOIN BATTLE ROYALE'
    default: return 'BATTLE'
  }
}

function getCurrentBasketDisplay(): string {
  const theme = BATTLE_THEMES.find(t => t.id === state.battle.selectedTheme)
  if (theme) return theme.assets.map(a => a.symbol).join(', ')
  return 'Select a theme'
}

export function renderBattleWidget(): string {
  return wrapWidget(battleWidget, battleWidget.render(), 'battle')
}

export default battleWidget
```

---

## NPC Dialogue Integration

### New Dialogue Categories (`app/dialogue.ts` additions)

```typescript
// Add to DIALOGUE object:

// Solo pair trade reactions
pairTradeOpened: [
  { text: "Ooh~ Betting ${LONG} over ${SHORT}? Interesting thesis!", emotion: 'excited' as Emotion },
  { text: "A classic pair trade. You think ${LONG} outperforms ${SHORT}? Let's see~", emotion: 'sly' as Emotion },
  { text: "Long ${LONG}, short ${SHORT}... I like your conviction!", emotion: 'pleased' as Emotion },
],

// 1v1 Challenge dialogue
battleChallengeCreated: [
  { text: "Challenge sent! Now we wait for your rival to respond...", emotion: 'sly' as Emotion },
  { text: "Ooh, a duel! This is getting exciting~", emotion: 'excited' as Emotion },
  { text: "Your ${THEME} vs their pick. May the best narrative win!", emotion: 'talkative' as Emotion },
],

battleChallengeReceived: [
  { text: "You've been challenged! ${CHALLENGER} thinks their basket beats yours!", emotion: 'excited' as Emotion },
  { text: "Incoming challenge! Ready to defend your honor?", emotion: 'inquisitive' as Emotion },
],

battleAccepted: [
  { text: "IT'S ON! Both positions are now live. Let the battle begin!", emotion: 'excited' as Emotion },
  { text: "The duel has begun. ${YOUR_BASKET} vs ${THEIR_BASKET}. Fight!", emotion: 'happy' as Emotion },
],

// Team battle dialogue
teamBattleJoined: [
  { text: "You've joined Team ${TEAM}! Together you'll fight for ${NARRATIVE}!", emotion: 'excited' as Emotion },
  { text: "Welcome to the squad~ Let's crush the other team!", emotion: 'happy' as Emotion },
],

// Battle progress
battleLeading: [
  { text: "You're in the lead! ${PNL} ahead of your opponent!", emotion: 'happy' as Emotion },
  { text: "Crushing it! Your basket is outperforming!", emotion: 'excited' as Emotion },
],

battleLosing: [
  { text: "We're behind... but the battle isn't over yet!", emotion: 'concerned' as Emotion },
  { text: "Their basket is winning... time to rally!", emotion: 'inquisitive' as Emotion },
],

// Battle outcomes
battleWon: [
  { text: "VICTORY! You've DOMINATED your opponent!", emotion: 'excited' as Emotion },
  { text: "Champion! Your narrative proved correct!", emotion: 'happy' as Emotion },
  { text: "${PNL} profit! That's how it's done~", emotion: 'pleased' as Emotion },
],

battleLost: [
  { text: "Defeat... but every loss is a lesson.", emotion: 'concerned' as Emotion },
  { text: "They won this time. But there's always the next battle...", emotion: 'kawaii' as Emotion },
],

// Theme-specific reactions
themeSelected: {
  'ai-revolution': [
    { text: "AI tokens? You're betting on the future~ Bold!", emotion: 'excited' as Emotion },
  ],
  'meme-lords': [
    { text: "Memes!? You absolute degen. I love it~", emotion: 'sly' as Emotion },
  ],
  'hyperliquid-maxi': [
    { text: "All in on HYPE!? Now THAT'S conviction!", emotion: 'excited' as Emotion },
  ],
},

// Conditional battle triggers
triggerBattleSet: [
  { text: "Trap set! Your battle activates when ${CONDITION}.", emotion: 'sly' as Emotion },
  { text: "Conditional battle ready. Waiting for the market to trigger it~", emotion: 'inquisitive' as Emotion },
],

triggerBattleActivated: [
  { text: "YOUR TRAP HAS BEEN SPRUNG! Battle is now LIVE!", emotion: 'excited' as Emotion },
  { text: "Condition met! The battle has begun!", emotion: 'happy' as Emotion },
],

// Battle royale
royaleStarted: [
  { text: "${COUNT} warriors enter... only ONE narrative survives!", emotion: 'excited' as Emotion },
  { text: "Battle Royale begins! May the best basket win!", emotion: 'happy' as Emotion },
],

royaleRanking: [
  { text: "Current standing: You're #{RANK} of ${TOTAL}!", emotion: 'inquisitive' as Emotion },
],
```

### Dynamic Dialogue Function

```typescript
// app/signal.ts additions

export function showBattleDialogue(
  category: keyof typeof BATTLE_DIALOGUE,
  variables: Record<string, string>
): void {
  const lines = BATTLE_DIALOGUE[category]
  if (!lines || lines.length === 0) return

  // Pick random line and substitute variables
  const line = randomFrom(lines)
  let text = line.text

  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(`\${${key}}`, value)
  }

  showDialogue({ ...line, text })
}

// Usage examples:
showBattleDialogue('pairTradeOpened', { LONG: 'ETH', SHORT: 'BTC' })
showBattleDialogue('battleWon', { PNL: '+$342' })
showBattleDialogue('royaleRanking', { RANK: '2', TOTAL: '8' })
```

---

## Key Differentiators for Bounty

### 1. "Battles ARE Pair Trades" - The Core Innovation
Not just gamification - the battle metaphor IS the trading mechanism. When you challenge someone, you're creating opposing pair trade positions. This makes complex trading intuitive.

### 2. NPC-Guided Strategy
Nemesis-chan becomes your pair trading coach:
- Suggests pair trades based on market conditions
- Reacts to your theme selections
- Provides real-time battle commentary
- Educational but entertaining

### 3. Preset Narrative Baskets
One-click access to thematic baskets (AI, L2s, Memes, etc.) lowers barrier to basket trading. Users don't need to research weights - they pick a story they believe in.

### 4. Social + Competitive
- 1v1 duels create viral moments ("I just DOMINATED @whale on HYPE vs ARB!")
- Team battles enable coordination
- Battle Royale creates tournaments
- Leaderboard tracks battle records

### 5. Conditional Battles
Unique feature: "Activate my battle when BTC breaks $100K" - scheduled pair trading based on market conditions.

### 6. Real-Time Battle Feed
Watch ongoing battles, see who's winning, create FOMO to join.

---

## Implementation Priority

### Phase 1: Core Battle System
1. Pear authentication integration
2. Solo pair trade (single user)
3. Basic theme selection
4. NPC dialogue for pair trades

### Phase 2: Competitive Features
1. 1v1 Challenge system
2. Battle matching logic
3. Real-time PnL tracking
4. Battle settlement

### Phase 3: Advanced Modes
1. Team battles (2v2, 3v3)
2. Battle Royale tournaments
3. Conditional triggers
4. Battle history & stats

### Phase 4: Polish
1. Battle feed (social)
2. Battle leaderboard
3. Achievements
4. Sound effects & animations

---

## API Endpoints Needed

### Backend Routes (`api/battle/routes.ts`)

```typescript
// Create a battle challenge
POST /v1/battles
{
  mode: 'solo' | 'duel' | 'team' | 'royale',
  duration: '1h' | '4h' | '24h' | '7d',
  stake: number,
  leverage: number,
  longAssets: Asset[],
  shortAssets: Asset[],
  targetAddress?: string,  // For 1v1
  trigger?: TriggerConfig  // For conditional
}

// Accept a battle challenge
POST /v1/battles/:id/accept
{
  longAssets: Asset[],
  shortAssets: Asset[]
}

// Get open battles (matchmaking)
GET /v1/battles?status=pending&mode=duel

// Get user's battles
GET /v1/battles?user=0x...

// Get battle details
GET /v1/battles/:id

// Battle leaderboard
GET /v1/battles/leaderboard
```

---

## Conclusion

This integration transforms Nemesis into a **pair trading battle arena** that:

1. **Executes real trades** via Pear Execution API
2. **Unlocks new trading behavior** through competitive mechanics
3. **Makes pair trading feel like betting** with the battle metaphor
4. **Drives volume** through social competition and viral moments
5. **Perfectly integrates** with existing NPC companion system

The key insight: competitive trading between assets IS pair trading. We're not adding gamification on top of trading - we're revealing that pair trading is inherently a battle between narratives.
