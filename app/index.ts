import { state, initData, updateWalletState } from '@app/state'
import { render } from '@app/render'
import { setupDelegatedEvents } from '@app/events'
import { showRandomDialogue } from '@app/signal'
import { connectionMonitor } from '@app/connection'
import { initFromStorage, saveUserData } from '@app/storage'
import { initWallet, onAccountChange } from '@app/wallet'
import { initWebSocket } from '@app/websocket'
import { clearAllWalletConnectData } from '@config/wagmi'
import type { ConnectionState, AnomalyPattern } from '@app/connection'

/**
 * Global error handler for WalletConnect "session topic doesn't exist" errors
 * These errors occur when the relay sends messages for sessions that were cleared
 */
function setupWalletConnectErrorHandler(): void {
  if (typeof window === 'undefined') return

  let errorCount = 0
  const errorThreshold = 3
  const resetInterval = 5000

  // Reset error count periodically
  setInterval(() => { errorCount = 0 }, resetInterval)

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason)

    if (message.includes('session topic') ||
        message.includes('No matching key') ||
        message.includes("topic doesn't exist")) {
      event.preventDefault() // Prevent console error spam

      errorCount++
      console.warn('[WalletConnect] Session error suppressed:', message.slice(0, 100))

      // If too many errors, clear sessions and reload
      if (errorCount >= errorThreshold) {
        console.error('[WalletConnect] Too many session errors, clearing sessions and reloading...')
        clearAllWalletConnectData()
        window.location.reload()
      }
    }
  })

  window.addEventListener('error', (event) => {
    const message = event.message || ''

    if (message.includes('session topic') ||
        message.includes('No matching key') ||
        message.includes("topic doesn't exist")) {
      event.preventDefault()

      errorCount++
      console.warn('[WalletConnect] Session error suppressed:', message.slice(0, 100))

      if (errorCount >= errorThreshold) {
        console.error('[WalletConnect] Too many session errors, clearing sessions and reloading...')
        clearAllWalletConnectData()
        window.location.reload()
      }
    }
  })
}

// Set up error handler BEFORE anything else
setupWalletConnectErrorHandler()

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js')
    .then((reg) => console.log('[SW] Registered, scope:', reg.scope))
    .catch((err) => console.warn('[SW] Registration failed:', err))
}

function initConnectionMonitor() {
  connectionMonitor.init({
    healthCheckIntervalMs: 500,
    serverTimeoutMs: 500,  // Increased from 100ms - too aggressive, caused false failures
    staleFeedThresholdMs: 2000,
    latencyWarningMs: 100,
    latencyCriticalMs: 500,
    failureThreshold: 1,
    recoveryThreshold: 1,  // Match failure threshold for snappy state transitions
  })

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
        if (event.previous === 'CONNECTED') showRandomDialogue('connectionDegraded')
        break
      case 'UNSTABLE':
        showRandomDialogue('connectionUnstable')
        break
      case 'DISCONNECTED':
        showRandomDialogue('connectionLost')
        break
      case 'CONNECTED':
        if (event.previous !== 'CONNECTED') showRandomDialogue('connectionRestored')
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
    if (state.showDiagnosticPanel) render()
  })
}

async function initWalletConnection() {
  try {
    const walletState = await initWallet()
    
    if (walletState.connected) {
      updateWalletState(walletState)
      console.log('[Wallet] Restored:', walletState.address?.slice(0, 10) + '...')
    }
    
    onAccountChange((newState) => {
      updateWalletState(newState)
      render()
      if (!newState.connected && state.connected) {
        setTimeout(() => showRandomDialogue('walletDisconnected'), 100)
      }
    })
  } catch (error) {
    console.error('[Wallet] Init failed:', error)
  }
}

async function init() {
  registerServiceWorker()  // Earliest possible - starts precaching all assets
  const isReturning = initFromStorage()
  initData()
  initConnectionMonitor()
  initWebSocket()
  setupDelegatedEvents()

  state.scene = isReturning ? 'selection' : 'title'
  render()

  initWalletConnection()

  window.addEventListener('beforeunload', saveUserData)
  setInterval(saveUserData, 30000)

  console.log('[Nemesis] Ready.', isReturning ? 'Welcome back.' : '')
}

init()
