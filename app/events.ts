import { state } from '@app/state'
import { render } from '@app/render'
import { playSound } from '@app/audio'
import { toast, getMarket, formatUSD } from '@app/utils'
import {
  connectSignal,
  disconnectSignal,
  setEmotion,
  skipTypewriter,
  showDialogue,
  showRandomDialogue,
  clearDismissTimer,
  togglePausePlay,
  skipDialogue,
  toggleAutoplay,
  setAdvanceIntroCallback
} from '@app/signal'
import { INTRO_DIALOGUE, RETURNING_INTRO_DIALOGUE, DIALOGUE } from '@app/dialogue'
import { saveUserData, clearUserData } from '@app/storage'
import {
  connectWallet,
  disconnectWallet,
  WalletError,
  getErrorMessage,
} from '@app/wallet'
import type { NavTab, OrderTab, PosTab, AvatarMode } from '@app/types'
import { hyperliquidWS } from '@app/websocket'

function openOrderBook(coin: string) {
  state.showOrderBook = true
  hyperliquidWS.subscribeToOrderBook(coin)
  playSound([500])
  render()
}

function closeOrderBook() {
  state.showOrderBook = false
  hyperliquidWS.unsubscribeFromOrderBook()
  render()
}

function getIntroDialogue() {
  return state.isReturningPlayer ? RETURNING_INTRO_DIALOGUE : INTRO_DIALOGUE
}

function advanceIntro(forceSkip = false) {
  // If typing and not force skipping, just finish current text
  if (state.isTyping && !forceSkip) { skipTypewriter(); return }

  // If force skipping while typing, we still advance to next
  const introDialogue = getIntroDialogue()
  state.introIndex++
  if (state.introIndex >= introDialogue.length) {
    state.introComplete = true
    state.scene = 'main'
    playSound([523, 659, 784])
    saveUserData()
    render()
    if (!state.tutorialComplete && !state.tabTutorialShown.trade) {
      state.tabTutorialShown.trade = true
      saveUserData()
      setTimeout(() => showRandomDialogue('tutorialTrade'), 500)
    } else {
      setTimeout(() => showRandomDialogue('idle'), 500)
    }
  } else {
    showDialogue(introDialogue[state.introIndex])
  }
}

