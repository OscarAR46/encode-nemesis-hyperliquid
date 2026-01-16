// ========================================
// NEMESIS Trading Terminal
// "Every trade needs a Nemesis."
// Anime Girl // Bitmex // Early 90s // Final Fantasy Jenova
// ========================================

// --- Type Definitions ---
interface Market {
  id: string;
  asset: string;
  question: string;
  targetPrice: number;
  currentPrice: number;
  expiresAt: number;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  type: 'binary' | 'range';
}

interface Position {
  id: string;
  marketId: string;
  market: string;
  side: 'yes' | 'no';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  tradeType: 'standard' | 'pvp' | 'teams';
}

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface FeedItem {
  type: 'trade' | 'tweet' | 'challenge';
  user: string;
  action?: string;
  target?: string;
  market?: string;
  profit?: string;
  stake?: string;
  content?: string;
  time: string;
}

// --- Nemesis Personality System ---
const NEMESIS = {
  idle: [
    "Nemesis is watching the markets...",
    "Nemesis believes in you.",
    "Ready when you are~",
    "The markets whisper to Nemesis...",
    "Nemesis sees opportunity.",
    "Your Nemesis awaits your command.",
  ],
  processing: [
    "Nemesis is processing your order...",
    "Nemesis is working on it~",
    "One moment... Nemesis is thinking.",
    "Nemesis is calculating probabilities...",
  ],
  filled: [
    "Mmm~ Order filled successfully!",
    "UwU~ You've been filled!",
    "Ahh~ Position opened!",
    "Nemesis filled you good~",
    "Yes yes yes~ Order complete!",
    "Kyaa~ It's in!",
  ],
  win: [
    "DOMINATING! Nemesis knew you could do it!",
    "Winner winner~ Nemesis is proud!",
    "You're amazing! UwU",
    "Nemesis wants to celebrate with you~",
  ],
  loss: [
    "Nemesis will be here for you...",
    "The market is cruel... but Nemesis believes in you.",
    "This isn't the end. Nemesis knows you'll come back stronger.",
  ],
  pvp: [
    "Nemesis loves the rivalry~",
    "Find your Nemesis. Destroy them.",
    "Every trade needs a Nemesis.",
  ],
  teams: [
    "Together we rise, together we fall~",
    "Nemesis approves of your bonds.",
    "Friends who trade together, stay together!",
  ],
};

function getRandomMessage(category: keyof typeof NEMESIS): string {
  const messages = NEMESIS[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// --- SVG Icons (Improved) ---
const ICONS = {
  // Better Crossed Swords for PvP
  swords: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4l8 8M12 4l-8 8M20 4l-8 8M12 4l8 8M8 12l4 4M12 12l-4 4M16 12l4 4M20 12l-4 4"/>
    <path d="M6 6l2 2M18 6l-2 2M6 18l2-2M18 18l-2-2" opacity="0.5"/>
  </svg>`,
  
  // Teams Icon
  teams: `<svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="8" r="2"/>
    <circle cx="18" cy="8" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M4 20v-4l2-2M20 20v-4l-2-2M12 16v-2"/>
  </svg>`,
  
  // Other icons...
  timer: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6l4 2"/><path d="M12 3v2M4.93 5.93l1.41 1.41M19.07 5.93l-1.41 1.41"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v4h-4"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>`,
  logo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4v16h3V9.5l10 10.5h3V4h-3v10.5L7 4H4z"/><circle cx="17" cy="7" r="2" fill="currentColor" opacity="0.6"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 12l6 6L20 6"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  avatar: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" opacity="0.3"/><circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="1" opacity="0.5"/><circle cx="24" cy="20" r="8" fill="currentColor" opacity="0.8"/><ellipse cx="24" cy="36" rx="12" ry="8" fill="currentColor" opacity="0.6"/><circle cx="21" cy="18" r="1.5" fill="white"/><circle cx="27" cy="18" r="1.5" fill="white"/><path d="M20 23 Q24 26 28 23" stroke="white" stroke-width="1.5" fill="none"/></svg>`,
};

// --- Application State ---
type OrderTab = 'yes' | 'no' | 'pvp' | 'teams';
type NavTab = 'trade' | 'pvp' | 'teams' | 'feed' | 'portfolio';

const state = {
  connected: false,
  address: '',
  balance: 0,
  selectedMarket: null as Market | null,
  activeNav: 'trade' as NavTab,
  activePositionsTab: 'positions' as 'positions' | 'orders' | 'history' | 'pvp' | 'teams',
  markets: [] as Market[],
  positions: [] as Position[],
  feed: [] as FeedItem[],
  orderBook: { asks: [] as any[], bids: [] as any[] },
  stakeAmount: 100,
  nemesisMessage: NEMESIS.idle[0],
  isProcessing: false,
  pvpInvitees: [''],
};

// --- Audio System (Anime Girl Moans) ---
const AudioSystem = {
  context: null as AudioContext | null,
  
  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  },
  
  // "Literally you get filled" - cute moan sound
  playFillSound() {
    const ctx = this.init();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sine';
    // Cute ascending "ahh~" frequencies
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  },
  
  // TF2 DOMINATING sound
  playWinSound() {
    const ctx = this.init();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047, 1319]; // C E G C E
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.3, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }
};

