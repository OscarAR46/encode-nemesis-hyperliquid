import morphdom from 'morphdom'
import { state } from '@app/state'
import { ICONS } from '@app/icons'
import { formatTime, formatUSD, formatCompact, truncAddr, getMarket, getTotalPnl } from '@app/utils'
import { connectionMonitor } from '@app/connection'
import { renderColumnWidgets } from '@app/widgets'
import { renderBridgeWidget } from '@app/widgets/bridge'

export function render() {
  const app = document.getElementById('app')
  if (!app) return

  let html: string
  switch (state.scene) {
    case 'selection':
      html = renderSelectionScreen()
      break
    case 'title':
      html = renderTitleScreen()
      break
    default:
      html = renderMainInterface()
  }

  morphdom(app, `<div id="app">${html}</div>`, {
    childrenOnly: true,
    onBeforeElUpdated: (fromEl: HTMLElement, toEl: HTMLElement) => {
      // Don't update focused inputs
      if (fromEl === document.activeElement && (fromEl.tagName === 'INPUT' || fromEl.tagName === 'TEXTAREA')) {
        return false
      }
      // Don't update panels or columns during edit mode - Sortable.js is managing them
      if (state.editMode && (fromEl.classList?.contains('panel') || fromEl.classList?.contains('widget-column'))) {
        return false
      }
      return true
    }
  })

  updateDialogueMask()
}

function renderSelectionScreen(): string {
  const walletSessionModal = state.showWalletSessionModal ? `
    <div class="wallet-session-overlay">
      <div class="wallet-session-modal">
        <div class="wallet-session-icon">${ICONS.wallet}</div>
        <div class="wallet-session-title">Wallet Not Found</div>
        <div class="wallet-session-message">Your previous session wallet was not detected.</div>
        <div class="wallet-session-prompt">Please connect your wallet to continue.</div>
        <div class="wallet-session-loader">
          <div class="wallet-session-bar"></div>
        </div>
      </div>
    </div>
  ` : ''

  return `
    <div class="scene" id="selection-scene">
      <div class="bg-layer"></div>
      <div class="bg-shimmer"></div>
      <div class="bg-particles">${state.particlesHtml}</div>
      <div class="water-line"></div>
      <div class="selection-screen">
        <div class="title-logo">NEMESIS</div>
        <div class="title-tagline">Every trader needs a Nemesis.</div>
        <div class="selection-message">Ah! I see you have dueled before~</div>
        <div class="selection-question">Would you like to continue?</div>
        <div class="selection-buttons">
          <button class="selection-btn new-game" id="btn-new-game">
            <span class="selection-btn-icon">${ICONS.cross}</span>
            <span class="selection-btn-text">New Game</span>
            <span class="selection-btn-desc">Start fresh as a new trader</span>
          </button>
          <button class="selection-btn continue" id="btn-continue">
            <span class="selection-btn-icon">${ICONS.play}</span>
            <span class="selection-btn-text">Continue</span>
            <span class="selection-btn-desc">Resume where you left off</span>
          </button>
        </div>
      </div>
      ${walletSessionModal}
    </div>
  `
}

function renderTitleScreen(): string {
  // For first-time users: show "Enter Nemesis" button
  // For returning users who got here via selection: show "Click to begin"
  const showEnterButton = !state.isReturningPlayer && !state.introStarted

  return `
    <div class="scene" id="title-scene">
      <div class="bg-layer"></div>
      <div class="bg-shimmer"></div>
      <div class="bg-particles">${state.particlesHtml}</div>
      <div class="water-line"></div>
      <div class="title-screen">
        <div class="title-content">
          <div class="title-logo">NEMESIS</div>
          <div class="title-tagline">Every trader needs a Nemesis.</div>
          ${showEnterButton
            ? `<button class="enter-btn" id="enter-btn">${ICONS.play} Enter Nemesis</button>`
            : `<div class="title-start">— Click to begin —</div>`
          }
        </div>
      </div>
      <div class="dialogue-container">
        <div class="dialogue-box signal-${state.dialogueSignal} ${state.autoplayEnabled && state.dialogueAtEnd && !state.isTyping ? 'autoplay-active' : ''}" id="dialogue-box">
          <div class="dialogue-name" id="dialogue-name">NEMESIS</div>
          <div class="dialogue-text" id="dialogue-text">${state.dialogueSignal === 'connected' ? state.currentDialogue : ''}</div>
          <div class="dialogue-controls">
            <button class="dialogue-ctrl-btn ${state.dialoguePlayState === 'paused' ? 'active' : ''}" id="dialogue-pause-play" title="${state.dialoguePlayState === 'paused' ? 'Play' : 'Pause'}">
              ${state.dialoguePlayState === 'paused' ? ICONS.play : ICONS.pause}
            </button>
            <button class="dialogue-ctrl-btn" id="dialogue-skip" title="Skip">
              ${ICONS.skip}
            </button>
            <button class="dialogue-ctrl-btn ${state.autoplayEnabled ? 'active' : ''}" id="dialogue-autoplay" title="Autoplay ${state.autoplayEnabled ? 'On' : 'Off'}">
              ${ICONS.autoplay}
            </button>
          </div>
          <div class="dialogue-continue">${state.autoplayEnabled ? '' : '▼'}</div>
          <div class="dialogue-autoplay-bar" data-key="${state.autoplayKey}"></div>
        </div>
        <div class="dialogue-orbital">
          <div class="orbital-ring orbital-ring-1"></div>
          <div class="orbital-ring orbital-ring-2"></div>
          <div class="orbital-ring orbital-ring-3"></div>
          <div class="orbital-core"></div>
        </div>
      </div>
    </div>
  `
}

