/**
 * LI.FI Bridge Integration
 * One-click onboarding to HyperEVM from any supported chain
 *
 * CRITICAL: LI.FI requires the wallet to be on the SOURCE chain for signing.
 * This module handles chain switching transparently.
 */

import { createConfig, ChainId, getChains, getTokens, EVM } from '@lifi/sdk'
import type { ExtendedChain, Token } from '@lifi/sdk'
import { getWalletClient, switchChain, getAccount, getChainId } from '@wagmi/core'
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

// Cache
let hyperEvmSupported: boolean | null = null
let supportedChains: ExtendedChain[] = []
const tokenCache: Map<number, Token[]> = new Map()

// LI.FI SDK configuration
let lifiConfig: ReturnType<typeof createConfig> | null = null

// Track which chain we're operating on for LI.FI
let currentBridgeChainId: number | null = null

/**
 * Clear stale WalletConnect sessions
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
 * Get wallet client for a specific chain, switching if necessary
 */
async function getWalletClientForChain(targetChainId: number) {
  const account = getAccount(wagmiConfig)
  if (!account.isConnected) {
    throw new Error('Wallet not connected')
  }

  const currentChain = getChainId(wagmiConfig)
  console.log(`[LI.FI] getWalletClient - current: ${currentChain}, target: ${targetChainId}`)

  // If we're on a different chain, switch first
  if (currentChain !== targetChainId) {
    console.log(`[LI.FI] Switching from chain ${currentChain} to ${targetChainId}`)
    try {
      await switchChain(wagmiConfig, { chainId: targetChainId })
      // Small delay to let wagmi state settle
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error: any) {
      console.error('[LI.FI] Chain switch failed:', error)
      throw new Error(`Failed to switch to chain ${targetChainId}: ${error.message}`)
    }
  }

  // Now get the wallet client for the target chain
  const walletClient = await getWalletClient(wagmiConfig, { chainId: targetChainId })
  if (!walletClient) {
    throw new Error(`Failed to get wallet client for chain ${targetChainId}`)
  }

  return walletClient
}

