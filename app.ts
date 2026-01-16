import morphdom from 'morphdom'
import { connectionMonitor, ConnectionState, ProbeReport, AnomalyPattern } from './connection'

type Scene = 'title' | 'main'
type NavTab = 'trade' | 'feed' | 'leaderboard' | 'portfolio'
type OrderTab = 'yes' | 'no' | 'lobby' | 'duel'
type PosTab = 'positions' | 'orders' | 'history'
type AvatarMode = 'full' | 'small' | 'off'
type Emotion = 'happy' | 'kawaii' | 'pleased' | 'sly' | 'concerned' | 'inquisitive' | 'talkative' | 'excited' | 'loss'
type DialogueSignal = 'off' | 'connecting' | 'connected' | 'disconnecting'

interface Market {
  id: string
  asset: string
  question: string
  yesPrice: number
  noPrice: number
  volume: number
  expiry: number
  category: string
}

interface Position {
  id: string
  marketId: string
  market: string
  side: 'yes' | 'no'
  size: number
  entry: number
  current: number
  pnl: number
  type: 'standard' | 'lobby' | 'duel'
  status: 'open' | 'closed'
}

interface DialogueLine {
  text: string
  emotion: Emotion
  showName?: boolean
}

const ICONS = {
  logo: `<svg viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  swords: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/></svg>`,
  lobby: `<svg viewBox="0 0 24 24" fill="currentColor"><ellipse cx="8" cy="6" rx="3.5" ry="4"/><path d="M1 19c0-4 3-6 7-6s7 2 7 6v1H1z"/><ellipse cx="16" cy="6" rx="3.5" ry="4" opacity="0.7"/><path d="M23 19c0-4-3-6-7-6-1.5 0-2.8.3-4 .9 2.5 1 4 3.2 4 5.1v1h7z" opacity="0.7"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
}

const INTRO_DIALOGUE: DialogueLine[] = [
  { text: "Ah... you're finally here. I've been waiting for someone like you.", emotion: 'pleased', showName: false },
  { text: "They call me Nemesis. Every trader needs one, you know~. Let me show you what we can do together...", emotion: 'talkative', showName: false },
]

const DIALOGUE = {
  idle: [
    { text: "What's your next move going to be?", emotion: 'inquisitive' as Emotion },
    { text: "The markets are whispering... can you hear them?", emotion: 'kawaii' as Emotion },
    { text: "I believe in you~ Show me what you've got!", emotion: 'happy' as Emotion },
    { text: "Don't keep me waiting too long...", emotion: 'sly' as Emotion },
    { text: "Every trader needs a Nemesis. That's me~", emotion: 'pleased' as Emotion },
    { text: "Feeling lucky today? I can sense it...", emotion: 'talkative' as Emotion },
  ],
  filled: [
    { text: "Ahh~ Order filled! You're in deep now...", emotion: 'excited' as Emotion },
    { text: "Mmm~ Position opened! I like your style~", emotion: 'pleased' as Emotion },
    { text: "Yes! That's the spirit!", emotion: 'happy' as Emotion },
    { text: "Bold move... I'm watching closely~", emotion: 'sly' as Emotion },
  ],
  closed: [
    { text: "Position closed! How did that feel?", emotion: 'inquisitive' as Emotion },
    { text: "Out already? I wanted to see more...", emotion: 'concerned' as Emotion },
    { text: "Clean exit! You're good at this...", emotion: 'pleased' as Emotion },
  ],
  connect: [
    { text: "Welcome back~ I've missed you...", emotion: 'happy' as Emotion },
    { text: "Finally! Let's make some magic together~", emotion: 'excited' as Emotion },
  ],
  lobby: [
    { text: "Trading with friends? How sweet~", emotion: 'kawaii' as Emotion },
    { text: "Strength in numbers! I approve.", emotion: 'pleased' as Emotion },
  ],
  duel: [
    { text: "Ooh~ A challenge! This is exciting...", emotion: 'excited' as Emotion },
    { text: "1v1? I love watching a good fight~", emotion: 'sly' as Emotion },
    { text: "Show your rival who's the real trader!", emotion: 'talkative' as Emotion },
  ],
  connectionDegraded: [
    { text: "Connection's getting spotty...", emotion: 'concerned' as Emotion },
    { text: "Having some trouble reaching the market.", emotion: 'inquisitive' as Emotion },
  ],
  connectionUnstable: [
    { text: "Connection's unstable. Be careful.", emotion: 'concerned' as Emotion },
    { text: "I'm losing the signal...", emotion: 'concerned' as Emotion },
  ],
  connectionLost: [
    { text: "We've lost connection. Data may be stale.", emotion: 'loss' as Emotion },
    { text: "Disconnected. I can't see the markets.", emotion: 'concerned' as Emotion },
  ],
  connectionRestored: [
    { text: "We're back. Prices are live.", emotion: 'happy' as Emotion },
    { text: "Connection restored~", emotion: 'pleased' as Emotion },
  ],
  connectionOscillating: [
    { text: "Connection's jumping around. Might want to check your wifi.", emotion: 'concerned' as Emotion },
  ],
  exchangeDown: [
    { text: "Can't reach the exchange. Might be on their end.", emotion: 'inquisitive' as Emotion },
  ],
}

const CRT_ANIMATION_MS = 300

const state = {
  scene: 'title' as Scene,
  introIndex: 0,
  introComplete: false,
  introStarted: false,
  connected: false,
  address: '',
  balance: 1250.00,
  nav: 'trade' as NavTab,
  orderTab: 'yes' as OrderTab,
  posTab: 'positions' as PosTab,
  selectedMarket: '',
  showMarketModal: false,
  showDiagnosticPanel: false,
  avatarMode: 'full' as AvatarMode,
  currentEmotion: 'kawaii' as Emotion,
  currentDialogue: '',
  dialogueQueue: [] as string[],
  isTyping: false,
  typewriterIndex: 0,
  lastDialogueByCategory: {} as Record<string, string>,
  markets: [] as Market[],
  positions: [] as Position[],
  orders: [] as any[],
  history: [] as Position[],
  feed: [] as any[],
  leaderboard: [] as any[],
  stake: 100,
  targetAddress: '',
  processing: false,
  panelStates: { market: true, order: true, positions: true },
  marketFilter: 'all',
  particlesHtml: '',
  dialogueSignal: 'off' as DialogueSignal,
  dialogueAtEnd: false,
  connectionState: 'CONNECTED' as ConnectionState,
  lastConnectionDialogue: 0,
}

let audioCtx: AudioContext | null = null
let typewriterTimer: number | null = null
let dialogueDismissTimer: number | null = null
let swRegistered = false

/**
 * Register service worker to eagerly cache all nemesis-chan images.
 * Called on first title click - the "first opportunity" after title screen.
 */
function registerServiceWorker(): void {
  if (swRegistered || !('serviceWorker' in navigator)) return
  swRegistered = true

  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('[SW] Registered, scope:', registration.scope)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              console.log('[SW] All nemesis-chan images eagerly cached')
            }
          })
        }
      })
    })
    .catch((err) => console.warn('[SW] Registration failed:', err))
}

function playSound(notes: number[], dur = 0.06) {
  if (!audioCtx) audioCtx = new AudioContext()
  const now = audioCtx.currentTime
  notes.forEach((f, i) => {
    const osc = audioCtx!.createOscillator()
    const gain = audioCtx!.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, now + i * dur)
    gain.gain.setValueAtTime(0.1, now + i * dur)
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * dur + dur * 1.5)
    osc.connect(gain)
    gain.connect(audioCtx!.destination)
    osc.start(now + i * dur)
    osc.stop(now + i * dur + dur * 2)
  })
}

function playTypeSound() {
  if (!audioCtx) audioCtx = new AudioContext()
  const now = audioCtx.currentTime
  const notes = [523, 587, 659, 698, 784]
  const note = notes[Math.floor(Math.random() * notes.length)]
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(note, now)
  osc.frequency.exponentialRampToValueAtTime(note * 1.02, now + 0.05)
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(now)
  osc.stop(now + 0.12)
}

function playCRTOn() {
  if (!audioCtx) audioCtx = new AudioContext()
  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.15)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(now)
  osc.stop(now + 0.25)
}

function playCRTOff() {
  if (!audioCtx) audioCtx = new AudioContext()
  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, now)
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.25)
  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function initData() {
  const now = Date.now()
  state.markets = [
    { id: 'eth-3500', asset: 'ETH', question: 'ETH > $3,500', yesPrice: 0.42, noPrice: 0.58, volume: 284500, expiry: now + 24*3600000, category: 'crypto' },
    { id: 'btc-100k', asset: 'BTC', question: 'BTC > $100,000', yesPrice: 0.65, noPrice: 0.35, volume: 1250000, expiry: now + 7*24*3600000, category: 'crypto' },
    { id: 'sol-200', asset: 'SOL', question: 'SOL > $200', yesPrice: 0.38, noPrice: 0.62, volume: 156000, expiry: now + 48*3600000, category: 'crypto' },
    { id: 'hype-30', asset: 'HYPE', question: 'HYPE > $30', yesPrice: 0.28, noPrice: 0.72, volume: 89000, expiry: now + 12*3600000, category: 'crypto' },
  ]
  state.selectedMarket = state.markets[0].id
  state.positions = [
    { id: 'p1', marketId: 'eth-3500', market: 'ETH > $3,500', side: 'yes', size: 250, entry: 0.38, current: 0.42, pnl: 26.32, type: 'standard', status: 'open' },
    { id: 'p2', marketId: 'btc-100k', market: 'BTC > $100,000', side: 'no', size: 500, entry: 0.40, current: 0.35, pnl: 71.43, type: 'lobby', status: 'open' },
  ]
  state.orders = [{ id: 'o1', marketId: 'eth-3500', market: 'ETH > $3,500', side: 'yes', size: 100, price: 0.40, status: 'pending' }]
  state.history = [{ id: 'h1', marketId: 'hype-30', market: 'HYPE > $25', side: 'yes', size: 300, entry: 0.45, current: 1.00, pnl: 366.67, type: 'standard', status: 'closed' }]
  state.feed = [
    { user: '0xDegen.eth', text: '<span class="hl">DOMINATED</span> 0xNoob on <span class="market">ETH > $3,500</span> <span class="profit">+$420</span>', time: '2m ago' },
    { user: '0xWhale', text: 'Just opened a massive position on BTC. Here we go!', time: '5m ago' },
  ]
  state.leaderboard = [
    { rank: 1, address: '0x1234...5678', name: 'WhaleKing', pnl: 125420 },
    { rank: 2, address: '0x2345...6789', name: 'DegenMaster', pnl: 98340 },
    { rank: 3, address: '0x3456...7890', name: 'CryptoQueen', pnl: 87650 },
  ]
  state.particlesHtml = createParticles()
}

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h`
  return `${h}h ${m}m`
}

