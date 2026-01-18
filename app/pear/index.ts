/**
 * Pear Protocol Integration
 *
 * Battle trading powered by Pear Protocol's pair/basket trading execution.
 * All trades settle on Hyperliquid.
 */

export {
  // Authentication
  authenticatePear,
  logoutPear,
  isPearAuthenticated,
  getPearTokens,

  // Agent Wallet
  getAgentWallet,

  // Positions
  createPosition,
  createBattlePosition,
  getOpenPositions,
  closePosition,

  // Orders
  getOpenOrders,
  cancelOrder,

  // Helpers
  battleAssetsToPear,
} from './client'

export {
  BATTLE_THEMES,
  DEFAULT_SHORT_ASSETS,
  getThemeById,
  getThemeDisplay,
  getThemeAssetSymbols,
} from './themes'
