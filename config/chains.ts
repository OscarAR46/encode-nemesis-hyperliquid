/**
 * HyperEVM Chain Definitions
 */

import { defineChain } from 'viem'
import { env } from './env'

export const hyperEvmMainnet = defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [env.hyperEvmRpcUrl],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://explorer.hyperliquid.xyz',
    },
  },
})

export const hyperEvmTestnet = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [env.hyperEvmTestnetRpcUrl],
    },
    public: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Testnet Explorer',
      url: 'https://explorer.hyperliquid-testnet.xyz',
    },
  },
  testnet: true,
})

export const supportedChains = [hyperEvmMainnet, hyperEvmTestnet] as const

export function getChainById(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId)
}

export function isChainSupported(chainId: number): boolean {
  return supportedChains.some(chain => chain.id === chainId)
}

export function getDefaultChain() {
  return env.defaultChainId === 999 ? hyperEvmMainnet : hyperEvmTestnet
}

export type SupportedChainId = 999 | 998
