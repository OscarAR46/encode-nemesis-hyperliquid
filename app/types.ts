export type Scene = 'title' | 'selection' | 'main' | 'bridge'
export type NavTab = 'trade' | 'feed' | 'leaderboard' | 'portfolio' | 'bridge' | 'battle'
export type OrderTab = 'yes' | 'no' | 'lobby' | 'duel'
export type PosTab = 'positions' | 'orders' | 'history'
export type AvatarMode = 'full' | 'head' | 'off'
export type Emotion = 'intro' | 'happy' | 'kawaii' | 'pleased' | 'sly' | 'concerned' | 'inquisitive' | 'talkative' | 'excited' | 'loss'
export type DialogueSignal = 'off' | 'connecting' | 'connected' | 'disconnecting'
export type DialoguePlayState = 'playing' | 'paused'
export type MarketCategory = 'all' | 'crypto' | 'forex' | 'commodities' | 'custom'
export type PositionSide = 'yes' | 'no'
export type PositionType = 'standard' | 'lobby' | 'duel'
export type PositionStatus = 'open' | 'closed' | 'pending'
export type OrderStatus = 'pending' | 'filled' | 'cancelled'
export type ConnectionState = 'CONNECTED' | 'DEGRADED' | 'UNSTABLE' | 'DISCONNECTED'

// Widget system types
export type WidgetId = 'market' | 'order' | 'positions' | 'bridge' | 'battle'
export type WidgetColumn = 0 | 1  // Left column = 0, Right column = 1

// ============================================
// Bridge Types (LI.FI Integration)
// ============================================

export type BridgeStatus = 'idle' | 'selecting' | 'quoting' | 'approving' | 'pending' | 'confirming' | 'success' | 'failed'

export interface BridgeStep {
  type: 'swap' | 'cross' | 'lifi' | 'approve'
  tool: string
  toolLogo?: string
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  status: 'pending' | 'active' | 'complete' | 'failed'
}

export interface BridgeQuote {
  fromAmount: string
  toAmount: string
  toAmountMin: string
  estimatedTime: number  // seconds
  gasCosts: string
  feeCosts: string
  steps: BridgeStep[]
  route: any  // LI.FI Route object
}

export interface SourceToken {
  symbol: string
  name: string
  address: string
  decimals: number
  icon: string
  balance?: string
  balanceUsd?: string
}

export interface BridgeState {
  // Selection
  sourceChainId: number | null
  sourceToken: SourceToken | null
  amount: string
  destinationToken: string  // On HyperEVM (HYPE or USDC)

  // Quote
  quote: BridgeQuote | null
  isLoadingQuote: boolean
  quoteError: string | null

  // Execution
  status: BridgeStatus
  currentStepIndex: number
  steps: BridgeStep[]
  txHash: string | null
  error: string | null

  // Result
  finalAmount: string | null
  explorerLink: string | null
}

export interface DialogueLine {
  text: string
  emotion: Emotion
  showName?: boolean
}

export interface Market {
  id: string
  asset: string
  question: string
  yesPrice: number
  noPrice: number
  volume: number
  expiry: number
  category: string
}

export interface Position {
  id: string
  marketId: string
  market: string
  side: PositionSide
  size: number
  entry: number
  current: number
  pnl: number
  type: PositionType
  status: PositionStatus
}

export interface Order {
  id: string
  marketId: string
  market: string
  side: PositionSide
  size: number
  price: number
  status: OrderStatus
}

export interface FeedItem {
  user: string
  text: string
  time: string
}

export interface LeaderboardEntry {
  rank: number
  address: string
  name: string
  pnl: number
}

export interface PanelStates {
  market: boolean
  order: boolean
  positions: boolean
  bridge: boolean
  battle: boolean
}

export interface OrderBookLevel {
  price: number
  size: number
}

export interface OrderBookData {
  coin: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  lastUpdate: number
}

export interface TabTutorialState {
  trade: boolean
  feed: boolean
  leaderboard: boolean
  portfolio: boolean
  bridge: boolean
  battle: boolean
}

// Widget layout system
export interface WidgetPosition {
  id: WidgetId
  column: WidgetColumn    // Which column the widget is in
  order: number           // Sort order within the column
  visible: boolean        // Show/hide toggle
}

export interface LayoutConfig {
  version: number
  widgets: WidgetPosition[]
}

