export type Scene = 'title' | 'selection' | 'main'
export type NavTab = 'trade' | 'feed' | 'leaderboard' | 'portfolio'
export type OrderTab = 'yes' | 'no'
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
}
