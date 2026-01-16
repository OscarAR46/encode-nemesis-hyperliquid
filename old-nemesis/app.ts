// ========================================
// NEMESIS Trading Terminal
// "Every trade needs a Nemesis."
// ========================================

// ----------------------------------------
// Types
// ----------------------------------------

interface Market {
  id: string
  asset: string
  question: string
  targetPrice: number
  currentPrice: number
  expiresAt: number
  yesPrice: number
  noPrice: number
  volume24h: number
  type: 'binary' | 'range'
}

interface Position {
  id: string
  marketId: string
  market: string
  side: 'yes' | 'no'
  size: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  tradeType: 'standard' | 'challenge' | 'friend'
}

interface OrderBookLevel {
  price: number
  size: number
  total: number
}

interface Challenge {
  id: string
  from: string
  market: string
  side: 'yes' | 'no'
  stake: number
  status: 'pending' | 'accepted' | 'expired'
}

interface FriendTrade {
  id: string
  creator: string
  invitees: string[]
  market: string
  side: 'yes' | 'no'
  stake: number
  status: 'pending' | 'ready' | 'executed'
}

// ----------------------------------------
// Nemesis Personality
// ----------------------------------------

const NEMESIS = {
  // Idle messages that rotate in the terminal
  idle: [
    "Nemesis is watching the markets...",
    "Nemesis believes in you.",
    "Ready when you are~",
    "The markets whisper to Nemesis...",
    "Nemesis sees opportunity.",
    "Your Nemesis awaits your command.",
  ],

  // Messages when processing
  processing: [
    "Nemesis is processing your order...",
    "Nemesis is working on it~",
    "One moment... Nemesis is thinking.",
    "Nemesis is calculating probabilities...",
  ],

  // Messages on successful fill
  filled: [
    "Mmm~ Order filled successfully!",
    "UwU~ You've been filled!",
    "Ahh~ Position opened!",
    "Nemesis filled you good~",
    "Yes yes yes~ Order complete!",
    "Kyaa~ It's in!",
  ],

  // Messages on win
  win: [
    "Nemesis knew you could do it!",
    "Winner winner~ Nemesis is proud!",
    "You're amazing! UwU",
    "Nemesis wants to celebrate with you~",
  ],

  // Messages on loss
  loss: [
    "Nemesis will be here for you...",
    "The market is cruel... but Nemesis believes in you.",
    "This isn't the end. Nemesis knows you'll come back stronger.",
  ],

  // Challenge messages
  challenge: [
    "Nemesis loves the rivalry~",
    "Find your Nemesis. Destroy them.",
    "Every trade needs a Nemesis.",
  ],

  // Friend trade messages
  friend: [
    "Together we rise, together we fall~",
    "Nemesis approves of your bonds.",
    "Friends who trade together, stay together!",
  ],
}

function getRandomMessage(category: keyof typeof NEMESIS): string {
  const messages = NEMESIS[category]
  return messages[Math.floor(Math.random() * messages.length)]
}

// ----------------------------------------
// SVG Icons
// ----------------------------------------