function renderMainInterface(): string {
  const pnl = getTotalPnl()
  const isOffMode = state.avatarMode === 'off'

  return `
    <div class="scene" id="main-scene">
      <div class="bg-layer"></div>
      <div class="bg-shimmer"></div>
      <div class="bg-particles">${state.particlesHtml}</div>
      <div class="water-line"></div>
      <div class="main-interface">
        <header class="header">
          <div class="header-left">
            <div class="logo">
              <div class="logo-mark">${ICONS.logo}</div>
              <span class="logo-text">NEMESIS</span>
              <span class="logo-tagline">Every trader needs a Nemesis.</span>
            </div>
            <nav class="nav">
              <button class="nav-btn nav-btn-bridge ${state.nav === 'bridge' ? 'active' : ''}" data-nav="bridge">Bridge</button>
              <button class="nav-btn ${state.nav === 'trade' ? 'active' : ''}" data-nav="trade">Trade</button>
              <button class="nav-btn ${state.nav === 'feed' ? 'active' : ''}" data-nav="feed">Feed</button>
              <button class="nav-btn ${state.nav === 'leaderboard' ? 'active' : ''}" data-nav="leaderboard">Leaderboard</button>
              <button class="nav-btn ${state.nav === 'portfolio' ? 'active' : ''}" data-nav="portfolio">Portfolio</button>
            </nav>
          </div>
          <div class="header-right">
            ${renderLivePricesTicker()}
            <div class="header-stats">
              <div class="stat"><div class="stat-label">24h Volume</div><div class="stat-value">$2.84M</div></div>
              <div class="stat"><div class="stat-label">Your P&L</div><div class="stat-value ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${formatUSD(pnl)}</div></div>
            </div>
            ${state.nav === 'trade' ? renderEditLayoutButton() : ''}
            ${renderWalletButton()}
          </div>
        </header>
        <div class="main-content">
          <div class="avatar-area mode-${state.avatarMode}">
            <img id="avatar-img" class="avatar-img" src="nemesis-chan/${state.currentEmotion}.png" alt="Nemesis">
          </div>
          <div class="content-area">
            ${state.nav === 'bridge' ? renderBridgePage() : ''}
            ${state.nav === 'trade' ? renderTradeContent() : ''}
            ${state.nav === 'feed' ? renderFeedPage() : ''}
            ${state.nav === 'leaderboard' ? renderLeaderboardPage() : ''}
            ${state.nav === 'portfolio' ? renderPortfolioPage() : ''}
          </div>
        </div>
      </div>
      ${renderConnectionIndicator()}
      ${renderDiagnosticPanel()}
      <div class="dialogue-container avatar-mode-${state.avatarMode}">
        <div class="dialogue-box signal-${state.dialogueSignal} ${state.autoplayEnabled && state.dialogueAtEnd && !state.isTyping ? 'autoplay-active' : ''}" id="dialogue-box">
          <div class="dialogue-name visible" id="dialogue-name">NEMESIS</div>
          <div class="dialogue-text" id="dialogue-text">${state.dialogueSignal === 'connected' ? state.currentDialogue : ''}</div>
          <div class="dialogue-controls">
            <button class="dialogue-ctrl-btn ${state.dialoguePlayState === 'paused' ? 'active' : ''}" id="dialogue-pause-play" title="${state.dialoguePlayState === 'paused' ? 'Play' : 'Pause'}">
              ${state.dialoguePlayState === 'paused' ? ICONS.play : ICONS.pause}
            </button>
            <button class="dialogue-ctrl-btn" id="dialogue-skip" title="Skip">
              ${ICONS.skip}
            </button>
            <button class="dialogue-ctrl-btn ${state.autoplayEnabled ? 'active' : ''}" id="dialogue-autoplay" title="Autoplay ${state.autoplayEnabled ? 'On' : 'Off'}">
              ${ICONS.autoplay}
            </button>
            <span class="dialogue-ctrl-divider"></span>
            <button class="avatar-mode-btn ${state.avatarMode === 'full' ? 'active' : ''}" data-mode="full" title="Avatar Full">
              ${ICONS.avatarFull}
            </button>
            <button class="avatar-mode-btn ${state.avatarMode === 'head' ? 'active' : ''}" data-mode="head" title="Avatar Head">
              ${ICONS.avatarHead}
            </button>
            <button class="avatar-mode-btn off-btn ${state.avatarMode === 'off' ? 'active' : ''}" data-mode="off" title="Hide Chat">
              ${ICONS.cross}
            </button>
          </div>
          <div class="dialogue-continue">${state.autoplayEnabled ? '' : '▼'}</div>
          <div class="dialogue-autoplay-bar" data-key="${state.autoplayKey}"></div>
        </div>
        <div class="dialogue-portrait" id="dialogue-portrait">
          <img id="portrait-img" src="nemesis-chan/${state.currentEmotion}.png" alt="">
        </div>
        <div class="dialogue-orbital">
          <div class="orbital-ring orbital-ring-1"></div>
          <div class="orbital-ring orbital-ring-2"></div>
          <div class="orbital-ring orbital-ring-3"></div>
          <div class="orbital-core"></div>
        </div>
      </div>
      ${state.showMarketModal ? renderMarketModal() : ''}
      ${state.showOrderBook ? renderOrderBookModal() : ''}
    </div>
  `
}