export function initLiFi() {
  if (lifiConfig) return lifiConfig

  lifiConfig = createConfig({
    integrator: LIFI_INTEGRATOR,
    providers: [
      EVM({
        getWalletClient: async () => {
          // Get wallet client for the current bridge operation chain
          // If no specific chain is set, get for current connected chain
          const chainId = currentBridgeChainId || getChainId(wagmiConfig)
          console.log('[LI.FI] EVM.getWalletClient for chain:', chainId)
          
          try {
            return await getWalletClientForChain(chainId)
          } catch (error: any) {
            if (error?.message?.includes('session topic') ||
                error?.message?.includes('No matching key')) {
              console.warn('[LI.FI] Stale session, clearing...')
              clearStaleWalletConnectSessions()
              throw new Error('Wallet session expired. Please reconnect your wallet.')
            }
            throw error
          }
        },

        switchChain: async (chainId: number) => {
          console.log('[LI.FI] EVM.switchChain to:', chainId)
          currentBridgeChainId = chainId
          
          try {
            // Switch chain
            await switchChain(wagmiConfig, { chainId: chainId as any })
            // Wait for state to settle
            await new Promise(resolve => setTimeout(resolve, 200))
            // Return wallet client for new chain
            return await getWalletClient(wagmiConfig, { chainId })
          } catch (error: any) {
            console.error('[LI.FI] switchChain failed:', error)
            if (error?.message?.includes('session topic') ||
                error?.message?.includes('No matching key')) {
              clearStaleWalletConnectSessions()
              throw new Error('Wallet session expired. Please reconnect your wallet.')
            }
            throw error
          }
        },
      }),
    ],
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
 * Prepare for bridge operation - ensures we're on the right chain
 */
export async function prepareBridge(fromChainId: number): Promise<void> {
  console.log('[LI.FI] Preparing bridge from chain:', fromChainId)
  currentBridgeChainId = fromChainId
  
  // Switch to source chain before any bridge operation
  const currentChain = getChainId(wagmiConfig)
  if (currentChain !== fromChainId) {
    console.log(`[LI.FI] Pre-switching to source chain ${fromChainId}`)
    await switchChain(wagmiConfig, { chainId: fromChainId as any })
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

/**
 * Clean up after bridge operation - switch back to HyperEVM
 */
export async function finishBridge(): Promise<void> {
  console.log('[LI.FI] Bridge complete, switching back to HyperEVM')
  currentBridgeChainId = null
  
  try {
    const currentChain = getChainId(wagmiConfig)
    if (currentChain !== HYPEREVM_CHAIN_ID && currentChain !== 998) {
      // Try mainnet first, fallback to testnet
      try {
        await switchChain(wagmiConfig, { chainId: HYPEREVM_CHAIN_ID as any })
      } catch {
        await switchChain(wagmiConfig, { chainId: 998 as any })
      }
    }
  } catch (error) {
    console.warn('[LI.FI] Failed to switch back to HyperEVM:', error)
    // Non-fatal - user can switch manually
  }
}

export function resetLiFiConfig(): void {
  lifiConfig = null
  hyperEvmSupported = null
  supportedChains = []
  tokenCache.clear()
  currentBridgeChainId = null
  console.log('[LI.FI] Configuration reset')
}

export function clearBridgeSessions(): void {
  clearStaleWalletConnectSessions()
  resetLiFiConfig()
}

export async function verifyHyperEvmSupport(): Promise<{
  supported: boolean
  chains: ExtendedChain[]
  hyperEvmChain?: ExtendedChain
}> {
  if (hyperEvmSupported !== null) {
    return {
      supported: hyperEvmSupported,
      chains: supportedChains,
      hyperEvmChain: supportedChains.find(c => c.id === HYPEREVM_CHAIN_ID),
    }
  }

  try {
    getLiFiConfig()
    const chains = await getChains()
    supportedChains = chains

    const hyperEvmChain = chains.find(c => c.id === HYPEREVM_CHAIN_ID)
    hyperEvmSupported = !!hyperEvmChain

    if (hyperEvmSupported) {
      console.log('[LI.FI] HyperEVM (999) is supported:', hyperEvmChain?.name)
    } else {
      console.warn('[LI.FI] HyperEVM (999) NOT found in supported chains')
    }

    return { supported: hyperEvmSupported, chains, hyperEvmChain }
  } catch (error) {
    console.error('[LI.FI] Failed to verify chain support:', error)
    hyperEvmSupported = false
    return { supported: false, chains: [] }
  }
}

export function isSourceChainSupported(chainId: number): boolean {
  return ALLOWED_CHAINS.includes(chainId as ChainId)
}

export function getSupportedChains(): ExtendedChain[] {
  return supportedChains
}

// ============================================
// TOKEN FETCHING
// ============================================

export interface BridgeToken {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  chainId: number
  priceUSD?: string
}

export async function getTokensForChain(chainId: number): Promise<BridgeToken[]> {
  if (tokenCache.has(chainId)) {
    return tokenCache.get(chainId)!.map(mapToken)
  }

  try {
    getLiFiConfig()
    console.log('[LI.FI] Fetching tokens for chain:', chainId)
    const result = await getTokens({ chains: [chainId] })

    const tokens = result.tokens[chainId] || []
    tokenCache.set(chainId, tokens)

    console.log(`[LI.FI] Found ${tokens.length} tokens for chain ${chainId}`)
    return tokens.map(mapToken)
  } catch (error) {
    console.error('[LI.FI] Failed to fetch tokens for chain', chainId, error)
    return []
  }
}

export async function getPopularTokens(chainId: number): Promise<BridgeToken[]> {
  const allTokens = await getTokensForChain(chainId)

  const popularSymbols = ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'ARB', 'OP', 'MATIC', 'BNB', 'AVAX']

  const popular = allTokens.filter(t => popularSymbols.includes(t.symbol.toUpperCase()))
  const others = allTokens.filter(t => !popularSymbols.includes(t.symbol.toUpperCase()))

  popular.sort((a, b) => {
    const aIndex = popularSymbols.indexOf(a.symbol.toUpperCase())
    const bIndex = popularSymbols.indexOf(b.symbol.toUpperCase())
    return aIndex - bIndex
  })

  return [...popular, ...others.slice(0, 50)]
}

export async function searchTokens(chainId: number, query: string): Promise<BridgeToken[]> {
  const tokens = await getTokensForChain(chainId)
  const lowerQuery = query.toLowerCase()

  return tokens.filter(t =>
    t.symbol.toLowerCase().includes(lowerQuery) ||
    t.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 20)
}

export async function preloadTokens(): Promise<void> {
  const chainIds = [...ALLOWED_CHAINS, HYPEREVM_CHAIN_ID]
  console.log('[LI.FI] Preloading tokens for', chainIds.length, 'chains...')

  try {
    getLiFiConfig()
    const result = await getTokens({ chains: chainIds })

    for (const chainId of chainIds) {
      const tokens = result.tokens[chainId] || []
      tokenCache.set(chainId, tokens)
    }
    console.log('[LI.FI] Token preload complete')
  } catch (error) {
    console.warn('[LI.FI] Token preload failed:', error)
  }
}

function mapToken(token: Token): BridgeToken {
  return {
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    chainId: token.chainId,
    priceUSD: token.priceUSD,
  }
}

// Re-export from submodules
export { getQuote, type QuoteResult, type QuoteError } from './quote'
export { executeBridge, type ExecutionResult, type ExecutionError } from './execute'
export { getBridgeStatus, type BridgeStatusResult } from './status'
export { ALLOWED_CHAINS, LIFI_INTEGRATOR }