function formatUSD(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCompact(n: number): string {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K'
  return formatUSD(n)
}

function truncAddr(a: string): string {
  return a.slice(0, 6) + '...' + a.slice(-4)
}

function getMarket(): Market {
  return state.markets.find(m => m.id === state.selectedMarket) || state.markets[0]
}

function getTotalPnl(): number {
  return state.positions.filter(p => p.status === 'open').reduce((sum, p) => sum + p.pnl, 0)
}

function toast(msg: string, type: 'info' | 'success' | 'error' = 'info') {
  const old = document.querySelector('.toast')
  if (old) old.remove()
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300) }, 2500)
}

function connectSignal(callback?: () => void) {
  if (state.dialogueSignal === 'connected' || state.dialogueSignal === 'connecting') {
    if (callback) callback()
    return
  }

  state.dialogueSignal = 'connecting'
  state.dialogueAtEnd = false
  playCRTOn()
  render()

  setTimeout(() => {
    state.dialogueSignal = 'connected'
    render()
    if (callback) callback()
  }, CRT_ANIMATION_MS)
}

function disconnectSignal(callback?: () => void) {
  clearDismissTimer()
  if (state.dialogueSignal === 'off' || state.dialogueSignal === 'disconnecting') {
    if (callback) callback()
    return
  }

  state.dialogueSignal = 'disconnecting'
  state.currentDialogue = ''
  playCRTOff()
  render()

  setTimeout(() => {
    state.dialogueSignal = 'off'
    render()
    if (callback) callback()
  }, CRT_ANIMATION_MS)
}