function renderLivePricesTicker(): string {
  const coins = ['BTC', 'ETH', 'SOL', 'HYPE']
  const items = coins.map(c => {
    const price = state.prices[c]
    return `<span class="ticker-item" data-coin="${c}">${c} <span class="ticker-price">${price ? `$${price.toFixed(0)}` : '...'}</span></span>`
  }).join('')

  return `
    <div class="live-ticker" id="live-ticker" title="Click to open Order Book">
      ${items}
      <span class="ticker-expand">${ICONS.expand || '↗'}</span>
    </div>
  `
}

function renderEditLayoutButton(): string {
  if (state.editMode) {
    return `
      <div class="edit-mode-actions">
        <button class="reset-layout-btn" id="reset-layout-btn">Reset</button>
        <button class="edit-layout-btn active" id="edit-layout-btn">
          ${ICONS.check}
          <span>Done</span>
        </button>
      </div>
    `
  }

  return `
    <button class="edit-layout-btn" id="edit-layout-btn">
      ${ICONS.settings}
      <span>Edit</span>
    </button>
  `
}

function renderWalletButton(): string {
  if (state.isConnecting) {
    return `
      <button class="wallet-btn connecting" id="wallet-btn" disabled>
        <span class="wallet-spinner"></span>
        <span class="wallet-btn-text">Connecting...</span>
      </button>
    `
  }

  if (state.connected) {
    return `
      <button class="wallet-btn connected" id="wallet-btn">
        <span class="wallet-status-dot"></span>
        <span class="wallet-btn-text">${truncAddr(state.address)}</span>
      </button>
    `
  }

  return `
    <button class="wallet-btn" id="wallet-btn">
      <span class="wallet-icon">${ICONS.wallet}</span>
      <span class="wallet-btn-text">Connect Wallet</span>
    </button>
  `
}

function renderTradeContent(): string {
  return `
    <div class="panels-container${state.editMode ? ' edit-mode' : ''}" id="widget-grid">
      <div class="widget-column" data-column="0">
        ${renderColumnWidgets(0)}
      </div>
      <div class="widget-column" data-column="1">
        ${renderColumnWidgets(1)}
      </div>
    </div>
  `
}

