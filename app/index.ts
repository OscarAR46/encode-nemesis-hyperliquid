import { state, initData, updateWalletState } from './state'
import { render } from './render'
import { setupDelegatedEvents } from './events'
import { showRandomDialogue } from './signal'
import { connectionMonitor } from './connection'
import { initFromStorage, saveUserData } from './storage'
import { initWallet, onAccountChange } from './wallet'
import type { ConnectionState, AnomalyPattern } from './connection'

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

/**
 * Initialize wallet connection and watch for changes
 */
async function initWalletConnection() {
  try {
    // Check for existing connection (from localStorage)
    const walletState = await initWallet()
    
    if (walletState.connected) {
      // Restore wallet state
      updateWalletState(walletState)
      console.log('[Wallet] Restored session:', walletState.address?.slice(0, 10) + '...')
    }
    
    // Watch for account changes (user switches wallet, disconnects, etc.)
    onAccountChange((newState) => {
      updateWalletState(newState)
      render()
      
      // Show dialogue on disconnect if we were connected
      if (!newState.connected && state.connected) {
        setTimeout(() => showRandomDialogue('walletDisconnected'), 100)
      }
    })
    
  } catch (error) {
    console.error('[Wallet] Init failed:', error)
  }
}

async function init() {
  const isReturning = initFromStorage()
  initData()
  initConnectionMonitor()
  setupDelegatedEvents()

  // Set initial scene based on returning status
  if (isReturning) {
    state.scene = 'selection'
  } else {
    state.scene = 'title'
  }

  render()

  // Initialize wallet (async, won't block render)
  initWalletConnection()

  // Save user data periodically and on page unload
  window.addEventListener('beforeunload', saveUserData)
  setInterval(saveUserData, 30000) // Save every 30 seconds

  console.log('NEMESIS initialized')
  console.log('Every trader needs a Nemesis.')
  if (isReturning) {
    console.log('Welcome back, trader.')
  }
}

init()
