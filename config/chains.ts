/**
 * Chain Definitions
 * HyperEVM (destination) + Source chains for LI.FI bridging
 */

import { defineChain } from 'viem'
import { mainnet, arbitrum, base, polygon, optimism, avalanche, bsc } from 'viem/chains'
import { env } from './env'

// ============================================
// HyperEVM Chains (Destination)
// ============================================

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

// ============================================
// Source Chains for LI.FI Bridging
// ============================================

export const SOURCE_CHAINS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', icon: '⟠', chain: mainnet },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', icon: '🔵', chain: arbitrum },
  { id: 8453, name: 'Base', symbol: 'ETH', icon: '🔷', chain: base },
  { id: 137, name: 'Polygon', symbol: 'MATIC', icon: '💜', chain: polygon },
  { id: 10, name: 'Optimism', symbol: 'ETH', icon: '🔴', chain: optimism },
  { id: 43114, name: 'Avalanche', symbol: 'AVAX', icon: '🔺', chain: avalanche },
  { id: 56, name: 'BNB Chain', symbol: 'BNB', icon: '🟡', chain: bsc },
] as const

export type SourceChainId = typeof SOURCE_CHAINS[number]['id']

// Common tokens on source chains (addresses vary by chain)
export const COMMON_TOKENS: Record<number, Array<{
  symbol: string
  name: string
  address: string
  decimals: number
  icon: string
}>> = {
  // Ethereum Mainnet
  1: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: '💲' },
    { symbol: 'WETH', name: 'Wrapped ETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, icon: '⟠' },
  ],
  // Arbitrum
  42161: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, icon: '💲' },
    { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, icon: '🔵' },
  ],
  // Base
  8453: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💵' },
  ],
  // Polygon
  137: [
    { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '💜' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, icon: '💲' },
  ],
  // Optimism
  10: [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, icon: '💵' },
    { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, icon: '🔴' },
  ],
  // Avalanche
  43114: [
    { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🔺' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6, icon: '💲' },
  ],
  // BNB Chain
  56: [
    { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🟡' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, icon: '💲' },
  ],
}

// HyperEVM destination tokens
// USDC address verified from: https://hyperevmscan.io/address/0xb88339cb7199b77e23db6e890353e22632ba630f
export const HYPEREVM_TOKENS = [
  { symbol: 'HYPE', name: 'HYPE', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🌀' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f', decimals: 6, icon: '💵' },
] as const

// ============================================
// Utility Functions
// ============================================

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

export function getSourceChainById(chainId: number) {
  return SOURCE_CHAINS.find(chain => chain.id === chainId)
}

export function getTokensForChain(chainId: number) {
  return COMMON_TOKENS[chainId] || []
}

export type SupportedChainId = 999 | 998