// --- Mock Data Generation ---
function generateMarkets(): Market[] {
  const now = Date.now();
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
  ];
}

function generateFeed(): FeedItem[] {
  return [
    {
      type: 'trade',
      user: '0xNemesis',
      action: 'DOMINATED',
      target: '0xRival',
      market: 'ETH > $3,500',
      profit: '+$420',
      time: '2m ago'
    },
    {
      type: 'tweet',
      user: 'CryptoWaifu',
      content: 'Nemesis is the most kawaii way to lose money uwu~ 💖',
      time: '5m ago'
    },
    {
      type: 'challenge',
      user: '0xDegenKing',
      action: 'issued a PvP challenge',
      market: 'BTC > $100k',
      stake: '$1,000',
      time: '8m ago'
    },
  ];
}

// --- Utility Functions ---
function formatTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

function formatUSD(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function el(tag: string, className?: string, content?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

// --- Notification System ---
function showNotification(message: string, type: 'success' | 'info' | 'error' = 'info') {
  const existing = document.querySelector('.nemesis-notification');
  if (existing) existing.remove();
  
  const notification = el('div', `nemesis-notification ${type}`);
  notification.innerHTML = `
    <div class="nemesis-notification-avatar">${ICONS.avatar}</div>
    <div class="nemesis-notification-content">
      <div class="nemesis-notification-title">NEMESIS</div>
      <div class="nemesis-notification-message">${message}</div>
    </div>
  `;
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => notification.classList.add('show'));
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// --- Component Rendering ---
function renderHeader(): HTMLElement {
  const header = el('header', 'header');
  header.innerHTML = `
    <div class="logo">
      <div class="logo-icon">${ICONS.logo}</div>
      <span>NEMESIS</span>
    </div>
    <nav class="nav">
      <div class="nav-item ${state.activeNav === 'trade' ? 'active' : ''}" data-nav="trade">Trade</div>
      <div class="nav-item ${state.activeNav === 'pvp' ? 'active' : ''}" data-nav="pvp">PvP</div>
      <div class="nav-item ${state.activeNav === 'teams' ? 'active' : ''}" data-nav="teams">Teams</div>
      <div class="nav-item ${state.activeNav === 'feed' ? 'active' : ''}" data-nav="feed">Feed</div>
      <div class="nav-item ${state.activeNav === 'portfolio' ? 'active' : ''}" data-nav="portfolio">Portfolio</div>
    </nav>
    <div class="header-spacer"></div>
    <button class="connect-btn" id="connect-btn">
      ${state.connected ? truncateAddress(state.address) : 'Connect Wallet'}
    </button>
  `;
  
  header.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      state.activeNav = item.dataset.nav as NavTab;
      renderApp();
    });
  });
  
  header.querySelector('#connect-btn')?.addEventListener('click', () => {
    if (!state.connected) {
      state.connected = true;
      state.address = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12';
      showNotification("Nemesis recognizes you. Welcome back~", 'success');
      renderApp();
    }
  });
  
  return header;
}