function handleTitleClick() {
  if (state.scene !== 'title') return

  if (!state.introStarted) {
    state.introStarted = true
    playSound([500])
    connectSignal(() => {
      showDialogue(getIntroDialogue()[0])
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

async function handleWalletClick() {
  if (state.isConnecting) return

  if (!state.connected) {
    state.isConnecting = true
    state.walletError = null
    render()

    try {
      const result = await connectWallet()

      state.connected = true
      state.address = result.address
      state.chainId = result.chainId as (999 | 998)
      state.isConnecting = false
      state.connectorName = result.connector
      state.walletError = null

      playSound([523, 659, 784])
      toast('Wallet connected!', 'success')
      render()

      setTimeout(() => showRandomDialogue('walletConnected'), 100)

    } catch (error) {
      state.isConnecting = false

      if (error instanceof WalletError) {
        state.walletError = error.type

        if (error.type !== 'USER_REJECTED') {
          toast(getErrorMessage(error), 'error')
        }
      } else {
        state.walletError = 'UNKNOWN'
        toast('Connection failed. Please try again.', 'error')
      }

      render()
    }
  } else {
    try {
      await disconnectWallet()

      state.connected = false
      state.address = ''
      state.chainId = null
      state.connectorName = null
      state.walletError = null

      playSound([400, 300])
      toast('Wallet disconnected')
      render()

      setTimeout(() => showRandomDialogue('walletDisconnected'), 100)

    } catch (error) {
      console.error('[Wallet] Disconnect failed:', error)
      state.connected = false
      state.address = ''
      state.chainId = null
      render()
    }
  }
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

export function setupDelegatedEvents() {
  const app = document.getElementById('app')
  if (!app) return

  // Set up callback for skip button to advance intro (forceSkip = true)
  setAdvanceIntroCallback(() => {
    if (state.scene === 'title' && state.introStarted && !state.introComplete) {
      advanceIntro(true) // Force skip to next dialogue immediately
    }
  })

  app.addEventListener('click', (e) => {
    const target = e.target as HTMLElement

    if (state.scene === 'selection') {
      if (target.closest('#btn-continue')) {
        state.scene = 'title'
        playSound([523, 659, 784])
        render()
        // For returning users, automatically start the welcome back dialogue
        setTimeout(() => {
          state.introStarted = true
          const introDialogue = getIntroDialogue()
          const firstLine = introDialogue[0]
          if (firstLine) {
            connectSignal(() => {
              showDialogue(firstLine)
            })
          }
        }, 300)
        return
      }
      if (target.closest('#btn-new-game')) {
        clearUserData()
        state.isReturningPlayer = false
        state.tutorialComplete = false
        state.tabTutorialShown = {
          trade: false,
          feed: false,
          leaderboard: false,
          portfolio: false,
        }
        state.scene = 'title'
        playSound([400, 500, 600])
        render()
        return
      }
      return
    }

    // Dialogue control buttons - handle BEFORE scene-level click handlers
    if (target.closest('#dialogue-pause-play')) {
      e.stopPropagation()
      togglePausePlay()
      playSound([500])
      return
    }

    if (target.closest('#dialogue-skip')) {
      e.stopPropagation()
      skipDialogue()
      playSound([600])
      return
    }

    if (target.closest('#dialogue-autoplay')) {
      e.stopPropagation()
      toggleAutoplay()
      playSound([500])
      return
    }

    // Handle "Enter Nemesis" button for first-time users
    if (target.closest('#enter-btn')) {
      handleTitleClick()
      return
    }

    if (state.scene === 'title' && target.closest('#title-scene') && !target.closest('.dialogue-controls')) {
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

        const tabName = nav.charAt(0).toUpperCase() + nav.slice(1)

        if (!state.tutorialComplete && !state.tabTutorialShown[nav]) {
          state.tabTutorialShown[nav] = true
          saveUserData()
          const tutorialKey = `tutorial${tabName}` as keyof typeof DIALOGUE
          setTimeout(() => showRandomDialogue(tutorialKey), 300)
        } else {
          const idleKey = `idle${tabName}` as keyof typeof DIALOGUE
          setTimeout(() => showRandomDialogue(idleKey), 300)
        }
      }
      return
    }

    // Avatar mode buttons in dialogue controls
    const avatarModeBtn = target.closest('.avatar-mode-btn') as HTMLElement | null
    if (avatarModeBtn) {
      e.stopPropagation() // Prevent dialogue box click
      const mode = avatarModeBtn.dataset.mode as AvatarMode
      if (state.avatarMode !== mode) {
        const prevMode = state.avatarMode
        state.avatarMode = mode
        playSound([500])
        saveUserData()

        // 'off' mode only hides dialogue, avatar stays visible
        if (mode === 'off' && prevMode !== 'off') {
          disconnectSignal()
        }
        else if (mode !== 'off' && prevMode === 'off') {
          // Coming back from off mode - show dialogue again
          connectSignal(() => {
            showRandomDialogue('idle')
          })
        }

        render()
      }
      return
    }

    if (target.closest('#wallet-btn')) {
      handleWalletClick()
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
      if (target.closest('#dialogue-box') && !target.closest('.dialogue-controls')) {
        handleDialogueClick()
        return
      }
      // Avatar click handling for all modes
      if (target.closest('.avatar-area')) {
        // In off mode, clicking avatar brings back dialogue
        if (state.avatarMode === 'off') {
          state.avatarMode = 'full' // Switch back to full mode
          playSound([500])
          saveUserData()
          connectSignal(() => {
            showRandomDialogue('idle')
          })
          render()
          return
        }
        // In full or head mode, clicking avatar shows next dialogue
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
      const newMarket = modalOption.dataset.id || state.markets[0].id
      if (state.selectedMarket !== newMarket) {
        state.selectedMarket = newMarket
        state.showMarketModal = false
        playSound([500])
        render()
        setTimeout(() => showRandomDialogue('marketChange'), 200)
      } else {
        state.showMarketModal = false
        render()
      }
      return
    }

    // Order Book handlers
    const tickerItem = target.closest('.ticker-item') as HTMLElement | null
    if (tickerItem || target.closest('#live-ticker')) {
      const coin = tickerItem?.dataset.coin || 'BTC'
      openOrderBook(coin)
      return
    }

    if (target.id === 'orderbook-modal') {
      closeOrderBook()
      return
    }

    if (target.closest('#orderbook-close')) {
      closeOrderBook()
      return
    }

    const coinTab = target.closest('.ob-coin-tab') as HTMLElement | null
    if (coinTab) {
      const coin = coinTab.dataset.coin
      if (coin && coin !== state.orderBookCoin) {
        hyperliquidWS.subscribeToOrderBook(coin)
        playSound([500])
        render()
      }
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
