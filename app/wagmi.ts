/**
 * Wagmi Configuration
 * Central configuration for wallet connections
 */

import { createConfig, http } from '@wagmi/core'
import { injected, walletConnect, coinbaseWallet } from '@wagmi/connectors'
import { hyperEvmMainnet, hyperEvmTestnet } from './chains'
import { env } from './env'

/**
 * WalletConnect metadata for mobile wallet display
 */
const walletConnectMetadata = {
  name: 'Nemesis',
  description: 'Every trader needs a Nemesis',
  url: 'https://nemesis.london',
  icons: ['https://nemesis.london/icon.png'],
}

/**
 * Connector configurations
 */
const connectors = [
  // Injected wallets (MetaMask, Rabby, etc.)
  injected({
    shimDisconnect: true,
  }),
  
  // WalletConnect v2 for mobile QR
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
  
  // Coinbase Wallet (popular on mobile)
  coinbaseWallet({
    appName: 'Nemesis',
    appLogoUrl: 'https://nemesis.london/icon.png',
  }),
]

/**
 * Transport configuration for each chain
 */
const transports = {
  [hyperEvmMainnet.id]: http(hyperEvmMainnet.rpcUrls.default.http[0]),
  [hyperEvmTestnet.id]: http(hyperEvmTestnet.rpcUrls.default.http[0]),
}

/**
 * Main wagmi configuration
 */
export const wagmiConfig = createConfig({
  chains: [hyperEvmMainnet, hyperEvmTestnet],
  connectors,
  transports,
  multiInjectedProviderDiscovery: true,
  // Storage for persisting connection state
  storage: typeof window !== 'undefined' 
    ? {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      }
    : undefined,
})

/**
 * Export config type for type safety
 */
export type WagmiConfig = typeof wagmiConfig