export interface AppState {
  scene: Scene
  introIndex: number
  introComplete: boolean
  introStarted: boolean

  // Wallet state
  connected: boolean
  address: string
  chainId: 999 | 998 | null
  isConnecting: boolean
  walletError: string | null
  connectorName: string | null
  showWalletModal: boolean
  selectedConnectorId: string | null

  balance: number
  nav: NavTab
  orderTab: OrderTab
  posTab: PosTab
  selectedMarket: string
  showMarketModal: boolean
  showDiagnosticPanel: boolean
  avatarMode: AvatarMode
  currentEmotion: Emotion
  currentDialogue: string
  dialogueQueue: DialogueLine[]
  isTyping: boolean
  typewriterIndex: number
  lastDialogueByCategory: Record<string, number>
  markets: Market[]
  positions: Position[]
  orders: Order[]
  history: Position[]
  feed: FeedItem[]
  leaderboard: LeaderboardEntry[]
  stake: number
  targetAddress: string
  processing: boolean
  panelStates: PanelStates
  marketFilter: MarketCategory
  particlesHtml: string
  dialogueSignal: DialogueSignal
  dialogueAtEnd: boolean
  dialoguePlayState: DialoguePlayState
  autoplayEnabled: boolean
  autoplayKey: number
  connectionState: ConnectionState
  lastConnectionDialogue: number
  isReturningPlayer: boolean
  tutorialComplete: boolean
  currentTutorialStep: number
  tabTutorialShown: TabTutorialState
  prices: Record<string, number>
  lastPriceUpdate: number

  // Order book
  orderBook: OrderBookData | null
  showOrderBook: boolean
  orderBookCoin: string

  // Layout customization
  editMode: boolean
  layoutConfig: LayoutConfig

  // Wallet session lost modal
  showWalletSessionModal: boolean

  // Bridge state (LI.FI integration)
  bridge: BridgeState
  showBridgePanel: boolean

  // Battle state (Pear Protocol integration)
  battle: BattleState
}

// ============================================
// Battle Types (Pear Protocol Integration)
// ============================================

export type BattleMode = 'solo' | 'duel' | 'team' | 'royale'
export type BattleStatus = 'idle' | 'creating' | 'pending' | 'matching' | 'active' | 'settled' | 'cancelled' | 'failed'
export type BattleDuration = '1h' | '4h' | '24h' | '7d'
export type PearExecutionType = 'MARKET' | 'TRIGGER' | 'TWAP' | 'LADDER'

export interface BattleAsset {
  symbol: string
  weight: number
  currentPrice?: number
  entryPrice?: number
  priceChange?: number
}

export interface BattleTheme {
  id: string
  name: string
  description: string
  icon: string
  assets: BattleAsset[]
}

export interface BattlePosition {
  longAssets: BattleAsset[]
  shortAssets: BattleAsset[]
  entryValue: number
  currentValue: number
  pnl: number
  pnlPercent: number
}

export interface BattleParticipant {
  address: string
  position: BattlePosition
  theme?: string
  themeName?: string
  rank?: number
  isUser?: boolean
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
  challenger: BattleParticipant
  opponent?: BattleParticipant

  // For team/royale modes
  participants?: BattleParticipant[]

  // Pear order tracking
  pearOrderId?: string

  // Results
  winner?: string
  settlementTxHash?: string
}

export interface BattleTrigger {
  type: 'PRICE' | 'CROSS_ASSET_PRICE' | 'BTC_DOM'
  value: string
  direction: 'MORE_THAN' | 'LESS_THAN'
  assetName?: string
}

export interface BattleState {
  // Auth
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: number | null
  agentWallet: string | null

  // Current battle config
  selectedMode: BattleMode
  selectedDuration: BattleDuration
  selectedTheme: string | null
  customLongAssets: BattleAsset[]
  customShortAssets: BattleAsset[]
  stake: number
  leverage: number
  targetAddress: string

  // Conditional triggers
  useTrigger: boolean
  trigger: BattleTrigger | null

  // Battle state
  isCreating: boolean
  createError: string | null
  activeBattles: Battle[]
  pendingChallenges: Battle[]
  battleHistory: Battle[]
  currentBattle: Battle | null

  // UI state
  showThemeSelector: boolean
  showCustomBuilder: boolean
  showActiveBattles: boolean
}
