import { state, DEFAULT_LAYOUT, DEFAULT_BRIDGE_STATE, DEFAULT_BATTLE_STATE } from '@app/state'
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
  getWalletState,
  WalletError,
  getErrorMessage,
} from '@app/wallet'
import type { NavTab, OrderTab, PosTab, AvatarMode, WidgetId, SourceToken, BattleMode, BattleDuration } from '@app/types'
import { hyperliquidWS } from '@app/websocket'
import { toggleEditMode, moveWidgetUp, moveWidgetDown, resetLayout, initDragDrop } from '@app/layout'
import { SOURCE_CHAINS, COMMON_TOKENS } from '@config/chains'
import { initLiFi, getQuote, executeBridge } from '@app/bridge'
import {
  authenticatePear,
  isPearAuthenticated,
  createBattlePosition,
  getAgentWallet,
  getThemeById,
  DEFAULT_SHORT_ASSETS,
} from '@app/pear'
import { parseUnits, formatUnits } from 'viem'

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

/**
 * Handles wallet connection for returning players who lost their session
 */
async function handleReturningPlayerWalletConnect() {
  if (state.isConnecting) return

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
    toast('Wallet reconnected!', 'success')
    render()

    // Now proceed as returning player
    setTimeout(() => proceedAsReturningPlayer(), 200)

  } catch (error) {
    state.isConnecting = false

    if (error instanceof WalletError) {
      state.walletError = error.type

      if (error.type !== 'USER_REJECTED') {
        toast(getErrorMessage(error), 'error')
      } else {
        toast('Connect your wallet to continue', 'error')
      }
    } else {
      state.walletError = 'UNKNOWN'
      toast('Connection failed. Please try again.', 'error')
    }

    render()
  }
}

/**
 * Proceeds to main screen as returning player after wallet is confirmed
 */