function renderFeedPage(): string {
  return `<div class="full-page"><h1 class="page-title">:: Activity Feed ::</h1>${state.feed.map(f => `<div class="feed-item"><div class="feed-user">${f.user}</div><div class="feed-text">${f.text}</div><div class="feed-time">${f.time}</div></div>`).join('')}</div>`
}

function renderLeaderboardPage(): string {
  return `<div class="full-page"><h1 class="page-title">:: Leaderboard ::</h1>${state.leaderboard.map(l => `<div class="lb-item"><span class="lb-rank ${l.rank === 1 ? 'gold' : l.rank === 2 ? 'silver' : l.rank === 3 ? 'bronze' : ''}">#${l.rank}</span><div><div class="lb-name">${l.name}</div><div class="lb-addr">${l.address}</div></div><span class="lb-pnl">+${formatCompact(l.pnl)}</span></div>`).join('')}</div>`
}

function renderPortfolioPage(): string {
  const totalPnl = getTotalPnl()
  const totalValue = state.positions.filter(p => p.status === 'open').reduce((sum, p) => sum + p.size, 0)
  const wins = state.history.filter(h => h.pnl > 0).length
  const total = state.history.length
  const winRate = total > 0 ? (wins / total * 100).toFixed(1) : '0.0'
  return `<div class="full-page"><h1 class="page-title">:: Portfolio ::</h1><div class="portfolio-stats"><div class="portfolio-stat"><div class="portfolio-stat-label">Balance</div><div class="portfolio-stat-value">${formatUSD(state.balance)}</div></div><div class="portfolio-stat"><div class="portfolio-stat-label">Open Value</div><div class="portfolio-stat-value">${formatUSD(totalValue)}</div></div><div class="portfolio-stat"><div class="portfolio-stat-label">Total P&L</div><div class="portfolio-stat-value ${totalPnl >= 0 ? 'up' : ''}">${totalPnl >= 0 ? '+' : ''}${formatUSD(totalPnl)}</div></div><div class="portfolio-stat"><div class="portfolio-stat-label">Win Rate</div><div class="portfolio-stat-value">${winRate}%</div></div></div></div>`
}

function renderBridgePage(): string {
  return `
    <div class="bridge-page">
      <div class="bridge-hero">
        <h1 class="bridge-title">${ICONS.bridge} Bridge to HyperEVM</h1>
        <p class="bridge-subtitle">One-click onboarding from any chain. Powered by LI.FI.</p>
      </div>
      <div class="bridge-container">
        ${renderBridgeWidget()}
      </div>
      <div class="bridge-info">
        <div class="bridge-info-item">
          <span class="info-icon">${ICONS.check}</span>
          <div>
            <strong>Best Routes</strong>
            <p>LI.FI finds the cheapest and fastest path across chains.</p>
          </div>
        </div>
        <div class="bridge-info-item">
          <span class="info-icon">${ICONS.wallet}</span>
          <div>
            <strong>7 Chains Supported</strong>
            <p>Bridge from Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche, or BNB Chain.</p>
          </div>
        </div>
        <div class="bridge-info-item">
          <span class="info-icon">${ICONS.swords}</span>
          <div>
            <strong>Start Trading Immediately</strong>
            <p>Once bridged, you can trade on Hyperliquid perpetuals right away.</p>
          </div>
        </div>
      </div>
    </div>
  `
}

