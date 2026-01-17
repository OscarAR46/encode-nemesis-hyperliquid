import { state, initData } from './state'
import { render } from './render'
import { setupDelegatedEvents } from './events'
import { showRandomDialogue } from './signal'
import { connectionMonitor } from './connection'
import { initFromStorage, saveUserData } from './storage'
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

function init() {
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