const ICONS = {
  // Crossed swords for 1v1
  swords: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.92 5H5L14 14l-1.5 1.5 2 2L16 16l1.5 1.5 1-1-9-9zM18 5h-2l-3.5 3.5 1.5 1.5L18 6V5zM5 19l1.5-1.5 2 2L7 21H5v-2zM3.5 3.5l17 17 1-1-17-17-1 1z"/>
  </svg>`,

  // MSN-style huddle of people for Friend trades
  huddle: `<svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="3"/>
    <path d="M12 10c-3 0-6 1.5-6 4v2h12v-2c0-2.5-3-4-6-4z"/>
    <circle cx="5" cy="9" r="2"/>
    <path d="M5 12c-2 0-4 1-4 2.5V16h4v-1.5c0-.8.3-1.5.8-2.1-.3-.2-.5-.4-.8-.4z"/>
    <circle cx="19" cy="9" r="2"/>
    <path d="M19 12c-.3 0-.5.2-.8.4.5.6.8 1.3.8 2.1V16h4v-1.5c0-1.5-2-2.5-4-2.5z"/>
  </svg>`,

  // Timer/clock
  timer: `<svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7v6l4 2"/>
    <path d="M12 3v2M4.93 5.93l1.41 1.41M19.07 5.93l-1.41 1.41"/>
  </svg>`,

  // Refresh
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12a9 9 0 11-3-6.7"/>
    <path d="M21 4v4h-4"/>
  </svg>`,

  // Chart
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 3v18h18"/>
    <path d="M7 14l4-4 4 4 5-5"/>
  </svg>`,

  // Nemesis logo - stylized N with eye
  logo: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4v16h3V9.5l10 10.5h3V4h-3v10.5L7 4H4z"/>
    <circle cx="17" cy="7" r="2" fill="currentColor" opacity="0.6"/>
  </svg>`,

  // Star
  star: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>`,

  // Checkmark for YES
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
    <path d="M4 12l6 6L20 6"/>
  </svg>`,

  // X for NO
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
    <path d="M6 6l12 12M18 6L6 18"/>
  </svg>`,

  // Heart
  heart: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>`,

  // Nemesis avatar frame
  avatar: `<svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" opacity="0.3"/>
    <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="1" opacity="0.5"/>
    <circle cx="24" cy="20" r="8" fill="currentColor" opacity="0.8"/>
    <ellipse cx="24" cy="36" rx="12" ry="8" fill="currentColor" opacity="0.6"/>
    <circle cx="21" cy="18" r="1.5" fill="white"/>
    <circle cx="27" cy="18" r="1.5" fill="white"/>
    <path d="M20 23 Q24 26 28 23" stroke="white" stroke-width="1.5" fill="none"/>
  </svg>`,
}

// ----------------------------------------
// State
// ----------------------------------------

type OrderTab = 'yes' | 'no' | 'challenge' | 'friend'

const state = {
  connected: false,
  address: '',
  balance: 0,
  selectedMarket: null as Market | null,
  selectedTab: 'yes' as OrderTab,
  markets: [] as Market[],
  positions: [] as Position[],
  challenges: [] as Challenge[],
  friendTrades: [] as FriendTrade[],
  friendInvitees: [''] as string[],
  orderBook: {
    asks: [] as OrderBookLevel[],
    bids: [] as OrderBookLevel[]
  },
  stakeAmount: 100,
  nemesisMessage: NEMESIS.idle[0],
  isProcessing: false,
}

// ----------------------------------------
// Audio System
// ----------------------------------------

const AudioSystem = {
  context: null as AudioContext | null,

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.context
  },

  // Generate a cute "uwu" style sound
  playFillSound() {
    const ctx = this.init()
    if (!ctx) return

    const now = ctx.currentTime

    // Create oscillators for a cute ascending sound
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc2.type = 'triangle'

    // Cute ascending frequencies
    osc1.frequency.setValueAtTime(523, now) // C5
    osc1.frequency.setValueAtTime(659, now + 0.1) // E5
    osc1.frequency.setValueAtTime(784, now + 0.2) // G5
    osc1.frequency.setValueAtTime(1047, now + 0.3) // C6

    osc2.frequency.setValueAtTime(523, now)
    osc2.frequency.setValueAtTime(659, now + 0.1)
    osc2.frequency.setValueAtTime(784, now + 0.2)
    osc2.frequency.setValueAtTime(1047, now + 0.3)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.5)
    osc2.stop(now + 0.5)
  },

  // Victory sound
  playWinSound() {
    const ctx = this.init()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [523, 659, 784, 1047, 1319] // C E G C E

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)

      gain.gain.setValueAtTime(0.2, now + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.3)
    })
  }
}

// ----------------------------------------
// Mock Data
// ----------------------------------------

