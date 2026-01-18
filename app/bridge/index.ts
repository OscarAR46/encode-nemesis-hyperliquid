/**
 * LI.FI Bridge Integration
 * One-click onboarding to HyperEVM from any supported chain
 *
 * IMPORTANT NOTES:
 * 1. LI.FI does NOT support testnets - bridge only works on mainnet
 * 2. For testing, use mainnet with small amounts on low-fee L2s (Optimism, Base)
 * 3. HyperEVM support was added to LI.FI in June 2025
 */

import { createConfig, ChainId, getChains, EVM } from '@lifi/sdk'
import type { ExtendedChain } from '@lifi/sdk'
import { getWalletClient, switchChain } from '@wagmi/core'
import { wagmiConfig } from '@config/wagmi'

// LI.FI SDK Configuration
const LIFI_INTEGRATOR = 'nemesis-hyperliquid'

// Supported source chains for bridging to HyperEVM
const ALLOWED_CHAINS = [
  ChainId.ETH,    // Ethereum (1)
  ChainId.ARB,    // Arbitrum (42161)
  ChainId.BAS,    // Base (8453)
  ChainId.POL,    // Polygon (137)
  ChainId.OPT,    // Optimism (10)
  ChainId.AVA,    // Avalanche (43114)
  ChainId.BSC,    // BNB Chain (56)
]

// HyperEVM Chain ID
export const HYPEREVM_CHAIN_ID = 999

// Cache for chain verification
let hyperEvmSupported: boolean | null = null
let supportedChains: ExtendedChain[] = []

// Initialize LI.FI SDK configuration
let lifiConfig: ReturnType<typeof createConfig> | null = null

/**
 * Clear stale WalletConnect sessions that may cause "session topic doesn't exist" errors
 */
function clearStaleWalletConnectSessions(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.startsWith('wc@') ||
      key.startsWith('wagmi') ||
      key.includes('walletconnect')
    )) {
      keysToRemove.push(key)
    }
  }

  if (keysToRemove.length > 0) {
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.debug('[LI.FI] Cleared stale session:', key)
    })
  }
}

/**
 * Check if there's a valid WalletConnect session
 */
function hasValidWalletConnectSession(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const sessionKey = Object.keys(localStorage).find(key =>
      key.startsWith('wc@2:client:0.3') && key.includes('session')
    )
    if (!sessionKey) return true // No WalletConnect session, that's fine

    const sessionData = localStorage.getItem(sessionKey)
    if (!sessionData) return true

    const sessions = JSON.parse(sessionData)
    // Check if sessions array is valid and not empty
    return Array.isArray(sessions) && sessions.length > 0
  } catch {
    return false
  }
}

export function initLiFi() {
  if (lifiConfig) return lifiConfig

  // Clear stale sessions before initializing if needed
  if (!hasValidWalletConnectSession()) {
    console.warn('[LI.FI] Detected potentially stale WalletConnect session, clearing...')
    clearStaleWalletConnectSessions()
  }

  lifiConfig = createConfig({
    integrator: LIFI_INTEGRATOR,
    providers: [
      EVM({
        // Provide wallet client for transaction signing
        getWalletClient: async () => {
          try {
            return await getWalletClient(wagmiConfig)
          } catch (error: any) {
            // Handle stale WalletConnect session errors
            if (error?.message?.includes('session topic') ||
                error?.message?.includes('No matching key')) {
              console.warn('[LI.FI] Stale WalletConnect session, clearing and retrying...')
              clearStaleWalletConnectSessions()
              // Return undefined to signal SDK to handle reconnection
              throw new Error('WalletConnect session expired. Please reconnect your wallet.')
            }
            throw error
          }
        },
        // Handle chain switching during bridge execution
        switchChain: async (chainId: number) => {
          console.log('[LI.FI] Switching to chain:', chainId)
          try {
            // Cast to any for wagmi compatibility - wagmi config includes all these chains
            const chain = await switchChain(wagmiConfig, { chainId: chainId as any })
            return await getWalletClient(wagmiConfig, { chainId: chain.id })
          } catch (error: any) {
            // Handle stale WalletConnect session errors during chain switch
            if (error?.message?.includes('session topic') ||
                error?.message?.includes('No matching key')) {
              console.warn('[LI.FI] Stale WalletConnect session during chain switch, clearing...')
              clearStaleWalletConnectSessions()
              throw new Error('WalletConnect session expired. Please reconnect your wallet.')
            }
            throw error
          }
        },
      }),
    ],
  })

  console.log('[LI.FI] SDK initialized with EVM provider for', LIFI_INTEGRATOR)
  return lifiConfig
}

export function getLiFiConfig() {
  if (!lifiConfig) {
    return initLiFi()
  }
  return lifiConfig
}

/**
 * Reset LI.FI configuration - call this after wallet reconnection
 * to ensure fresh session state
 */
export function resetLiFiConfig(): void {
  lifiConfig = null
  hyperEvmSupported = null
  supportedChains = []
  console.log('[LI.FI] Configuration reset, will reinitialize on next use')
}

/**
 * Clear all WalletConnect/Wagmi sessions - export for external use
 */
export function clearBridgeSessions(): void {
  clearStaleWalletConnectSessions()
  resetLiFiConfig()
}

/**
 * Verify LI.FI supports HyperEVM at runtime
 * Call this before showing the bridge UI to confirm integration works
 */
export async function verifyHyperEvmSupport(): Promise<{
  supported: boolean
  chains: ExtendedChain[]
  hyperEvmChain?: ExtendedChain
}> {
  // Return cached result if available
  if (hyperEvmSupported !== null) {
    return {
      supported: hyperEvmSupported,
      chains: supportedChains,
      hyperEvmChain: supportedChains.find(c => c.id === HYPEREVM_CHAIN_ID),
    }
  }

  try {
    getLiFiConfig()

    // Fetch all chains LI.FI supports
    const chains = await getChains()
    supportedChains = chains

    // Check if HyperEVM (999) is in the list
    const hyperEvmChain = chains.find(c => c.id === HYPEREVM_CHAIN_ID)
    hyperEvmSupported = !!hyperEvmChain

    if (hyperEvmSupported) {
      console.log('[LI.FI] HyperEVM (999) is supported:', hyperEvmChain?.name)
    } else {
      console.warn('[LI.FI] HyperEVM (999) NOT found in supported chains')
      console.log('[LI.FI] Available chains:', chains.map(c => `${c.name} (${c.id})`).join(', '))
    }

    return {
      supported: hyperEvmSupported,
      chains,
      hyperEvmChain,
    }
  } catch (error) {
    console.error('[LI.FI] Failed to verify chain support:', error)
    hyperEvmSupported = false
    return {
      supported: false,
      chains: [],
    }
  }
}

/**
 * Check if a source chain is supported for bridging
 */
export function isSourceChainSupported(chainId: number): boolean {
  return ALLOWED_CHAINS.includes(chainId as ChainId)
}

/**
 * Get the list of chains LI.FI supports (after verification)
 */
export function getSupportedChains(): ExtendedChain[] {
  return supportedChains
}

// Re-export everything from submodules
export { getQuote, type QuoteResult, type QuoteError } from './quote'
export { executeBridge, type ExecutionResult, type ExecutionError } from './execute'
export { getBridgeStatus, type BridgeStatusResult } from './status'
export { ALLOWED_CHAINS, LIFI_INTEGRATOR }