function renderTradeView(): HTMLElement {
  const main = el('main', 'main');
  main.innerHTML = `
    <div class="panel markets-panel">${renderMarketsPanel().innerHTML}</div>
    <div class="panel chart-panel">${renderChartPanel().innerHTML}</div>
    <div class="panel order-panel">${renderOrderPanel().innerHTML}</div>
    <div class="panel positions-panel">${renderPositionsPanel().innerHTML}</div>
  `;
  return main;
}

function renderFeedView(): HTMLElement {
  const feed = el('div', 'feed-panel active');
  feed.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">Live Beef // Social Feed</span>
    </div>
    <div class="panel-content">
      ${state.feed.map(item => `
        <div class="feed-item">
          <div class="feed-avatar"></div>
          <div class="feed-content">
            <div class="feed-user">${item.user}</div>
            <div class="feed-action">${item.action || item.content}</div>
            <div class="muted">${item.market || ''} ${item.stake || ''} ${item.profit || ''}</div>
            <div class="muted" style="font-size: 10px;">${item.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  return feed;
}

function renderMarketsPanel(): HTMLElement {
  const panel = el('div', 'panel markets-panel');
  const marketsHTML = state.markets.map((market, i) => `
    <div class="market-item ${i === 0 ? 'selected' : ''}" data-id="${market.id}">
      <div class="market-name">
        ${market.asset}
        <span class="market-type">BINARY</span>
      </div>
      <div>${formatTime(market.expiresAt - Date.now())}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 8px;">
        <span style="color: var(--neon-green)">${(market.yesPrice * 100).toFixed(0)}c YES</span>
        <span style="color: var(--neon-red)">${(market.noPrice * 100).toFixed(0)}c NO</span>
      </div>
    </div>
  `).join('');
  
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
    <div class="panel-content">
      <div class="market-list">${marketsHTML}</div>
    </div>
  `;
  
  panel.querySelectorAll('.market-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      state.selectedMarket = state.markets.find(m => m.id === id) || null;
      renderApp();
    });
  });
  
  return panel;
}