function generateMarkets(): Market[] {
  const now = Date.now()
  return [
    {
      id: 'eth-3500-24h',
      asset: 'ETH',
      question: 'ETH > $3,500',
      targetPrice: 3500,
      currentPrice: 3420.50,
      expiresAt: now + 24 * 60 * 60 * 1000,
      yesPrice: 0.42,
      noPrice: 0.58,
      volume24h: 284500,
      type: 'binary'
    },
    {
      id: 'btc-100k-7d',
      asset: 'BTC',
      question: 'BTC > $100,000',
      targetPrice: 100000,
      currentPrice: 97250.00,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      yesPrice: 0.65,
      noPrice: 0.35,
      volume24h: 1250000,
      type: 'binary'
    },
    {
      id: 'sol-200-48h',
      asset: 'SOL',
      question: 'SOL > $200',
      targetPrice: 200,
      currentPrice: 187.30,
      expiresAt: now + 48 * 60 * 60 * 1000,
      yesPrice: 0.38,
      noPrice: 0.62,
      volume24h: 156000,
      type: 'binary'
    },
    {
      id: 'hype-30-24h',
      asset: 'HYPE',
      question: 'HYPE > $30',
      targetPrice: 30,
      currentPrice: 26.85,
      expiresAt: now + 24 * 60 * 60 * 1000,
      yesPrice: 0.28,
      noPrice: 0.72,
      volume24h: 89000,
      type: 'binary'
    },
    {
      id: 'eth-btc-ratio',
      asset: 'ETH/BTC',
      question: 'ETH/BTC > 0.04',
      targetPrice: 0.04,
      currentPrice: 0.0352,
      expiresAt: now + 72 * 60 * 60 * 1000,
      yesPrice: 0.31,
      noPrice: 0.69,
      volume24h: 67000,
      type: 'binary'
    },
  ]
}

function generateOrderBook(): { asks: OrderBookLevel[], bids: OrderBookLevel[] } {
  const asks: OrderBookLevel[] = []
  const bids: OrderBookLevel[] = []

  let askTotal = 0
  let bidTotal = 0

  for (let i = 0; i < 12; i++) {
    const askSize = Math.random() * 5000 + 500
    askTotal += askSize
    asks.push({
      price: 0.43 + i * 0.01,
      size: askSize,
      total: askTotal
    })

    const bidSize = Math.random() * 5000 + 500
    bidTotal += bidSize
    bids.push({
      price: 0.42 - i * 0.01,
      size: bidSize,
      total: bidTotal
    })
  }

  return { asks, bids: bids.reverse() }
}

function generatePositions(): Position[] {
  return [
    {
      id: 'pos-1',
      marketId: 'eth-3500-24h',
      market: 'ETH > $3,500',
      side: 'yes',
      size: 250,
      entryPrice: 0.38,
      currentPrice: 0.42,
      pnl: 26.32,
      pnlPercent: 10.53,
      tradeType: 'standard'
    },
    {
      id: 'pos-2',
      marketId: 'btc-100k-7d',
      market: 'BTC > $100,000',
      side: 'no',
      size: 500,
      entryPrice: 0.40,
      currentPrice: 0.35,
      pnl: 71.43,
      pnlPercent: 14.29,
      tradeType: 'friend'
    }
  ]
}

// ----------------------------------------
// Utilities
// ----------------------------------------

function formatTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatUSD(n: number): string {
  return '$' + formatNumber(n)
}

function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return sign + formatNumber(n) + '%'
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function el(tag: string, className?: string, content?: string): HTMLElement {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (content) element.textContent = content
  return element
}

// ----------------------------------------
// Notification System
// ----------------------------------------

