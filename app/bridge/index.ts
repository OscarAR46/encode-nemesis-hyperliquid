/**
 * LI.FI Bridge Integration
 * One-click onboarding to HyperEVM from any supported chain
 *
 * IMPORTANT NOTES:
 * 1. LI.FI does NOT support testnets - bridge only works on mainnet
 * 2. For testing, use mainnet with small amounts on low-fee L2s (Optimism, Base)
 * 3. HyperEVM support was added to LI.FI in June 2025
 */

import { createConfig, ChainId, getChains } from '@lifi/sdk'
import type { ExtendedChain } from '@lifi/sdk'

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

export function initLiFi() {
  if (lifiConfig) return lifiConfig

  lifiConfig = createConfig({
    integrator: LIFI_INTEGRATOR,
  })

  console.log('[LI.FI] SDK initialized for', LIFI_INTEGRATOR)
  return lifiConfig
}

export function getLiFiConfig() {
  if (!lifiConfig) {
    return initLiFi()
  }
  return lifiConfig
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