function setEmotion(emotion: Emotion) {
  if (state.currentEmotion === emotion) return
  const img = document.getElementById('avatar-img') as HTMLImageElement
  const portraitImg = document.getElementById('portrait-img') as HTMLImageElement
  if (img) {
    img.style.opacity = '0'
    setTimeout(() => {
      state.currentEmotion = emotion
      img.src = `nemesis-chan/${emotion}.png`
      img.style.opacity = '1'
    }, 200)
  } else {
    state.currentEmotion = emotion
  }
  if (portraitImg) {
    portraitImg.src = `nemesis-chan/${emotion}.png`
  }
}

function typewriterEffect(text: string, onComplete?: () => void) {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  state.isTyping = true
  state.typewriterIndex = 0
  state.currentDialogue = ''
  state.dialogueAtEnd = false

  if (!document.getElementById('dialogue-text')) return

  playTypeSound()

  typewriterTimer = window.setInterval(() => {
    const textEl = document.getElementById('dialogue-text')
    if (!textEl) {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      state.isTyping = false
      return
    }

    if (state.typewriterIndex < text.length) {
      state.currentDialogue += text[state.typewriterIndex]
      textEl.textContent = state.currentDialogue
      state.typewriterIndex++
    } else {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      state.isTyping = false
      state.dialogueAtEnd = true
      if (onComplete) onComplete()
    }
  }, 35)
}

function skipTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  const textEl = document.getElementById('dialogue-text')
  if (textEl && state.dialogueQueue.length > 0) {
    textEl.textContent = state.dialogueQueue[0]
    state.currentDialogue = state.dialogueQueue[0]
  }
  state.isTyping = false
  state.dialogueAtEnd = true
}

function showDialogue(line: DialogueLine, autoDismiss = false) {
  clearDismissTimer()
  state.dialogueQueue = [line.text]
  setEmotion(line.emotion)

  const onComplete = autoDismiss ? startDismissTimer : undefined

  if (state.dialogueSignal !== 'connected') {
    connectSignal(() => {
      const nameEl = document.getElementById('dialogue-name')
      if (nameEl) {
        if (line.showName !== false && state.introComplete) nameEl.classList.add('visible')
        else nameEl.classList.remove('visible')
      }
      typewriterEffect(line.text, onComplete)
    })
  } else {
    const nameEl = document.getElementById('dialogue-name')
    if (nameEl) {
      if (line.showName !== false && state.introComplete) nameEl.classList.add('visible')
      else nameEl.classList.remove('visible')
    }
    typewriterEffect(line.text, onComplete)
  }
}

