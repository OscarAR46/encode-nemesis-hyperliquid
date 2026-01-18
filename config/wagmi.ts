/**
 * Wagmi Configuration
 *
 * IMPORTANT: Includes ALL chains needed for LI.FI bridging:
 * - Source chains (Ethereum, Arbitrum, Base, etc.) where users sign bridge transactions
 * - Destination chain (HyperEVM) where assets arrive
 *
 * NOTE: LI.FI does NOT support testnets. Bridge functionality is mainnet-only.
 * For testing, use mainnet with small amounts on low-fee L2s like Optimism/Base.
 */

import { createConfig, http } from '@wagmi/core'
import { injected, metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors'
import { mainnet, arbitrum, base, polygon, optimism, avalanche, bsc } from 'viem/chains'
import { hyperEvmMainnet, hyperEvmTestnet } from './chains'
import { env } from './env'

/**
 * CRITICAL: Clean up orphaned WalletConnect sessions BEFORE initializing wagmi
 * This prevents "session topic doesn't exist" errors from the WalletConnect relay
 */
function cleanupOrphanedWalletConnectSessions(): void {
  if (typeof window === 'undefined') return

  try {
    // Check for WalletConnect v2 session data
    const wcSessionKey = 'wc@2:client:0.3//session'
    const wcPairingKey = 'wc@2:client:0.3//pairing'
    const wcProposalKey = 'wc@2:client:0.3//proposal'
    const wcCoreKey = 'wc@2:core:0.3//keychain'
    const wcMessagesKey = 'wc@2:core:0.3//messages'
    const wcHistoryKey = 'wc@2:core:0.3//history'
    const wcExpirerKey = 'wc@2:core:0.3//expirer'

    // Get current sessions
    const sessionData = localStorage.getItem(wcSessionKey)
    if (sessionData) {
      try {
        const sessions = JSON.parse(sessionData)
        // If sessions array is empty or corrupted, clear all WC data
        if (!Array.isArray(sessions) || sessions.length === 0) {
          console.warn('[Wagmi] Empty/corrupted WalletConnect sessions, clearing all WC data...')
          clearAllWalletConnectData()
          return
        }

        // Check if any session has expired
        const now = Date.now()
        const validSessions = sessions.filter((session: any) => {
          if (!session || !session.expiry) return false
          // Session expiry is in seconds, convert to ms
          return session.expiry * 1000 > now
        })

        if (validSessions.length !== sessions.length) {
          console.warn('[Wagmi] Found expired WalletConnect sessions, clearing...')
          clearAllWalletConnectData()
          return
        }
      } catch (e) {
        console.warn('[Wagmi] Failed to parse WalletConnect sessions, clearing...')
        clearAllWalletConnectData()
        return
      }
    }

    // Also check for mismatched keychain entries (orphaned topics)
    const keychainData = localStorage.getItem(wcCoreKey)
    if (keychainData && sessionData) {
      try {
        const keychain = JSON.parse(keychainData)
        const sessions = JSON.parse(sessionData)
        const sessionTopics = new Set(sessions.map((s: any) => s.topic))

        // If keychain has topics not in sessions, there's a mismatch
        const keychainTopics = Object.keys(keychain)
        const orphanedTopics = keychainTopics.filter(topic => !sessionTopics.has(topic))

        if (orphanedTopics.length > 0) {
          console.warn('[Wagmi] Found orphaned WalletConnect topics, clearing all WC data...')
          clearAllWalletConnectData()
          return
        }
      } catch (e) {
        // If we can't parse, clear everything
        clearAllWalletConnectData()
        return
      }
    }
  } catch (e) {
    console.error('[Wagmi] Error during WalletConnect cleanup:', e)
  }
}

function clearAllWalletConnectData(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.startsWith('wc@') ||
      key.startsWith('wagmi') ||
      key.includes('walletconnect') ||
      key.includes('WALLETCONNECT')
    )) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.debug('[Wagmi] Removed:', key)
  })

  if (keysToRemove.length > 0) {
    console.log('[Wagmi] Cleared', keysToRemove.length, 'WalletConnect entries')
  }
}

// Run cleanup BEFORE any wagmi initialization
cleanupOrphanedWalletConnectSessions()

const walletConnectMetadata = {
  name: 'Nemesis',
  description: 'Every trader needs a Nemesis',
  url: 'https://nemesis.london',
  icons: ['https://nemesis.london/icon.png'],
}

const connectors = [
  // MetaMask specific connector - uses extension popup
  metaMask({
    dappMetadata: walletConnectMetadata,
  }),
  // Generic injected for other browser wallets
  injected({
    shimDisconnect: true,
  }),
  walletConnect({
    projectId: env.walletConnectProjectId,
    metadata: walletConnectMetadata,
    showQrModal: true,
    qrModalOptions: {
      themeMode: 'dark',
      themeVariables: {
        '--wcm-accent-color': '#60c0d0',
        '--wcm-background-color': '#0a1628',
      },
    },
  }),
  coinbaseWallet({
    appName: 'Nemesis',
    appLogoUrl: 'https://nemesis.london/icon.png',
  }),
]

// All chains: source chains for bridging + HyperEVM destination
// Users must be able to sign transactions on source chains to bridge
const allChains = [
  // HyperEVM (destination)
  hyperEvmMainnet,
  hyperEvmTestnet,
  // Source chains for LI.FI bridging (mainnet only - LI.FI doesn't support testnets)
  mainnet,      // Ethereum (chain 1)
  arbitrum,     // Arbitrum (chain 42161)
  base,         // Base (chain 8453)
  polygon,      // Polygon (chain 137)
  optimism,     // Optimism (chain 10) - recommended for low-cost testing
  avalanche,    // Avalanche (chain 43114)
  bsc,          // BNB Chain (chain 56)
] as const

const transports = {
  // HyperEVM
  [hyperEvmMainnet.id]: http(hyperEvmMainnet.rpcUrls.default.http[0]),
  [hyperEvmTestnet.id]: http(hyperEvmTestnet.rpcUrls.default.http[0]),
  // Source chains - use public RPCs (users can override via wallet)
  [mainnet.id]: http(),
  [arbitrum.id]: http(),
  [base.id]: http(),
  [polygon.id]: http(),
  [optimism.id]: http(),
  [avalanche.id]: http(),
  [bsc.id]: http(),
}

export const wagmiConfig = createConfig({
  chains: allChains,
  connectors,
  transports,
  multiInjectedProviderDiscovery: true,
  storage: typeof window !== 'undefined'
    ? {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      }
    : undefined,
})

export type WagmiConfig = typeof wagmiConfig

// Export cleanup function for manual use
export { clearAllWalletConnectData }

/**
 * Force clear all wallet sessions and reload the page
 * Call this if you see "session topic doesn't exist" errors
 */
export function forceResetWalletSessions(): void {
  clearAllWalletConnectData()
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