function showNotification(message: string, type: 'success' | 'info' | 'error' = 'info') {
  const existing = document.querySelector('.nemesis-notification')
  if (existing) existing.remove()

  const notification = el('div', `nemesis-notification ${type}`)
  notification.innerHTML = `
    <div class="nemesis-notification-avatar">
      ${ICONS.avatar}
    </div>
    <div class="nemesis-notification-content">
      <div class="nemesis-notification-title">Nemesis</div>
      <div class="nemesis-notification-message">${message}</div>
    </div>
  `

  document.body.appendChild(notification)

  // Animate in
  requestAnimationFrame(() => {
    notification.classList.add('show')
  })

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// ----------------------------------------
// Components
// ----------------------------------------

function renderHeader(): HTMLElement {
  const header = el('header', 'header')

  header.innerHTML = `
    <div class="logo">
      <div class="logo-icon">
        ${ICONS.logo}
      </div>
      <span class="logo-text">NEMESIS</span>
      <span class="logo-tagline">Every trade needs a Nemesis.</span>
    </div>

    <nav class="nav">
      <div class="nav-item active">Trade</div>
      <div class="nav-item">Rivals</div>
      <div class="nav-item">Leaderboard</div>
      <div class="nav-item">Portfolio</div>
    </nav>

    <div class="header-spacer"></div>

    <div class="nemesis-status">
      <div class="nemesis-avatar">
        ${ICONS.avatar}
      </div>
      <div class="nemesis-message" id="nemesis-message">
        ${state.nemesisMessage}
      </div>
    </div>

    <div class="header-stats">
      <div class="header-stat">
        <span class="header-stat-label">24h Volume</span>
        <span class="header-stat-value">$2.84M</span>
      </div>
      <div class="header-stat">
        <span class="header-stat-label">Your P&L</span>
        <span class="header-stat-value positive">+$347.82</span>
      </div>
    </div>

    <button class="connect-btn" id="connect-btn">
      Connect Wallet
    </button>
  `

  const connectBtn = header.querySelector('#connect-btn') as HTMLButtonElement
  connectBtn.addEventListener('click', handleConnect)

  return header
}

function renderMarketsPanel(): HTMLElement {
  const panel = el('div', 'panel markets-panel')

  let marketsHTML = ''
  state.markets.forEach((market, index) => {
    const timeLeft = market.expiresAt - Date.now()
    const selected = index === 0 ? 'selected' : ''

    marketsHTML += `
      <div class="market-item ${selected}" data-market-id="${market.id}">
        <div class="market-info">
          <div class="market-name">
            ${market.asset}
            <span class="market-type">BINARY</span>
          </div>
          <div class="market-expiry">${formatTime(timeLeft)}</div>
        </div>
        <div class="market-odds">
          <div class="market-yes">${(market.yesPrice * 100).toFixed(0)}c</div>
          <div class="market-no">${(market.noPrice * 100).toFixed(0)}c</div>
        </div>
        <div class="market-volume">${formatUSD(market.volume24h)}</div>
      </div>
    `
  })

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Markets</span>
      <div class="panel-actions">
        <div class="panel-action">${ICONS.refresh}</div>
      </div>
    </div>

    <div class="market-search">
      <input type="text" placeholder="Search markets..." />
    </div>

    <div class="market-tabs">
      <div class="market-tab active">All</div>
      <div class="market-tab">Crypto</div>
      <div class="market-tab">Pairs</div>
      <div class="market-tab">${ICONS.star}</div>
    </div>

    <div class="panel-content">
      <div class="market-list">
        ${marketsHTML}
      </div>
    </div>
  `

  // Event handlers for market selection
  panel.querySelectorAll('.market-item').forEach(item => {
    item.addEventListener('click', () => {
      panel.querySelectorAll('.market-item').forEach(i => i.classList.remove('selected'))
      item.classList.add('selected')
      const marketId = item.getAttribute('data-market-id')
      state.selectedMarket = state.markets.find(m => m.id === marketId) || null
      updateOrderPanel()
      updateChartPanel()
    })
  })

  return panel
}

function renderChartPanel(): HTMLElement {
  const panel = el('div', 'panel chart-panel')
  const market = state.selectedMarket || state.markets[0]

  panel.innerHTML = `
    <div class="chart-toolbar">
      <div class="chart-pair">
        <span class="chart-pair-name">${market.question}</span>
        <span class="chart-pair-price up">${formatUSD(market.currentPrice)}</span>
        <span class="chart-pair-change up">+2.34%</span>
      </div>

      <div class="chart-timeframes">
        <div class="chart-tf">1m</div>
        <div class="chart-tf">5m</div>
        <div class="chart-tf active">15m</div>
        <div class="chart-tf">1H</div>
        <div class="chart-tf">4H</div>
        <div class="chart-tf">1D</div>
      </div>
    </div>

    <div class="chart-area" id="chart-area">
      <div class="chart-placeholder">
        <div class="chart-placeholder-icon">${ICONS.chart}</div>
        <span>Chart Integration</span>
        <span class="muted" style="font-size: 10px; letter-spacing: 0.05em;">TradingView // Lightweight Charts</span>
      </div>
    </div>
  `

  return panel
}

function renderOrderBook(): HTMLElement {
  const panel = el('div', 'panel book-panel')

  let asksHTML = ''
  const maxTotal = Math.max(...state.orderBook.asks.map(l => l.total), ...state.orderBook.bids.map(l => l.total))

  state.orderBook.asks.slice().reverse().forEach(level => {
    const width = (level.total / maxTotal) * 100
    asksHTML += `
      <div class="book-row ask">
        <div class="book-row-bg" style="width: ${width}%"></div>
        <span>${level.price.toFixed(2)}</span>
        <span>${formatNumber(level.size, 0)}</span>
        <span>${formatNumber(level.total, 0)}</span>
      </div>
    `
  })

  let bidsHTML = ''
  state.orderBook.bids.forEach(level => {
    const width = (level.total / maxTotal) * 100
    bidsHTML += `
      <div class="book-row bid">
        <div class="book-row-bg" style="width: ${width}%"></div>
        <span>${level.price.toFixed(2)}</span>
        <span>${formatNumber(level.size, 0)}</span>
        <span>${formatNumber(level.total, 0)}</span>
      </div>
    `
  })

  const spread = state.orderBook.asks[0].price - state.orderBook.bids[state.orderBook.bids.length - 1].price
  const spreadPercent = (spread / state.orderBook.asks[0].price) * 100

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Order Book</span>
    </div>

    <div class="book-content">
      <div class="book-header">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div class="book-side">
        ${asksHTML}
      </div>

      <div class="book-spread">
        <span class="book-spread-label">Spread: </span>
        <span class="book-spread-value">${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)</span>
      </div>

      <div class="book-side">
        ${bidsHTML}
      </div>
    </div>
  `

  return panel
}

function renderOrderPanel(): HTMLElement {
  const panel = el('div', 'panel order-panel')
  const market = state.selectedMarket || state.markets[0]
  const timeLeft = market.expiresAt - Date.now()

  const price = state.selectedTab === 'yes' || state.selectedTab === 'friend' ? market.yesPrice : market.noPrice
  const payout = state.stakeAmount / price
  const profit = payout - state.stakeAmount

  // Determine which sections to show
  const showChallengeSection = state.selectedTab === 'challenge'
  const showFriendSection = state.selectedTab === 'friend'

  // Build friend invitee inputs
  let friendInputsHTML = ''
  state.friendInvitees.forEach((invitee, index) => {
    friendInputsHTML += `
      <input type="text"
             class="friend-input"
             data-index="${index}"
             placeholder="Enter wallet address or ENS..."
             value="${invitee}" />
    `
  })

  // Get contextual Nemesis message
  let contextMessage = ''
  if (state.selectedTab === 'challenge') {
    contextMessage = getRandomMessage('challenge')
  } else if (state.selectedTab === 'friend') {
    contextMessage = getRandomMessage('friend')
  }

  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Place Order</span>
    </div>

    <div class="order-tabs">
      <div class="order-tab yes ${state.selectedTab === 'yes' ? 'active' : ''}" data-tab="yes">
        ${ICONS.check}
        YES
      </div>
      <div class="order-tab no ${state.selectedTab === 'no' ? 'active' : ''}" data-tab="no">
        ${ICONS.cross}
        NO
      </div>
      <div class="order-tab challenge ${state.selectedTab === 'challenge' ? 'active' : ''}" data-tab="challenge">
        ${ICONS.swords}
        1v1
      </div>
      <div class="order-tab friend ${state.selectedTab === 'friend' ? 'active' : ''}" data-tab="friend">
        ${ICONS.huddle}
        FRIEND
      </div>
    </div>

    <div class="order-form">
      <div class="order-market-info">
        <div class="order-market-question">${market.question}</div>
        <div class="order-market-details">
          <span class="order-market-price">Current: <strong>${formatUSD(market.currentPrice)}</strong></span>
          <span class="order-market-timer">
            <span class="timer-icon">${ICONS.timer}</span>
            ${formatTime(timeLeft)}
          </span>
        </div>
      </div>

      ${contextMessage ? `
      <div class="nemesis-inline-message">
        <span class="nemesis-inline-avatar">${ICONS.avatar}</span>
        <span class="nemesis-inline-text">"${contextMessage}"</span>
      </div>
      ` : ''}

      <div class="form-group">
        <label class="form-label">Stake Amount</label>
        <div class="form-input-wrap">
          <input type="number" class="form-input" value="${state.stakeAmount}" id="stake-input" />
          <span class="form-input-suffix">USDC</span>
        </div>
        <div class="form-presets">
          <button class="form-preset" data-amount="25">$25</button>
          <button class="form-preset" data-amount="50">$50</button>
          <button class="form-preset" data-amount="100">$100</button>
          <button class="form-preset" data-amount="250">$250</button>
          <button class="form-preset" data-amount="500">$500</button>
        </div>
      </div>

      <div class="form-group" id="challenge-section" style="display: ${showChallengeSection ? 'block' : 'none'}">
        <div class="challenge-section">
          <div class="challenge-title">
            ${ICONS.swords}
            Find Your Nemesis
          </div>
          <input type="text" class="challenge-input" placeholder="Enter rival's wallet or ENS..." />
        </div>
      </div>

      <div class="form-group" id="friend-section" style="display: ${showFriendSection ? 'block' : 'none'}">
        <div class="friend-section">
          <div class="friend-title">
            ${ICONS.huddle}
            Trade Together
          </div>
          <div class="friend-description">
            Invite allies to take the same position. Rise together, fall together~
          </div>
          ${friendInputsHTML}
          <button class="friend-add-btn" id="add-friend-btn">+ Add Another Ally</button>
        </div>
      </div>

      <div class="order-summary">
        <div class="order-summary-row">
          <span class="order-summary-label">Price (${state.selectedTab === 'no' ? 'NO' : 'YES'})</span>
          <span class="order-summary-value">${(price * 100).toFixed(0)}c</span>
        </div>
        <div class="order-summary-row">
          <span class="order-summary-label">Shares</span>
          <span class="order-summary-value">${formatNumber(payout, 2)}</span>
        </div>
        <div class="order-summary-row">
          <span class="order-summary-label">Potential Profit</span>
          <span class="order-summary-value highlight">+${formatUSD(profit)}</span>
        </div>
        <div class="order-summary-row">
          <span class="order-summary-label">Max Payout</span>
          <span class="order-summary-value">${formatUSD(payout)}</span>
        </div>
        ${showFriendSection ? `
        <div class="order-summary-row">
          <span class="order-summary-label">Total Allies</span>
          <span class="order-summary-value">${state.friendInvitees.filter(i => i.length > 0).length + 1}</span>
        </div>
        ` : ''}
      </div>

      <button class="order-btn ${state.selectedTab} ${state.isProcessing ? 'processing' : ''}" id="order-btn" ${state.isProcessing ? 'disabled' : ''}>
        ${state.isProcessing ? 'Nemesis is processing...' : getOrderButtonText()}
      </button>
    </div>
  `

  // Tab switching
  panel.querySelectorAll('.order-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const newTab = tab.getAttribute('data-tab') as OrderTab
      state.selectedTab = newTab
      updateOrderPanel()
    })
  })

  // Stake input
  const stakeInput = panel.querySelector('#stake-input') as HTMLInputElement
  stakeInput.addEventListener('input', () => {
    state.stakeAmount = parseFloat(stakeInput.value) || 0
    updateOrderPanel()
  })

  // Presets
  panel.querySelectorAll('.form-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.stakeAmount = parseFloat(btn.getAttribute('data-amount') || '100')
      updateOrderPanel()
    })
  })

  // Friend inputs
  panel.querySelectorAll('.friend-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const index = parseInt(target.getAttribute('data-index') || '0')
      state.friendInvitees[index] = target.value
    })
  })

  // Add friend button
  const addFriendBtn = panel.querySelector('#add-friend-btn')
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', () => {
      state.friendInvitees.push('')
      updateOrderPanel()
    })
  }

  // Order button
  const orderBtn = panel.querySelector('#order-btn') as HTMLButtonElement
  orderBtn.addEventListener('click', handlePlaceOrder)

  return panel
}

function getOrderButtonText(): string {
  switch (state.selectedTab) {
    case 'yes':
      return 'Buy YES'
    case 'no':
      return 'Buy NO'
    case 'challenge':
      return 'Challenge Nemesis'
    case 'friend':
      return 'Unite with Allies'
  }
}

function renderPositionsPanel(): HTMLElement {
  const panel = el('div', 'panel positions-panel')

  let positionsHTML = ''
  if (state.positions.length === 0) {
    positionsHTML = '<div class="positions-empty">Nemesis awaits your first trade...</div>'
  } else {
    positionsHTML = `
      <table class="positions-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Type</th>
            <th>Side</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Current</th>
            <th>P&L</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.positions.map(pos => `
            <tr>
              <td>${pos.market}</td>
              <td>${pos.tradeType.toUpperCase()}</td>
              <td><span class="position-side ${pos.side}">${pos.side.toUpperCase()}</span></td>
              <td class="mono">${formatUSD(pos.size)}</td>
              <td class="mono">${pos.entryPrice.toFixed(2)}</td>
              <td class="mono">${pos.currentPrice.toFixed(2)}</td>
              <td class="position-pnl ${pos.pnl >= 0 ? 'positive' : 'negative'}">
                ${formatUSD(pos.pnl)} (${formatPercent(pos.pnlPercent)})
              </td>
              <td><button class="position-action">Close</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  panel.innerHTML = `
    <div class="panel-header">
      <div class="positions-tabs">
        <div class="positions-tab active">Positions <span class="count">${state.positions.length}</span></div>
        <div class="positions-tab">Orders <span class="count">0</span></div>
        <div class="positions-tab">History</div>
        <div class="positions-tab">Rivals <span class="count">${state.challenges.length}</span></div>
        <div class="positions-tab">Allies <span class="count">${state.friendTrades.length}</span></div>
      </div>
    </div>

    <div class="panel-content">
      ${positionsHTML}
    </div>
  `

  return panel
}

// ----------------------------------------
// Handlers
// ----------------------------------------

function handleConnect() {
  // Mock connection
  state.connected = true
  state.address = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12'
  state.balance = 1250.00

  const btn = document.querySelector('#connect-btn') as HTMLButtonElement
  btn.className = 'connect-btn connected'
  btn.textContent = truncateAddress(state.address)

  showNotification("Nemesis recognizes you. Welcome back~", 'success')
}

async function handlePlaceOrder() {
  if (!state.connected) {
    showNotification("Connect your wallet first. Nemesis needs to know you~", 'info')
    return
  }

  if (state.isProcessing) return

  const market = state.selectedMarket || state.markets[0]
  const side = state.selectedTab === 'no' ? 'no' : 'yes'

  // Show processing state
  state.isProcessing = true
  state.nemesisMessage = getRandomMessage('processing')
  updateNemesisMessage()
  updateOrderPanel()

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Add to positions (mock)
  const newPosition: Position = {
    id: `pos-${Date.now()}`,
    marketId: market.id,
    market: market.question,
    side: side,
    size: state.stakeAmount,
    entryPrice: side === 'yes' ? market.yesPrice : market.noPrice,
    currentPrice: side === 'yes' ? market.yesPrice : market.noPrice,
    pnl: 0,
    pnlPercent: 0,
    tradeType: state.selectedTab === 'challenge' ? 'challenge' :
               state.selectedTab === 'friend' ? 'friend' : 'standard'
  }

  state.positions.push(newPosition)
  state.isProcessing = false

  // Play fill sound and show notification
  AudioSystem.playFillSound()
  const fillMessage = getRandomMessage('filled')
  showNotification(fillMessage, 'success')

  state.nemesisMessage = fillMessage
  updateNemesisMessage()
  updateOrderPanel()
  updatePositionsPanel()

  console.log('Order placed:', {
    market: market.question,
    tab: state.selectedTab,
    side: side,
    stake: state.stakeAmount,
    invitees: state.selectedTab === 'friend' ? state.friendInvitees.filter(i => i.length > 0) : []
  })
}

// ----------------------------------------
// Update Functions
// ----------------------------------------

function updateNemesisMessage() {
  const messageEl = document.querySelector('#nemesis-message')
  if (messageEl) {
    messageEl.textContent = state.nemesisMessage
  }
}

function updateOrderPanel() {
  const oldPanel = document.querySelector('.order-panel')
  if (oldPanel) {
    const newPanel = renderOrderPanel()
    oldPanel.replaceWith(newPanel)
  }
}

function updateChartPanel() {
  const oldPanel = document.querySelector('.chart-panel')
  if (oldPanel) {
    const newPanel = renderChartPanel()
    oldPanel.replaceWith(newPanel)
  }
}

function updatePositionsPanel() {
  const oldPanel = document.querySelector('.positions-panel')
  if (oldPanel) {
    const newPanel = renderPositionsPanel()
    oldPanel.replaceWith(newPanel)
  }
}

// ----------------------------------------
// Price Updates (Mock)
// ----------------------------------------

function startPriceUpdates() {
  setInterval(() => {
    state.markets.forEach(market => {
      // Random price wiggle
      const change = (Math.random() - 0.5) * 0.02
      market.currentPrice *= (1 + change)

      // Adjust odds slightly
      const oddsChange = (Math.random() - 0.5) * 0.01
      market.yesPrice = Math.max(0.01, Math.min(0.99, market.yesPrice + oddsChange))
      market.noPrice = 1 - market.yesPrice
    })

    // Update order book
    state.orderBook = generateOrderBook()

    // Update positions P&L
    state.positions.forEach(pos => {
      const market = state.markets.find(m => m.id === pos.marketId)
      if (market) {
        pos.currentPrice = pos.side === 'yes' ? market.yesPrice : market.noPrice
        pos.pnl = (pos.currentPrice - pos.entryPrice) * pos.size / pos.entryPrice
        pos.pnlPercent = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100
      }
    })
  }, 2000)

  // Rotate idle messages
  setInterval(() => {
    if (!state.isProcessing) {
      state.nemesisMessage = getRandomMessage('idle')
      updateNemesisMessage()
    }
  }, 8000)
}

// ----------------------------------------
// Initialize
// ----------------------------------------

function init() {
  const app = document.getElementById('app')
  if (!app) return

  // Initialize state
  state.markets = generateMarkets()
  state.selectedMarket = state.markets[0]
  state.orderBook = generateOrderBook()
  state.positions = generatePositions()

  // Render layout
  app.appendChild(renderHeader())

  const main = el('main', 'main')
  main.appendChild(renderMarketsPanel())
  main.appendChild(renderChartPanel())
  main.appendChild(renderOrderPanel())
  main.appendChild(renderPositionsPanel())

  app.appendChild(main)

  // Start updates
  startPriceUpdates()

  console.log('NEMESIS initialized')
  console.log('Every trade needs a Nemesis.')
}

// Start
init()