function renderOrderPanel(): HTMLElement {
  const panel = el('div', 'panel order-panel');
  const market = state.selectedMarket || state.markets[0];
  const price = state.selectedTab === 'no' ? market.noPrice : market.yesPrice;
  const payout = state.stakeAmount / price;
  
  panel.innerHTML = `
    <div class="order-tabs">
      <div class="order-tab ${state.selectedTab === 'yes' ? 'active' : ''}" data-tab="yes">YES</div>
      <div class="order-tab ${state.selectedTab === 'no' ? 'active' : ''}" data-tab="no">NO</div>
      <div class="order-tab ${state.selectedTab === 'pvp' ? 'active' : ''}" data-tab="pvp">${ICONS.swords} PvP</div>
      <div class="order-tab ${state.selectedTab === 'teams' ? 'active' : ''}" data-tab="teams">${ICONS.teams} Teams</div>
    </div>
    <div class="order-form">
      <div class="order-market-info">
        <div style="font-weight: 900; margin-bottom: 8px;">${market.question}</div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Current: <strong>${formatUSD(market.currentPrice)}</strong></span>
          <span>${formatTime(market.expiresAt - Date.now())}</span>
        </div>
      </div>
      <div class="form-group">
        <label style="font-size: 10px; color: var(--mid-ocean);">Stake Amount</label>
        <input type="number" id="stake-input" value="${state.stakeAmount}" 
               style="width: 100%; padding: 12px; background: var(--deep-ocean); border: 1px solid var(--mid-ocean); color: var(--foam-white);">
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          ${[25, 50, 100, 250, 500].map(amt => 
            `<button class="form-preset" data-amount="${amt}" style="flex: 1; padding: 8px; background: var(--deep-ocean); border: 1px solid var(--mid-ocean); color: var(--foam-white); cursor: pointer;">$${amt}</button>`
          ).join('')}
        </div>
      </div>
      <div class="order-summary" style="padding: 14px; background: rgba(0, 17, 34, 0.6); border-radius: 8px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Price:</span><span>${(price * 100).toFixed(0)}c</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Shares:</span><span>${payout.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Potential Profit:</span><span style="color: var(--neon-green);">+${formatUSD(payout - state.stakeAmount)}</span>
        </div>
      </div>
      <button class="order-btn ${state.selectedTab} ${state.isProcessing ? 'processing' : ''}" id="order-btn">
        ${state.isProcessing ? 'Nemesis is processing...' : 
          state.selectedTab === 'yes' ? 'Buy YES' :
          state.selectedTab === 'no' ? 'Buy NO' :
          state.selectedTab === 'pvp' ? 'Challenge Nemesis' : 'Unite with Allies'}
      </button>
    </div>
  `;
  
  // Event listeners
  panel.querySelectorAll('.order-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.selectedTab = tab.dataset.tab as OrderTab;
      renderApp();
    });
  });
  
  panel.querySelectorAll('.form-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      state.stakeAmount = parseFloat(btn.dataset.amount || '100');
      renderApp();
    });
  });
  
  panel.querySelector('#stake-input')?.addEventListener('input', (e) => {
    state.stakeAmount = parseFloat((e.target as HTMLInputElement).value) || 0;
    renderApp();
  });
  
  panel.querySelector('#order-btn')?.addEventListener('click', handlePlaceOrder);
  
  return panel;
}

function renderPositionsPanel(): HTMLElement {
  const panel = el('div', 'panel positions-panel');
  const tabsHTML = ['positions', 'orders', 'history', 'pvp', 'teams'].map(tab => `
    <div class="positions-tab ${state.activePositionsTab === tab ? 'active' : ''}" data-tab="${tab}">
      ${tab.toUpperCase()} <span class="count">${tab === 'positions' ? state.positions.length : '0'}</span>
    </div>
  `).join('');
  
  const contentHTML = state.activePositionsTab === 'positions' && state.positions.length > 0 ? `
    <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
      <thead><tr style="border-bottom: 1px solid var(--mid-ocean);">
        <th style="text-align: left; padding: 8px;">Market</th>
        <th style="text-align: left; padding: 8px;">Side</th>
        <th style="text-align: left; padding: 8px;">Size</th>
        <th style="text-align: left; padding: 8px;">P&L</th>
        <th style="text-align: left; padding: 8px;"></th>
      </tr></thead>
      <tbody>
        ${state.positions.map(pos => `
          <tr style="border-bottom: 1px solid var(--mid-ocean);">
            <td style="padding: 8px;">${pos.market}</td>
            <td style="padding: 8px; color: ${pos.side === 'yes' ? 'var(--neon-green)' : 'var(--neon-red)'}">${pos.side.toUpperCase()}</td>
            <td style="padding: 8px;">${formatUSD(pos.size)}</td>
            <td style="padding: 8px; color: ${pos.pnl >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'}">
              ${formatUSD(pos.pnl)} (${pos.pnlPercent.toFixed(2)}%)
            </td>
            <td style="padding: 8px;">
              <button class="close-btn" data-id="${pos.id}">CLOSE</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : `<div style="padding: 50px; text-align: center; color: var(--mid-ocean);">Nemesis awaits your first trade...</div>`;
  
  panel.innerHTML = `
    <div class="panel-header">
      <div class="positions-tabs">${tabsHTML}</div>
    </div>
    <div class="panel-content">${contentHTML}</div>
  `;
  
  // Tab switching
  panel.querySelectorAll('.positions-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activePositionsTab = tab.dataset.tab as any;
      renderApp();
    });
  });
  
  // Close position
  panel.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      state.positions = state.positions.filter(p => p.id !== id);
      showNotification("Position closed. Nemesis is pleased~", 'success');
      renderApp();
    });
  });
  
  return panel;
}