function clearDismissTimer() {
  if (dialogueDismissTimer) {
    clearTimeout(dialogueDismissTimer)
    dialogueDismissTimer = null
  }
}

function startDismissTimer() {
  clearDismissTimer()
  dialogueDismissTimer = window.setTimeout(() => {
    if (state.dialogueSignal === 'connected' && state.dialogueAtEnd && state.introComplete) {
      disconnectSignal()
    }
  }, 4000)
}

function showRandomDialogue(category: keyof typeof DIALOGUE) {
  const options = DIALOGUE[category]
  if (!options || options.length === 0) return
  const lastInCategory = state.lastDialogueByCategory[category]
  let line = randomFrom(options)
  if (options.length > 1 && line.text === lastInCategory) {
    const filtered = options.filter(o => o.text !== lastInCategory)
    line = randomFrom(filtered)
  }
  state.lastDialogueByCategory[category] = line.text
  showDialogue({ ...line, showName: true }, true)
}

function advanceIntro() {
  if (state.isTyping) { skipTypewriter(); return }
  state.introIndex++
  if (state.introIndex >= INTRO_DIALOGUE.length) {
    state.introComplete = true
    state.scene = 'main'
    playSound([523, 659, 784])
    render()
    setTimeout(() => showRandomDialogue('idle'), 500)
  } else {
    showDialogue(INTRO_DIALOGUE[state.introIndex])
  }
}

function handleTitleClick() {
  if (state.scene !== 'title') return

  if (!state.introStarted) {
    state.introStarted = true
    playSound([500])
    registerServiceWorker()
    connectSignal(() => {
      showDialogue(INTRO_DIALOGUE[0])
    })
  } else {
    advanceIntro()
    playSound([500])
  }
}

function handleDialogueClick() {
  if (state.scene !== 'main') return
  clearDismissTimer()

  if (state.avatarMode === 'off') {
    if (state.isTyping) {
      skipTypewriter()
    } else if (state.dialogueAtEnd && state.dialogueSignal === 'connected') {
      disconnectSignal()
    }
    playSound([500])
    return
  }

  if (state.isTyping) {
    skipTypewriter()
  } else {
    showRandomDialogue('idle')
  }
  playSound([500])
}

function handlePortraitClick() {
  if (state.avatarMode === 'full') return
  clearDismissTimer()

  if (state.dialogueSignal === 'off') {
    showRandomDialogue('idle')
    playSound([500])
    return
  }

  if (state.isTyping) {
    skipTypewriter()
    playSound([500])
    return
  }

  if (state.avatarMode === 'off') {
    if (state.dialogueAtEnd && state.dialogueSignal === 'connected') {
      disconnectSignal()
    }
  } else {
    showRandomDialogue('idle')
  }
  playSound([500])
}

function createParticles(): string {
  let html = ''
  for (let i = 0; i < 15; i++) {
    const left = Math.random() * 100
    const delay = Math.random() * 15
    const duration = 15 + Math.random() * 10
    const size = 1 + Math.random() * 2
    html += `<div class="particle" style="left:${left}%;width:${size}px;height:${size}px;animation-delay:-${delay}s;animation-duration:${duration}s;"></div>`
  }
  return html
}

