/**
 * Battle Themes - Preset narrative baskets for quick pair trading
 *
 * Each theme represents a trading thesis that users can bet on.
 * Weights must sum to 1.0 within each theme.
 */

import type { BattleTheme } from '@app/types'

export const BATTLE_THEMES: BattleTheme[] = [
  {
    id: 'hyperliquid-maxi',
    name: 'HYPE Maxi',
    description: 'All in on Hyperliquid',
    icon: '💎',
    assets: [
      { symbol: 'HYPE', weight: 1.0 },
    ]
  },
  {
    id: 'ai-revolution',
    name: 'AI Revolution',
    description: 'The AI narrative will dominate',
    icon: '🤖',
    assets: [
      { symbol: 'TAO', weight: 0.35 },
      { symbol: 'RENDER', weight: 0.25 },
      { symbol: 'FET', weight: 0.20 },
      { symbol: 'NEAR', weight: 0.20 },
    ]
  },
  {
    id: 'l2-summer',
    name: 'L2 Summer',
    description: 'Layer 2s will outperform',
    icon: '🔷',
    assets: [
      { symbol: 'ARB', weight: 0.35 },
      { symbol: 'OP', weight: 0.30 },
      { symbol: 'STRK', weight: 0.20 },
      { symbol: 'MANTA', weight: 0.15 },
    ]
  },
  {
    id: 'meme-lords',
    name: 'Meme Lords',
    description: 'Memes will outperform everything',
    icon: '🐕',
    assets: [
      { symbol: 'DOGE', weight: 0.30 },
      { symbol: 'SHIB', weight: 0.25 },
      { symbol: 'PEPE', weight: 0.25 },
      { symbol: 'WIF', weight: 0.20 },
    ]
  },
  {
    id: 'solana-szn',
    name: 'Solana SZN',
    description: 'Solana ecosystem dominance',
    icon: '☀️',
    assets: [
      { symbol: 'SOL', weight: 0.50 },
      { symbol: 'JTO', weight: 0.25 },
      { symbol: 'BONK', weight: 0.25 },
    ]
  },
  {
    id: 'eth-killers',
    name: 'ETH Killers',
    description: 'Alt L1s will dethrone Ethereum',
    icon: '⚔️',
    assets: [
      { symbol: 'SOL', weight: 0.35 },
      { symbol: 'AVAX', weight: 0.25 },
      { symbol: 'SUI', weight: 0.20 },
      { symbol: 'SEI', weight: 0.20 },
    ]
  },
  {
    id: 'defi-revival',
    name: 'DeFi Revival',
    description: 'DeFi blue chips will lead',
    icon: '🏦',
    assets: [
      { symbol: 'AAVE', weight: 0.30 },
      { symbol: 'UNI', weight: 0.25 },
      { symbol: 'MKR', weight: 0.25 },
      { symbol: 'SNX', weight: 0.20 },
    ]
  },
  {
    id: 'btc-maxi',
    name: 'BTC Maxi',
    description: 'Bitcoin will outperform all',
    icon: '🟠',
    assets: [
      { symbol: 'BTC', weight: 1.0 },
    ]
  },
  {
    id: 'eth-maxi',
    name: 'ETH Maxi',
    description: 'Ethereum will lead the pack',
    icon: '🔵',
    assets: [
      { symbol: 'ETH', weight: 1.0 },
    ]
  },
  {
    id: 'gaming-guild',
    name: 'Gaming Guild',
    description: 'GameFi will moon',
    icon: '🎮',
    assets: [
      { symbol: 'IMX', weight: 0.35 },
      { symbol: 'GALA', weight: 0.25 },
      { symbol: 'AXS', weight: 0.20 },
      { symbol: 'BEAM', weight: 0.20 },
    ]
  },
  {
    id: 'real-world-assets',
    name: 'RWA Play',
    description: 'Real World Assets narrative',
    icon: '🏠',
    assets: [
      { symbol: 'ONDO', weight: 0.40 },
      { symbol: 'PENDLE', weight: 0.35 },
      { symbol: 'TRU', weight: 0.25 },
    ]
  },
  {
    id: 'privacy-coins',
    name: 'Privacy Play',
    description: 'Privacy will be valued',
    icon: '🕵️',
    assets: [
      { symbol: 'XMR', weight: 0.50 },
      { symbol: 'ZEC', weight: 0.30 },
      { symbol: 'SCRT', weight: 0.20 },
    ]
  },
]

// Default short asset when user picks a theme (benchmark)
export const DEFAULT_SHORT_ASSETS = [
  { symbol: 'ETH', weight: 1.0 }
]

// Get theme by ID
export function getThemeById(id: string): BattleTheme | undefined {
  return BATTLE_THEMES.find(t => t.id === id)
}

// Get theme display name with icon
export function getThemeDisplay(id: string): string {
  const theme = getThemeById(id)
  return theme ? `${theme.icon} ${theme.name}` : id
}

// Get all asset symbols from a theme
export function getThemeAssetSymbols(id: string): string[] {
  const theme = getThemeById(id)
  return theme ? theme.assets.map(a => a.symbol) : []
}
