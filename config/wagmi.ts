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