function proceedAsReturningPlayer() {
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

// ============================================
// Bridge Event Handlers (LI.FI Integration)
// ============================================

function handleBridgeChainSelect(chainId: number) {
  state.bridge.sourceChainId = chainId
  state.bridge.sourceToken = null  // Reset token when chain changes
  state.bridge.quote = null
  state.bridge.quoteError = null
  state.showBridgePanel = false
  playSound([500])
  render()
}

function handleBridgeTokenSelect(token: SourceToken) {
  state.bridge.sourceToken = token
  state.bridge.quote = null
  state.bridge.quoteError = null
  playSound([500])
  render()

  // Auto-fetch quote if amount is already entered
  if (state.bridge.amount && parseFloat(state.bridge.amount) > 0) {
    handleBridgeGetQuote()
  }
}

function handleBridgeAmountChange(amount: string) {
  state.bridge.amount = amount
  state.bridge.quote = null
  state.bridge.quoteError = null
  render()
}

function handleBridgeDestTokenSelect(token: string) {
  state.bridge.destinationToken = token
  state.bridge.quote = null
  state.bridge.quoteError = null
  playSound([500])
  render()
}

function handleBridgeMaxClick() {
  if (state.bridge.sourceToken?.balance) {
    state.bridge.amount = state.bridge.sourceToken.balance
    state.bridge.quote = null
    render()
    handleBridgeGetQuote()
  }
}

async function handleBridgeGetQuote() {
  const { bridge } = state

  if (!bridge.sourceChainId || !bridge.sourceToken || !bridge.amount) {
    return
  }

  const amount = parseFloat(bridge.amount)
  if (isNaN(amount) || amount <= 0) {
    state.bridge.quoteError = 'Enter a valid amount'
    render()
    return
  }

  if (!state.connected || !state.address) {
    state.bridge.quoteError = 'Connect your wallet first'
    render()
    return
  }

  // Initialize LI.FI SDK
  initLiFi()

  state.bridge.isLoadingQuote = true
  state.bridge.quoteError = null
  state.bridge.quote = null
  render()

  try {
    // Convert amount to wei
    const fromAmount = parseUnits(bridge.amount, bridge.sourceToken.decimals).toString()

    // Get destination token address (HYPE native or USDC)
    const toToken = bridge.destinationToken === 'HYPE'
      ? '0x0000000000000000000000000000000000000000'  // Native token
      : '0x...'  // TODO: USDC address on HyperEVM

    const quoteResult = await getQuote({
      fromChainId: bridge.sourceChainId,
      toChainId: 999,  // HyperEVM
      fromToken: bridge.sourceToken.address,
      toToken,
      fromAmount,
      fromAddress: state.address,
    })

    state.bridge.quote = {
      fromAmount: quoteResult.fromAmount,
      toAmount: formatUnits(BigInt(quoteResult.toAmount), 18),  // Assuming 18 decimals
      toAmountMin: formatUnits(BigInt(quoteResult.toAmountMin), 18),
      estimatedTime: quoteResult.estimatedTime,
      gasCosts: quoteResult.gasCosts,
      feeCosts: quoteResult.feeCosts,
      steps: quoteResult.steps.map(s => ({
        ...s,
        status: 'pending' as const,
      })),
      route: quoteResult.route,
    }

    playSound([500, 600])
    toast('Quote received!', 'success')

  } catch (error: any) {
    console.error('[Bridge] Quote failed:', error)
    state.bridge.quoteError = error.message || 'Failed to get quote. Try again.'
    playSound([300])
  } finally {
    state.bridge.isLoadingQuote = false
    render()
  }
}

async function handleBridgeExecute() {
  const { bridge } = state

  if (!bridge.quote || !bridge.quote.route) {
    toast('Get a quote first', 'error')
    return
  }

  if (!state.connected) {
    toast('Connect your wallet first', 'error')
    return
  }

  state.bridge.status = 'pending'
  state.bridge.steps = bridge.quote.steps.map(s => ({ ...s, status: 'pending' as const }))
  state.bridge.error = null
  state.bridge.txHash = null
  playSound([500, 600, 700])
  render()

  try {
    const result = await executeBridge(bridge.quote.route, {
      onStepUpdate: (step, index, total) => {
        state.bridge.currentStepIndex = index
        state.bridge.steps = state.bridge.steps.map((s, i) => ({
          ...s,
          status: i < index ? 'complete' : i === index ? 'active' : 'pending',
        }))
        render()
      },
      onTxHash: (txHash, chainId) => {
        state.bridge.txHash = txHash
        render()
      },
      onApprovalNeeded: () => {
        state.bridge.status = 'approving'
        render()
      },
      onApprovalComplete: () => {
        state.bridge.status = 'pending'
        render()
      },
      onBridgeStart: () => {
        state.bridge.status = 'confirming'
        render()
      },
      onBridgeComplete: (toAmount) => {
        state.bridge.status = 'success'
        state.bridge.finalAmount = toAmount
        state.bridge.steps = state.bridge.steps.map(s => ({ ...s, status: 'complete' as const }))
        playSound([523, 659, 784, 1047])
        toast('Bridge complete!', 'success')
        render()
      },
      onError: (error) => {
        state.bridge.status = 'failed'
        state.bridge.error = error.message
        playSound([200, 150])
        toast(error.message, 'error')
        render()
      },
    })

    if (result.success) {
      state.bridge.status = 'success'
      state.bridge.finalAmount = result.toAmount || bridge.quote.toAmount
    }

  } catch (error: any) {
    console.error('[Bridge] Execution failed:', error)
    state.bridge.status = 'failed'
    state.bridge.error = error.message || 'Bridge failed. Please try again.'
    playSound([200, 150])
    toast(error.message || 'Bridge failed', 'error')
  }

  render()
}

function handleBridgeReset() {
  state.bridge = structuredClone(DEFAULT_BRIDGE_STATE)
  playSound([400, 500])
  render()
}

function handleBridgeRetry() {
  state.bridge.status = 'idle'
  state.bridge.error = null
  state.bridge.txHash = null
  state.bridge.steps = []
  render()
  handleBridgeGetQuote()
}

function toggleBridgeChainDropdown() {
  state.showBridgePanel = !state.showBridgePanel
  render()
}

// ============================================
// Battle Event Handlers (Pear Protocol)
// ============================================

function handleBattleModeSelect(mode: BattleMode) {
  if (state.battle.selectedMode === mode) return
  state.battle.selectedMode = mode
  playSound([500, 600])
  render()

  // Show mode-specific dialogue
  const dialogueKey = `battle${mode.charAt(0).toUpperCase() + mode.slice(1)}Mode` as keyof typeof DIALOGUE
  setTimeout(() => showRandomDialogue(dialogueKey), 100)
}

function handleBattleThemeSelect(themeId: string) {
  state.battle.selectedTheme = themeId
  state.battle.showThemeSelector = false
  playSound([500, 600, 700])
  render()

  // Show theme-specific dialogue
  const theme = getThemeById(themeId)
  if (theme) {
    if (themeId.includes('ai')) {
      setTimeout(() => showRandomDialogue('battleAiTheme'), 100)
    } else if (themeId.includes('meme')) {
      setTimeout(() => showRandomDialogue('battleMemeTheme'), 100)
    } else if (themeId.includes('hype')) {
      setTimeout(() => showRandomDialogue('battleHypeTheme'), 100)
    } else {
      setTimeout(() => showRandomDialogue('battleThemeSelected'), 100)
    }
  }
}

function handleBattleDurationSelect(duration: BattleDuration) {
  state.battle.selectedDuration = duration
  playSound([500])
  render()
}

function handleBattleLeverageSelect(leverage: number) {
  state.battle.leverage = leverage
  playSound([500])
  render()
}

function handleBattleStakeChange(value: string) {
  const stake = parseFloat(value)
  if (!isNaN(stake) && stake >= 10) {
    state.battle.stake = stake
    render()
  }
}

function handleBattleTargetChange(value: string) {
  state.battle.targetAddress = value
}

function toggleBattleThemeSelector() {
  state.battle.showThemeSelector = !state.battle.showThemeSelector
  playSound([500])
  render()
}

function toggleActiveBattles() {
  state.battle.showActiveBattles = !state.battle.showActiveBattles
  playSound([500])
  render()
}

async function handlePearConnect() {
  if (!state.connected || !state.address) {
    toast('Connect your wallet first', 'error')
    return
  }

  if (state.battle.isAuthenticated) {
    return // Already authenticated
  }

  showRandomDialogue('pearConnecting')
  render()

  try {
    const tokens = await authenticatePear(state.address)
    state.battle.isAuthenticated = true
    state.battle.accessToken = tokens.accessToken
    state.battle.refreshToken = tokens.refreshToken
    state.battle.tokenExpiresAt = tokens.expiresAt

    // Get agent wallet
    const agentWallet = await getAgentWallet()
    state.battle.agentWallet = agentWallet

    playSound([523, 659, 784])
    toast('Connected to Pear Protocol!', 'success')
    showRandomDialogue('pearConnected')
    render()
  } catch (error: any) {
    console.error('[Battle] Pear auth failed:', error)
    state.battle.createError = error.message || 'Failed to connect to Pear'
    toast(error.message || 'Failed to connect', 'error')
    render()
  }
}

async function handleBattleSubmit() {
  const { battle } = state

  // If not authenticated, connect first
  if (!battle.isAuthenticated) {
    await handlePearConnect()
    return
  }

  // Validate inputs
  if (!battle.selectedTheme) {
    toast('Select a narrative theme first', 'error')
    return
  }

  const theme = getThemeById(battle.selectedTheme)
  if (!theme) {
    toast('Invalid theme selected', 'error')
    return
  }

  if (battle.selectedMode === 'duel' && !battle.targetAddress) {
    toast('Enter a rival address for 1v1', 'error')
    return
  }

  // Start creation
  state.battle.isCreating = true
  state.battle.createError = null
  showRandomDialogue('battleCreating')
  render()

  try {
    // Create the pair trade via Pear
    const result = await createBattlePosition(
      theme.assets,
      DEFAULT_SHORT_ASSETS,
      battle.stake,
      battle.leverage
    )

    console.log('[Battle] Position created:', result)

    // Add to active battles
    const newBattle = {
      id: result.orderId,
      mode: battle.selectedMode,
      status: 'active' as const,
      duration: battle.selectedDuration,
      createdAt: Date.now(),
      startedAt: Date.now(),
      endsAt: Date.now() + getDurationMs(battle.selectedDuration),
      stake: battle.stake,
      leverage: battle.leverage,
      challenger: {
        address: state.address,
        position: {
          longAssets: theme.assets,
          shortAssets: DEFAULT_SHORT_ASSETS,
          entryValue: battle.stake * battle.leverage,
          currentValue: battle.stake * battle.leverage,
          pnl: 0,
          pnlPercent: 0,
        },
        theme: battle.selectedTheme,
        themeName: theme.name,
        isUser: true,
      },
      pearOrderId: result.orderId,
    }

    state.battle.activeBattles.unshift(newBattle)
    state.battle.currentBattle = newBattle
    state.battle.isCreating = false

    playSound([523, 659, 784, 1047])
    toast('Battle position opened!', 'success')
    showRandomDialogue('battleCreated')
    render()

  } catch (error: any) {
    console.error('[Battle] Failed to create position:', error)
    state.battle.isCreating = false
    state.battle.createError = error.message || 'Failed to create position'
    toast(error.message || 'Failed to create battle', 'error')
    showRandomDialogue('battleError')
    render()
  }
}

function getDurationMs(duration: BattleDuration): number {
  switch (duration) {
    case '1h': return 60 * 60 * 1000
    case '4h': return 4 * 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
  }
}

function handleBattleReset() {
  state.battle = structuredClone(DEFAULT_BATTLE_STATE)
  // Preserve auth state if user is still connected
  if (isPearAuthenticated()) {
    state.battle.isAuthenticated = true
  }
  playSound([400, 500])
  render()
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
        // Check FRESH wallet state from wagmi (not cached state)
        const currentWalletState = getWalletState()

        if (!currentWalletState.connected) {
          // Show wallet session lost modal
          state.showWalletSessionModal = true
          playSound([300, 200])
          render()

          // After 3 seconds, start fade out and trigger wallet connection
          setTimeout(() => {
            // Add closing class for fade-out animation
            const overlay = document.querySelector('.wallet-session-overlay')
            if (overlay) {
              overlay.classList.add('closing')
            }

            // Trigger wallet connect slightly before modal fully fades
            setTimeout(() => {
              handleReturningPlayerWalletConnect()
            }, 200)

            // Remove modal after fade completes
            setTimeout(() => {
              state.showWalletSessionModal = false
              render()
            }, 500)
          }, 3000)
          return
        }

        // Wallet is connected - sync state and proceed
        state.connected = true
        state.address = currentWalletState.address || ''
        state.chainId = currentWalletState.chainId as (999 | 998 | null)
        state.connectorName = currentWalletState.connector

        proceedAsReturningPlayer()
        return
      }
      if (target.closest('#btn-new-game')) {
        clearUserData()

        // Always try to disconnect wallet (clears wagmi storage too)
        disconnectWallet().catch(() => {})
        state.connected = false
        state.address = ''
        state.chainId = null
        state.connectorName = null
        state.walletError = null

        // Reset layout to default
        state.layoutConfig = structuredClone(DEFAULT_LAYOUT)

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

    // Edit mode toggle button
    if (target.closest('#edit-layout-btn')) {
      toggleEditMode()
      playSound([500])
      initDragDrop()
      return
    }

    // Widget move buttons (mobile reorder)
    const moveBtn = target.closest('.widget-move-btn') as HTMLElement | null
    if (moveBtn && state.editMode) {
      e.stopPropagation()
      const action = moveBtn.dataset.action
      const widgetId = moveBtn.dataset.widget as WidgetId
      if (widgetId) {
        if (action === 'move-up') {
          moveWidgetUp(widgetId)
        } else if (action === 'move-down') {
          moveWidgetDown(widgetId)
        }
        playSound([500])
        initDragDrop()
      }
      return
    }

    // Reset layout button
    if (target.closest('#reset-layout-btn')) {
      resetLayout()
      playSound([400, 500, 600])
      toast('Layout reset to default')
      initDragDrop()
      return
    }

    const panelHead = target.closest('.panel-head') as HTMLElement | null
    if (panelHead) {
      // In edit mode, panel heads are drag handles - don't toggle collapse
      if (state.editMode) return

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

    // ============================================
    // Bridge Event Handlers (LI.FI)
    // ============================================

    // Bridge connect wallet button
    if (target.closest('#bridge-connect-btn')) {
      handleWalletClick()
      return
    }

    // Bridge chain dropdown toggle
    if (target.closest('#bridge-chain-dropdown')) {
      toggleBridgeChainDropdown()
      return
    }

    // Bridge chain selection
    const bridgeChainItem = target.closest('.bridge-dropdown-item[data-chain-id]') as HTMLElement | null
    if (bridgeChainItem) {
      const chainId = parseInt(bridgeChainItem.dataset.chainId || '0', 10)
      if (chainId) {
        handleBridgeChainSelect(chainId)
      }
      return
    }

    // Bridge token selection
    const bridgeTokenItem = target.closest('.bridge-dropdown-item[data-token-address]') as HTMLElement | null
    if (bridgeTokenItem) {
      const token: SourceToken = {
        address: bridgeTokenItem.dataset.tokenAddress || '',
        symbol: bridgeTokenItem.dataset.tokenSymbol || '',
        name: bridgeTokenItem.dataset.tokenName || '',
        decimals: parseInt(bridgeTokenItem.dataset.tokenDecimals || '18', 10),
        icon: bridgeTokenItem.dataset.tokenIcon || '',
      }
      handleBridgeTokenSelect(token)
      return
    }

    // Bridge destination token buttons
    const bridgeDestTokenBtn = target.closest('.bridge-dest-token-btn') as HTMLElement | null
    if (bridgeDestTokenBtn) {
      const token = bridgeDestTokenBtn.dataset.token
      if (token) {
        handleBridgeDestTokenSelect(token)
      }
      return
    }

    // Bridge max button
    if (target.closest('#bridge-max-btn')) {
      handleBridgeMaxClick()
      return
    }

    // Bridge quote button
    if (target.closest('#bridge-quote-btn')) {
      handleBridgeGetQuote()
      return
    }

    // Bridge execute button
    if (target.closest('#bridge-execute-btn')) {
      handleBridgeExecute()
      return
    }

    // Bridge new/reset button
    if (target.closest('#bridge-new-btn') || target.closest('#bridge-reset-btn')) {
      handleBridgeReset()
      return
    }

    // Bridge retry button
    if (target.closest('#bridge-retry-btn')) {
      handleBridgeRetry()
      return
    }

    // Close dropdown when clicking outside
    if (state.showBridgePanel && !target.closest('.bridge-chain-select')) {
      state.showBridgePanel = false
      render()
      return
    }

    // ============================================
    // Battle Event Handlers (Pear Protocol)
    // ============================================

    // Battle mode selection
    const battleModeBtn = target.closest('.battle-mode') as HTMLElement | null
    if (battleModeBtn) {
      const mode = battleModeBtn.dataset.mode as BattleMode
      if (mode) {
        handleBattleModeSelect(mode)
      }
      return
    }

    // Theme selector toggle
    if (target.closest('#theme-selector-btn')) {
      toggleBattleThemeSelector()
      return
    }

    // Theme dropdown close
    if (target.closest('#theme-dropdown-close')) {
      state.battle.showThemeSelector = false
      render()
      return
    }

    // Theme card selection
    const themeCard = target.closest('.theme-card') as HTMLElement | null
    if (themeCard) {
      const themeId = themeCard.dataset.theme
      if (themeId) {
        handleBattleThemeSelect(themeId)
      }
      return
    }

    // Duration selection
    const durationBtn = target.closest('.duration-btn') as HTMLElement | null
    if (durationBtn) {
      const duration = durationBtn.dataset.duration as BattleDuration
      if (duration) {
        handleBattleDurationSelect(duration)
      }
      return
    }

    // Leverage selection
    const leverageBtn = target.closest('.leverage-btn') as HTMLElement | null
    if (leverageBtn) {
      const leverage = parseInt(leverageBtn.dataset.leverage || '2', 10)
      handleBattleLeverageSelect(leverage)
      return
    }

    // Battle submit button
    if (target.closest('#battle-submit-btn')) {
      handleBattleSubmit()
      return
    }

    // Toggle active battles
    if (target.closest('#toggle-active-battles')) {
      toggleActiveBattles()
      return
    }

    // Close theme dropdown when clicking outside
    if (state.battle.showThemeSelector && !target.closest('.battle-theme-section')) {
      state.battle.showThemeSelector = false
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

    // Bridge amount input
    if (target.id === 'bridge-amount-input') {
      handleBridgeAmountChange(target.value)
      return
    }

    // Battle stake input
    if (target.id === 'battle-stake-input') {
      handleBattleStakeChange(target.value)
      return
    }

    // Battle target address input
    if (target.id === 'battle-target-input') {
      handleBattleTargetChange(target.value)
      return
    }
  })
}