function renderMarketModal(): string {
  const filters = ['all', 'crypto']
  const filtered = state.marketFilter === 'all' ? state.markets : state.markets.filter(m => m.category === state.marketFilter)
  return `<div class="modal" id="market-modal"><div class="modal-box"><div class="modal-head"><span class="modal-title">:: Select Market ::</span><button class="modal-close" id="modal-close">×</button></div><div class="modal-filters">${filters.map(f => `<button class="modal-filter ${state.marketFilter === f ? 'active' : ''}" data-filter="${f}">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('')}</div><div class="modal-list">${filtered.map(m => `<div class="modal-option ${m.id === state.selectedMarket ? 'selected' : ''}" data-id="${m.id}"><div class="modal-option-info"><span class="modal-option-asset">${m.asset}</span><span class="modal-option-q">${m.question}</span></div><div class="modal-option-prices"><span class="price-yes">${(m.yesPrice * 100).toFixed(0)}¢</span><span class="price-no">${(m.noPrice * 100).toFixed(0)}¢</span></div></div>`).join('')}</div></div></div>`
}

function renderOrderBookModal(): string {
  const ob = state.orderBook
  const coin = state.orderBookCoin
  const price = state.prices[coin]

  // Popular coins for quick switching
  const popularCoins = ['BTC', 'ETH', 'SOL', 'HYPE', 'ARB', 'DOGE']

  let bookContent = ''
  if (!ob) {
    bookContent = '<div class="orderbook-loading">Loading order book...</div>'
  } else {
    const maxBidSize = Math.max(...ob.bids.map(b => b.size), 0.01)
    const maxAskSize = Math.max(...ob.asks.map(a => a.size), 0.01)

    const askRows = [...ob.asks].reverse().map(a => {
      const pct = (a.size / maxAskSize) * 100
      return `<div class="ob-row ob-ask"><div class="ob-bar" style="width:${pct}%"></div><span class="ob-price">${a.price.toFixed(2)}</span><span class="ob-size">${a.size.toFixed(4)}</span></div>`
    }).join('')

    const bidRows = ob.bids.map(b => {
      const pct = (b.size / maxBidSize) * 100
      return `<div class="ob-row ob-bid"><div class="ob-bar" style="width:${pct}%"></div><span class="ob-price">${b.price.toFixed(2)}</span><span class="ob-size">${b.size.toFixed(4)}</span></div>`
    }).join('')

    const spread = ob.asks.length > 0 && ob.bids.length > 0
      ? (ob.asks[0].price - ob.bids[0].price).toFixed(2)
      : '-'

    bookContent = `
      <div class="ob-asks">${askRows}</div>
      <div class="ob-spread">
        <span class="ob-spread-label">Spread</span>
        <span class="ob-spread-value">$${spread}</span>
      </div>
      <div class="ob-bids">${bidRows}</div>
    `
  }

  return `
    <div class="modal" id="orderbook-modal">
      <div class="modal-box orderbook-box">
        <div class="modal-head">
          <span class="modal-title">:: ${coin} Order Book ::</span>
          <button class="modal-close" id="orderbook-close">×</button>
        </div>
        <div class="ob-coin-tabs">
          ${popularCoins.map(c => `<button class="ob-coin-tab ${c === coin ? 'active' : ''}" data-coin="${c}">${c}</button>`).join('')}
        </div>
        <div class="ob-header">
          <span class="ob-mid-price">${price ? `$${price.toFixed(2)}` : 'Loading...'}</span>
          <span class="ob-timestamp">${ob ? `Updated ${Math.floor((Date.now() - ob.lastUpdate) / 1000)}s ago` : ''}</span>
        </div>
        <div class="ob-labels">
          <span>Price (USD)</span>
          <span>Size</span>
        </div>
        <div class="ob-book">${bookContent}</div>
      </div>
    </div>
  `
}

function getConnectionIndicatorClass(): string {
  switch (state.connectionState) {
    case 'CONNECTED': return 'state-connected'
    case 'DEGRADED': return 'state-degraded'
    case 'UNSTABLE': return 'state-unstable'
    case 'DISCONNECTED': return 'state-disconnected'
  }
}

function getConnectionLabel(): string {
  switch (state.connectionState) {
    case 'CONNECTED': return ''
    case 'DEGRADED': return 'Slow'
    case 'UNSTABLE': return 'Unstable'
    case 'DISCONNECTED': return connectionMonitor.getFormattedLastUpdate()
  }
}

function renderConnectionIndicator(): string {
  const stateClass = getConnectionIndicatorClass()
  const label = getConnectionLabel()

  return `
    <div class="connection-indicator ${stateClass}" id="connection-indicator">
      <div class="connection-dot"></div>
      ${label ? `<span class="connection-label">${label}</span>` : ''}
    </div>
  `
}

function formatProbeName(name: string): string {
  const names: Record<string, string> = {
    priceFeed: 'Price Feed',
    webSocket: 'WebSocket',
    serverHealth: 'Server',
    exchangeHealth: 'Exchange',
    browser: 'Browser',
  }
  return names[name] || name
}

function formatEventDescription(event: { type: string; data: Record<string, unknown> }): string {
  switch (event.type) {
    case 'state_change':
      return `${event.data.previous || 'Init'} → ${event.data.current}`
    case 'error':
      return `Error: ${event.data.probe} - ${event.data.error || event.data.reason || 'unknown'}`
    case 'anomaly':
      return `Anomaly: ${event.data.pattern}`
    case 'reconnect':
      return event.data.success ? 'Reconnected' : 'Reconnect failed'
    default:
      return event.type
  }
}

function renderDiagnosticPanel(): string {
  if (!state.showDiagnosticPanel) return ''

  const reports = connectionMonitor.getAllProbeReports()
  const confidence = connectionMonitor.getConfidence()
  const history = connectionMonitor.getHistory(10)
  const serverStats = connectionMonitor.getLatencyStats('serverHealth')
  const exchangeStats = connectionMonitor.getLatencyStats('exchangeHealth')
  const isInitializing = connectionMonitor.isInitializing()
  const initProgress = connectionMonitor.getInitializationProgress()

  const probeRows = reports.map(r => {
    const isReady = initProgress.ready.includes(r.name)
    const statusClass = `probe-${r.status}`
    const readyIndicator = isInitializing ? (isReady ? '✓' : '⏳') : ''
    const latencyStr = r.latency ? `${r.latency}ms` : ''
    return `
      <div class="probe-row">
        <span class="probe-name">${readyIndicator} ${formatProbeName(r.name)}</span>
        <span class="probe-status ${statusClass}">${r.status}</span>
        <span class="probe-latency">${latencyStr}</span>
        <span class="probe-message">${r.message || ''}</span>
      </div>
    `
  }).join('')

  const historyRows = history.slice().reverse().map(e => {
    const time = new Date(e.timestamp).toLocaleTimeString()
    const desc = formatEventDescription(e)
    return `<div class="history-item"><span class="history-time">${time}</span><span class="history-event">${desc}</span></div>`
  }).join('')

  const overallStateDisplay = isInitializing
    ? `INITIALIZING (${initProgress.ready.length}/5)`
    : state.connectionState

  const stateClass = isInitializing ? 'initializing' : state.connectionState.toLowerCase()

  return `
    <div class="diagnostic-panel" id="diagnostic-panel">
      <div class="diagnostic-header">
        <span class="diagnostic-title">Connection Status</span>
        <button class="diagnostic-close" id="diagnostic-close">×</button>
      </div>
      <div class="diagnostic-overview">
        <div class="overall-state state-${stateClass}">${overallStateDisplay}</div>
        <div class="confidence-label">${isInitializing ? 'Waiting for all probes...' : `Confidence: ${confidence}`}</div>
        <div class="last-update">Last update: ${connectionMonitor.getFormattedLastUpdate()}</div>
      </div>
      <div class="diagnostic-section">
        <div class="diagnostic-section-title">Probes ${isInitializing ? `(${initProgress.ready.length}/${initProgress.ready.length + initProgress.pending.length} ready)` : ''}</div>
        <div class="probe-list">${probeRows}</div>
      </div>
      ${serverStats || exchangeStats ? `
        <div class="diagnostic-section">
          <div class="diagnostic-section-title">Latency</div>
          ${serverStats ? `<div class="latency-row"><span>Server:</span><span>${serverStats.current}ms (avg ${serverStats.mean}ms, ${serverStats.trend})</span></div>` : ''}
          ${exchangeStats ? `<div class="latency-row"><span>Exchange:</span><span>${exchangeStats.current}ms (avg ${exchangeStats.mean}ms, ${exchangeStats.trend})</span></div>` : ''}
        </div>
      ` : ''}
      <div class="diagnostic-section">
        <div class="diagnostic-section-title">Recent Events</div>
        <div class="history-list">${historyRows || '<div class="history-empty">No events yet</div>'}</div>
      </div>
    </div>
  `
}

function updateDialogueMask() {
  const box = document.querySelector('.dialogue-box') as HTMLElement
  const portrait = document.querySelector('.dialogue-portrait') as HTMLElement

  if (!box || !portrait) return

  if (!portrait.classList.contains('visible')) {
    box.style.clipPath = 'none'
    return
  }

  const boxRect = box.getBoundingClientRect()
  const portRect = portrait.getBoundingClientRect()

  const left = portRect.left - boxRect.left
  const top = portRect.top - boxRect.top
  const right = left + portRect.width
  const bottom = top + portRect.height

  const x1 = Math.max(0, left)
  const y1 = Math.max(0, top)
  const x2 = Math.min(boxRect.width, right)
  const y2 = Math.min(boxRect.height, bottom)

  if (x2 <= 0 || y2 <= 0 || x1 >= boxRect.width || y1 >= boxRect.height) {
    box.style.clipPath = 'none'
    return
  }

  box.style.clipPath = `polygon(
    0 0,
    0 ${y1}px,
    ${x2}px ${y1}px,
    ${x2}px ${y2}px,
    0 ${y2}px,
    0 100%,
    100% 100%,
    100% 0
  )`
}