function initConnectionMonitor() {
  connectionMonitor.init()

  connectionMonitor.on('stateChange', (event: { previous: ConnectionState; current: ConnectionState }) => {
    const now = Date.now()
    const timeSinceLast = now - state.lastConnectionDialogue

    if (timeSinceLast < 5000 && event.current !== 'DISCONNECTED') return

    state.connectionState = event.current
    state.lastConnectionDialogue = now

    if (state.scene !== 'main' || !state.introComplete) {
      render()
      return
    }

    switch (event.current) {
      case 'DEGRADED':
        if (event.previous === 'CONNECTED') {
          showRandomDialogue('connectionDegraded')
        }
        break
      case 'UNSTABLE':
        showRandomDialogue('connectionUnstable')
        break
      case 'DISCONNECTED':
        showRandomDialogue('connectionLost')
        break
      case 'CONNECTED':
        if (event.previous !== 'CONNECTED') {
          showRandomDialogue('connectionRestored')
        }
        break
    }

    render()
  })

  connectionMonitor.on('anomalyDetected', (event: { pattern: AnomalyPattern }) => {
    if (state.scene !== 'main' || !state.introComplete) return

    const now = Date.now()
    if (now - state.lastConnectionDialogue < 10000) return
    state.lastConnectionDialogue = now

    switch (event.pattern) {
      case 'oscillation':
        showRandomDialogue('connectionOscillating')
        break
      case 'partial_outage':
        showRandomDialogue('exchangeDown')
        break
    }
  })

  connectionMonitor.on('probeUpdate', () => {
    if (state.showDiagnosticPanel) {
      render()
    }
  })
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

function renderDiagnosticPanel(): string {
  if (!state.showDiagnosticPanel) return ''

  const reports = connectionMonitor.getAllProbeReports()
  const confidence = connectionMonitor.getConfidence()
  const history = connectionMonitor.getHistory(10)
  const serverStats = connectionMonitor.getLatencyStats('serverHealth')
  const exchangeStats = connectionMonitor.getLatencyStats('exchangeHealth')

  const probeRows = reports.map(r => {
    const statusClass = `probe-${r.status}`
    const latencyStr = r.latency ? `${r.latency}ms` : ''
    return `
      <div class="probe-row">
        <span class="probe-name">${formatProbeName(r.name)}</span>
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

  return `
    <div class="diagnostic-panel" id="diagnostic-panel">
      <div class="diagnostic-header">
        <span class="diagnostic-title">Connection Status</span>
        <button class="diagnostic-close" id="diagnostic-close">×</button>
      </div>
      <div class="diagnostic-overview">
        <div class="overall-state state-${state.connectionState.toLowerCase()}">${state.connectionState}</div>
        <div class="confidence-label">Confidence: ${confidence}</div>
        <div class="last-update">Last update: ${connectionMonitor.getFormattedLastUpdate()}</div>
      </div>
      <div class="diagnostic-section">
        <div class="diagnostic-section-title">Probes</div>
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

function render() {
  const app = document.getElementById('app')
  if (!app) return

  const html = state.scene === 'title' ? renderTitleScreen() : renderMainInterface()

  morphdom(app, `<div id="app">${html}</div>`, {
    childrenOnly: true,
    onBeforeElUpdated: (fromEl: HTMLElement, toEl: HTMLElement) => {
      if (fromEl === document.activeElement && (fromEl.tagName === 'INPUT' || fromEl.tagName === 'TEXTAREA')) {
        return false
      }
      return true
    }
  })

  updateDialogueMask()
}

function renderTitleScreen(): string {
  return `
    <div class="scene" id="title-scene">
      <div class="bg-layer"></div>
      <div class="bg-shimmer"></div>
      <div class="bg-particles">${state.particlesHtml}</div>
      <div class="water-line"></div>
      <div class="title-screen">
        <div class="title-logo">NEMESIS</div>
        <div class="title-tagline">Every trader needs a Nemesis.</div>
        <div class="title-start">— Click to begin —</div>
      </div>
      <div class="dialogue-container">
        <div class="dialogue-box signal-${state.dialogueSignal}" id="dialogue-box">
          <div class="dialogue-name" id="dialogue-name">NEMESIS</div>
          <div class="dialogue-text" id="dialogue-text">${state.dialogueSignal === 'connected' ? state.currentDialogue : ''}</div>
          <div class="dialogue-continue">▼</div>
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
          <div class="logo">
            <div class="logo-mark">${ICONS.logo}</div>
            <span class="logo-text">NEMESIS</span>
            <span class="logo-tagline">Every trader needs a Nemesis.</span>
          </div>
          <nav class="nav">
            <button class="nav-btn ${state.nav === 'trade' ? 'active' : ''}" data-nav="trade">Trade</button>
            <button class="nav-btn ${state.nav === 'feed' ? 'active' : ''}" data-nav="feed">Feed</button>
            <button class="nav-btn ${state.nav === 'leaderboard' ? 'active' : ''}" data-nav="leaderboard">Leaderboard</button>
            <button class="nav-btn ${state.nav === 'portfolio' ? 'active' : ''}" data-nav="portfolio">Portfolio</button>
          </nav>
          <div class="header-spacer"></div>
          <div class="header-stats">
            <div class="stat"><div class="stat-label">24h Volume</div><div class="stat-value">$2.84M</div></div>
            <div class="stat"><div class="stat-label">Your P&L</div><div class="stat-value ${pnl >= 0 ? 'up' : 'down'}">${pnl >= 0 ? '+' : ''}${formatUSD(pnl)}</div></div>
          </div>
          <div class="mode-toggle">
            <button class="mode-btn ${state.avatarMode === 'full' ? 'active' : ''}" data-mode="full">Full</button>
            <button class="mode-btn ${state.avatarMode === 'small' ? 'active' : ''}" data-mode="small">Small</button>
            <button class="mode-btn ${state.avatarMode === 'off' ? 'active' : ''}" data-mode="off">Off</button>
          </div>
          <button class="wallet-btn ${state.connected ? 'connected' : ''}" id="wallet-btn">${state.connected ? truncAddr(state.address) : 'Connect Wallet'}</button>
        </header>
        <div class="main-content">
          ${state.nav === 'trade' ? renderTradeContent() : ''}
          ${state.nav === 'feed' ? renderFeedPage() : ''}
          ${state.nav === 'leaderboard' ? renderLeaderboardPage() : ''}
          ${state.nav === 'portfolio' ? renderPortfolioPage() : ''}
        </div>
      </div>
      ${renderConnectionIndicator()}
      ${renderDiagnosticPanel()}
      <div class="dialogue-container ${isOffMode ? 'off-mode' : ''}">
        <div class="dialogue-box signal-${state.dialogueSignal}" id="dialogue-box">
          <div class="dialogue-name visible" id="dialogue-name">NEMESIS</div>
          <div class="dialogue-text" id="dialogue-text">${state.dialogueSignal === 'connected' ? state.currentDialogue : ''}</div>
          <div class="dialogue-continue">▼</div>
        </div>
        <div class="dialogue-portrait ${state.avatarMode === 'small' || isOffMode ? 'visible' : ''}" id="dialogue-portrait">
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
    </div>
  `
}

function renderTradeContent(): string {
  const m = getMarket()
  const timeLeft = m.expiry - Date.now()
  const price = state.orderTab === 'no' ? m.noPrice : m.yesPrice
  const payout = state.stake / price
  const profit = payout - state.stake
  const isLobby = state.orderTab === 'lobby'
  const isDuel = state.orderTab === 'duel'
  const openCount = state.positions.filter(p => p.status === 'open').length
  const orderCount = state.orders.filter(o => o.status === 'pending').length

  let posContent = ''
  if (state.posTab === 'positions') {
    const open = state.positions.filter(p => p.status === 'open')
    posContent = open.length === 0 ? '<div class="empty">No open positions</div>' :
      open.map(p => `<div class="pos-item" data-id="${p.id}"><div class="pos-header"><span class="pos-market">${p.market}</span><span class="pos-side ${p.side}">${p.side.toUpperCase()}</span></div><div class="pos-details"><span>${formatUSD(p.size)} @ ${(p.entry * 100).toFixed(0)}¢</span><span class="pos-pnl ${p.pnl >= 0 ? 'up' : 'down'}">${p.pnl >= 0 ? '+' : ''}${formatUSD(p.pnl)}</span></div><button class="pos-close" data-id="${p.id}">Close Position</button></div>`).join('')
  } else if (state.posTab === 'orders') {
    const pending = state.orders.filter(o => o.status === 'pending')
    posContent = pending.length === 0 ? '<div class="empty">No pending orders</div>' :
      pending.map(o => `<div class="pos-item"><div class="pos-header"><span class="pos-market">${o.market}</span><span class="pos-side ${o.side}">${o.side.toUpperCase()}</span></div><div class="pos-details"><span>${formatUSD(o.size)} @ ${(o.price * 100).toFixed(0)}¢</span><span>Pending</span></div></div>`).join('')
  } else {
    posContent = state.history.length === 0 ? '<div class="empty">No trade history</div>' :
      state.history.map(h => `<div class="pos-item"><div class="pos-header"><span class="pos-market">${h.market}</span><span class="pos-side ${h.side}">${h.side.toUpperCase()}</span></div><div class="pos-details"><span>${formatUSD(h.size)}</span><span class="pos-pnl ${h.pnl >= 0 ? 'up' : 'down'}">${h.pnl >= 0 ? '+' : ''}${formatUSD(h.pnl)}</span></div></div>`).join('')
  }

  return `
    <div class="avatar-area mode-${state.avatarMode}">
      <img id="avatar-img" class="avatar-img" src="nemesis-chan/${state.currentEmotion}.png" alt="Nemesis">
    </div>
    <div class="panels-container">
      <div class="panel ${state.panelStates.market ? '' : 'collapsed'}">
        <div class="panel-head" data-panel="market"><span class="panel-title">Market</span><span class="panel-toggle">${ICONS.chevron}</span></div>
        <div class="panel-body">
          <button class="market-btn" id="market-btn">
            <div class="market-asset">${m.asset}</div>
            <div class="market-question">${m.question}</div>
            <div class="market-prices"><span class="price-yes">${(m.yesPrice * 100).toFixed(0)}¢ YES</span><span class="price-no">${(m.noPrice * 100).toFixed(0)}¢ NO</span></div>
            <div class="market-meta">${formatTime(timeLeft)} remaining · Vol: ${formatCompact(m.volume)}</div>
          </button>
        </div>
      </div>
      <div class="panel ${state.panelStates.order ? '' : 'collapsed'}">
        <div class="panel-head" data-panel="order"><span class="panel-title">Place Order</span><span class="panel-toggle">${ICONS.chevron}</span></div>
        <div class="panel-body">
          <div class="order-tabs">
            <button class="order-tab yes ${state.orderTab === 'yes' ? 'active' : ''}" data-tab="yes">${ICONS.check} YES</button>
            <button class="order-tab no ${state.orderTab === 'no' ? 'active' : ''}" data-tab="no">${ICONS.cross} NO</button>
            <button class="order-tab lobby ${state.orderTab === 'lobby' ? 'active' : ''}" data-tab="lobby">${ICONS.lobby} Lobby</button>
            <button class="order-tab duel ${state.orderTab === 'duel' ? 'active' : ''}" data-tab="duel">${ICONS.swords} 1v1</button>
          </div>
          <div class="form-group">
            <label class="form-label">Stake Amount</label>
            <div class="form-input-wrap"><input type="number" class="form-input" id="stake-input" value="${state.stake}" min="1" step="10"><span class="form-suffix">USDC</span></div>
            <input type="range" class="stake-slider" id="stake-slider" min="10" max="1000" step="10" value="${state.stake}">
          </div>
          ${(isLobby || isDuel) ? `<div class="form-group"><label class="form-label">${isLobby ? 'Invite Friend (Address/ENS)' : 'Challenge Rival (Address/ENS)'}</label><div class="form-input-wrap"><input type="text" class="form-input" id="target-input" placeholder="0x... or name.eth" value="${state.targetAddress}"></div></div>` : ''}
          <div class="order-summary">
            <div class="summary-row"><span class="label">Price</span><span class="value">${(price * 100).toFixed(0)}¢</span></div>
            <div class="summary-row"><span class="label">Shares</span><span class="value">${payout.toFixed(2)}</span></div>
            <div class="summary-row"><span class="label">Potential Profit</span><span class="value profit">+${formatUSD(profit)}</span></div>
          </div>
          <button class="order-btn ${state.orderTab}" id="order-btn" ${state.processing ? 'disabled' : ''}>${state.processing ? 'Processing...' : getOrderButtonText()}</button>
        </div>
      </div>
      <div class="panel ${state.panelStates.positions ? '' : 'collapsed'}">
        <div class="panel-head" data-panel="positions"><span class="panel-title">Positions</span><span class="panel-toggle">${ICONS.chevron}</span></div>
        <div class="panel-body">
          <div class="pos-tabs">
            <button class="pos-tab ${state.posTab === 'positions' ? 'active' : ''}" data-tab="positions">Open <span class="cnt">${openCount}</span></button>
            <button class="pos-tab ${state.posTab === 'orders' ? 'active' : ''}" data-tab="orders">Orders <span class="cnt">${orderCount}</span></button>
            <button class="pos-tab ${state.posTab === 'history' ? 'active' : ''}" data-tab="history">History</button>
          </div>
          <div class="pos-list">${posContent}</div>
        </div>
      </div>
    </div>
  `
}

function getOrderButtonText(): string {
  switch (state.orderTab) {
    case 'yes': return 'BUY YES'
    case 'no': return 'BUY NO'
    case 'lobby': return 'CREATE LOBBY'
    case 'duel': return 'SEND CHALLENGE'
  }
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

function renderMarketModal(): string {
  const filters = ['all', 'crypto']
  const filtered = state.marketFilter === 'all' ? state.markets : state.markets.filter(m => m.category === state.marketFilter)
  return `<div class="modal" id="market-modal"><div class="modal-box"><div class="modal-head"><span class="modal-title">:: Select Market ::</span><button class="modal-close" id="modal-close">×</button></div><div class="modal-filters">${filters.map(f => `<button class="modal-filter ${state.marketFilter === f ? 'active' : ''}" data-filter="${f}">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`).join('')}</div><div class="modal-list">${filtered.map(m => `<div class="modal-option ${m.id === state.selectedMarket ? 'selected' : ''}" data-id="${m.id}"><div class="modal-option-info"><span class="modal-option-asset">${m.asset}</span><span class="modal-option-q">${m.question}</span></div><div class="modal-option-prices"><span class="price-yes">${(m.yesPrice * 100).toFixed(0)}¢</span><span class="price-no">${(m.noPrice * 100).toFixed(0)}¢</span></div></div>`).join('')}</div></div></div>`
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

function setupDelegatedEvents() {
  const app = document.getElementById('app')
  if (!app) return

  app.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    if (state.scene === 'title' && target.closest('#title-scene')) {
      handleTitleClick()
      return
    }

    const navBtn = target.closest('.nav-btn') as HTMLElement | null
    if (navBtn) {
      const nav = navBtn.dataset.nav as NavTab
      if (state.nav !== nav) {
        state.nav = nav
        playSound([600])
        render()
      }
      return
    }

    const modeBtn = target.closest('.mode-btn') as HTMLElement | null
    if (modeBtn) {
      const mode = modeBtn.dataset.mode as AvatarMode
      if (state.avatarMode !== mode) {
        const prevMode = state.avatarMode
        state.avatarMode = mode
        playSound([500])

        if (mode === 'off' && prevMode !== 'off') {
          disconnectSignal()
        }
        else if (mode !== 'off' && prevMode === 'off') {
          connectSignal(() => {
            showRandomDialogue('idle')
          })
        }

        render()
      }
      return
    }

    if (target.closest('#wallet-btn')) {
      if (!state.connected) {
        state.connected = true
        state.address = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12'
        playSound([523, 659, 784])
        toast('Wallet connected!', 'success')
        render()
        setTimeout(() => showRandomDialogue('connect'), 0)
      }
      return
    }

    if (target.closest('#dialogue-portrait')) {
      handlePortraitClick()
      return
    }

    if (target.closest('#connection-indicator')) {
      state.showDiagnosticPanel = !state.showDiagnosticPanel
      playSound([500])
      render()
      return
    }

    if (target.closest('#diagnostic-close')) {
      state.showDiagnosticPanel = false
      render()
      return
    }

    if (state.scene === 'main') {
      if (target.closest('#dialogue-box')) {
        handleDialogueClick()
        return
      }
      if (target.closest('.avatar-area') && state.avatarMode === 'full') {
        handleDialogueClick()
        return
      }
    }

    const panelHead = target.closest('.panel-head') as HTMLElement | null
    if (panelHead) {
      const panel = panelHead.dataset.panel as keyof typeof state.panelStates
      if (panel && state.panelStates[panel] !== undefined) {
        state.panelStates[panel] = !state.panelStates[panel]
        render()
      }
      return
    }

    if (target.closest('#market-btn')) {
      state.showMarketModal = true
      playSound([500])
      render()
      return
    }

    const orderTab = target.closest('.order-tab') as HTMLElement | null
    if (orderTab) {
      const tab = orderTab.dataset.tab as OrderTab
      if (state.orderTab !== tab) {
        state.orderTab = tab
        playSound([600])
        render()
        if (tab === 'lobby') setTimeout(() => showRandomDialogue('lobby'), 0)
        else if (tab === 'duel') setTimeout(() => showRandomDialogue('duel'), 0)
      }
      return
    }

    if (target.closest('#order-btn')) {
      handlePlaceOrder()
      return
    }

    const posTab = target.closest('.pos-tab') as HTMLElement | null
    if (posTab) {
      const tab = posTab.dataset.tab as PosTab
      if (state.posTab !== tab) {
        state.posTab = tab
        playSound([500])
        render()
      }
      return
    }

    const posClose = target.closest('.pos-close') as HTMLElement | null
    if (posClose) {
      e.stopPropagation()
      const id = posClose.dataset.id
      if (id) handleClosePosition(id)
      return
    }

    if (target.id === 'market-modal') {
      state.showMarketModal = false
      render()
      return
    }

    if (target.closest('#modal-close')) {
      state.showMarketModal = false
      render()
      return
    }

    const modalFilter = target.closest('.modal-filter') as HTMLElement | null
    if (modalFilter) {
      state.marketFilter = modalFilter.dataset.filter || 'all'
      render()
      return
    }

    const modalOption = target.closest('.modal-option') as HTMLElement | null
    if (modalOption) {
      state.selectedMarket = modalOption.dataset.id || state.markets[0].id
      state.showMarketModal = false
      playSound([500])
      render()
      return
    }
  })

  app.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement

    if (target.id === 'stake-input') {
      state.stake = parseFloat(target.value) || 10
      const slider = document.getElementById('stake-slider') as HTMLInputElement
      if (slider && slider !== document.activeElement) {
        slider.value = String(state.stake)
      }
      render()
      return
    }

    if (target.id === 'stake-slider') {
      state.stake = parseFloat(target.value) || 10
      const input = document.getElementById('stake-input') as HTMLInputElement
      if (input && input !== document.activeElement) {
        input.value = String(state.stake)
      }
      render()
      return
    }

    if (target.id === 'target-input') {
      state.targetAddress = target.value
      return
    }
  })
}

async function handlePlaceOrder() {
  if (!state.connected) { toast('Connect wallet first!', 'error'); return }
  if (state.processing) return

  state.processing = true
  setEmotion('inquisitive')
  render()
  setTimeout(() => showDialogue({ text: "Processing your order...", emotion: 'inquisitive', showName: true }), 0)

  await new Promise(r => setTimeout(r, 1200))

  const m = getMarket()
  const side = state.orderTab === 'no' ? 'no' : 'yes'
  const price = side === 'yes' ? m.yesPrice : m.noPrice
  state.positions.push({
    id: `p${Date.now()}`,
    marketId: m.id,
    market: m.question,
    side: side as 'yes' | 'no',
    size: state.stake,
    entry: price,
    current: price,
    pnl: 0,
    type: state.orderTab === 'lobby' ? 'lobby' : state.orderTab === 'duel' ? 'duel' : 'standard',
    status: 'open'
  })

  state.processing = false
  playSound([523, 659, 784, 1047])
  toast('Order filled!', 'success')
  render()
  setTimeout(() => showRandomDialogue('filled'), 0)
}

function handleClosePosition(id: string) {
  const pos = state.positions.find(p => p.id === id)
  if (!pos) return

  pos.status = 'closed'
  state.history.unshift({ ...pos })
  state.positions = state.positions.filter(p => p.id !== id)

  playSound([400, 300])
  toast('Position closed!', 'success')
  render()
  setTimeout(() => showRandomDialogue('closed'), 0)
}

function init() {
  initData()
  initConnectionMonitor()
  setupDelegatedEvents()
  render()
  console.log('NEMESIS initialized')
  console.log('Every trader needs a Nemesis.')
}

init()
