/**
 * HyperEVM Chain Definitions
 * Custom chain configurations for Hyperliquid's EVM
 */

import { defineChain } from 'viem'
import { env } from './env'

/**
 * HyperEVM Mainnet
 * Chain ID: 999
 * Native Token: HYPE
 */
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
  contracts: {
    // Add contract addresses as needed for Valantis, etc.
  },
})

/**
 * HyperEVM Testnet
 * Chain ID: 998
 * Native Token: HYPE (test)
 */
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

/**
 * Supported chains array for wagmi config
 */
export const supportedChains = [hyperEvmMainnet, hyperEvmTestnet] as const

/**
 * Get chain by ID
 */
export function getChainById(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId)
}

/**
 * Check if chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return supportedChains.some(chain => chain.id === chainId)
}

/**
 * Get default chain based on environment
 */
export function getDefaultChain() {
  return env.defaultChainId === 999 ? hyperEvmMainnet : hyperEvmTestnet
}

export type SupportedChainId = 999 | 998
