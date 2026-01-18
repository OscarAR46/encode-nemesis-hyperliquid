/**
 * Wagmi Configuration
 */

import { createConfig, http } from '@wagmi/core'
import { injected, metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors'
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

const transports = {
  [hyperEvmMainnet.id]: http(hyperEvmMainnet.rpcUrls.default.http[0]),
  [hyperEvmTestnet.id]: http(hyperEvmTestnet.rpcUrls.default.http[0]),
}

export const wagmiConfig = createConfig({
  chains: [hyperEvmMainnet, hyperEvmTestnet],
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
