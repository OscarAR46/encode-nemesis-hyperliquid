import { state, initData, updateWalletState } from '@app/state'
import { render } from '@app/render'
import { setupDelegatedEvents } from '@app/events'
import { showRandomDialogue } from '@app/signal'
import { connectionMonitor } from '@app/connection'
import { initFromStorage, saveUserData } from '@app/storage'
import { initWallet, onAccountChange } from '@app/wallet'
import type { ConnectionState, AnomalyPattern } from '@app/connection'

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

async function initWalletConnection() {
  try {
    const walletState = await initWallet()
    
    if (walletState.connected) {
      updateWalletState(walletState)
      console.log('[Wallet] Restored session:', walletState.address?.slice(0, 10) + '...')
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
  const isReturning = initFromStorage()
  initData()
  initConnectionMonitor()
  setupDelegatedEvents()

  if (isReturning) {
    state.scene = 'selection'
  } else {
    state.scene = 'title'
  }

  render()

  initWalletConnection()

  window.addEventListener('beforeunload', saveUserData)
  setInterval(saveUserData, 30000)

  console.log('NEMESIS initialized')
  console.log('Every trader needs a Nemesis.')
  if (isReturning) {
    console.log('Welcome back, trader.')
  }
}

init()