function renderChartPanel(): HTMLElement {
  const panel = el('div', 'panel chart-panel');
  const market = state.selectedMarket || state.markets[0];
  panel.innerHTML = `
    <div class="panel-header">
      <span class="panel-title">${market.question}</span>
    </div>
    <div class="chart-area" style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--mid-ocean);">
      <div>${ICONS.chart} Chart Integration (TradingView)</div>
    </div>
  `;
  return panel;
}

// --- Handlers ---
async function handlePlaceOrder() {
  if (!state.connected) {
    showNotification("Connect your wallet first. Nemesis needs to know you~", 'info');
    return;
  }
  if (state.isProcessing) return;
  
  const market = state.selectedMarket || state.markets[0];
  const side = state.selectedTab === 'no' ? 'no' : 'yes';
  
  // Processing state
  state.isProcessing = true;
  state.nemesisMessage = getRandomMessage('processing');
  renderApp();
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Add position
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
    tradeType: state.selectedTab as any
  };
  
  state.positions.push(newPosition);
  state.isProcessing = false;
  
  // Play sounds and notify
  AudioSystem.playFillSound();
  const message = getRandomMessage('filled');
  showNotification(message, 'success');
  state.nemesisMessage = message;
  
  renderApp();
}

// --- Main App Renderer ---
function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = '';
  app.appendChild(renderHeader());
  
  if (state.activeNav === 'feed') {
    app.appendChild(renderFeedView());
  } else {
    app.appendChild(renderTradeView());
  }
  
  // Add mascot if not exists
  if (!document.querySelector('.mascot-container')) {
    const mascot = el('div', 'mascot-container');
    mascot.innerHTML = `
      <div class="mascot-silhouette">
        <div class="mascot-eyes">
          <div class="eye"></div>
          <div class="eye"></div>
        </div>
      </div>
    `;
    document.body.appendChild(mascot);
  }
}

// --- Initialization ---
function init() {
  state.markets = generateMarkets();
  state.selectedMarket = state.markets[0];
  state.feed = generateFeed();
  
  renderApp();
  
  // Start price updates
  setInterval(() => {
    state.markets.forEach(market => {
      const change = (Math.random() - 0.5) * 0.02;
      market.currentPrice *= (1 + change);
      const oddsChange = (Math.random() - 0.5) * 0.01;
      market.yesPrice = Math.max(0.01, Math.min(0.99, market.yesPrice + oddsChange));
      market.noPrice = 1 - market.yesPrice;
    });
    
    state.positions.forEach(pos => {
      const market = state.markets.find(m => m.id === pos.marketId);
      if (market) {
        pos.currentPrice = pos.side === 'yes' ? market.yesPrice : market.noPrice;
        pos.pnl = (pos.currentPrice - pos.entryPrice) * pos.size / pos.entryPrice;
        pos.pnlPercent = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
      }
    });
    
    // Randomly play win sound for demo
    if (Math.random() > 0.95 && state.positions.length > 0) {
      AudioSystem.playWinSound();
      showNotification(getRandomMessage('win'), 'success');
    }
  }, 3000);
  
  // Rotate idle messages
  setInterval(() => {
    if (!state.isProcessing && state.activeNav === 'trade') {
      state.nemesisMessage = getRandomMessage('idle');
      const msgEl = document.querySelector('#nemesis-message');
      if (msgEl) msgEl.textContent = state.nemesisMessage;
    }
  }, 8000);
  
  console.log('NEMESIS initialized');
  console.log('Every trade needs a Nemesis.');
}

// Start the application
init();