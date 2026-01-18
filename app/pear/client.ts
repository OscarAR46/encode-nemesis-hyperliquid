/**
 * Pear Protocol API Client
 *
 * Handles authentication and trade execution via the Pear Execution API.
 * Pear is an execution layer for pair & basket trading on Hyperliquid.
 *
 * API Base: https://hl-v2.pearprotocol.io
 * Docs: https://docs.pearprotocol.io/api-integration/overview
 */

import { signTypedData } from '@wagmi/core'
import { wagmiConfig } from '@config/wagmi'
import type { BattleAsset, PearExecutionType, BattleTrigger } from '@app/types'

// ============================================
// Constants
// ============================================

const PEAR_API_BASE = 'https://hl-v2.pearprotocol.io'

// Hackathon Client IDs provided by Pear
const PEAR_CLIENT_IDS = [
  'HLHackathon1', 'HLHackathon2', 'HLHackathon3', 'HLHackathon4', 'HLHackathon5',
  'HLHackathon6', 'HLHackathon7', 'HLHackathon8', 'HLHackathon9', 'HLHackathon10'
] as const

// Use first hackathon ID (or rotate for load balancing)
const CLIENT_ID = PEAR_CLIENT_IDS[0]

// ============================================
// Types
// ============================================

interface PearTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface EIP712Message {
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  }
  types: {
    Authentication: Array<{ name: string; type: string }>
  }
  primaryType: string
  message: {
    address: string
    clientId: string
    timestamp: number
    action: string
  }
  timestamp: number
}

interface CreatePositionParams {
  longAssets: Array<{ asset: string; weight: number }>
  shortAssets: Array<{ asset: string; weight: number }>
  usdValue: number
  leverage: number
  slippage?: number
  executionType?: PearExecutionType
  trigger?: BattleTrigger
  stopLoss?: { type: 'PERCENTAGE' | 'DOLLAR' | 'POSITION_VALUE'; value: number }
  takeProfit?: { type: 'PERCENTAGE' | 'DOLLAR' | 'POSITION_VALUE'; value: number }
  twapDuration?: number
  twapIntervalSeconds?: number
}

interface CreatePositionResponse {
  orderId: string
  fills: Array<{
    asset: string
    side: string
    price: number
    size: number
  }>
}

interface PearPosition {
  id: string
  longAssets: Array<{ asset: string; weight: number; size: number }>
  shortAssets: Array<{ asset: string; weight: number; size: number }>
  entryValue: number
  currentValue: number
  unrealizedPnl: number
  markRatio: number
  leverage: number
  createdAt: number
}

// ============================================
// Token Storage
// ============================================

let pearTokens: PearTokens | null = null

// Persist tokens to localStorage
function saveTokens(tokens: PearTokens): void {
  pearTokens = tokens
  if (typeof window !== 'undefined') {
    localStorage.setItem('pear_tokens', JSON.stringify(tokens))
  }
}

// Load tokens from localStorage
function loadTokens(): PearTokens | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('pear_tokens')
    if (stored) {
      pearTokens = JSON.parse(stored)
      return pearTokens
    }
  } catch (e) {
    console.error('[Pear] Failed to load tokens:', e)
  }
  return null
}

// Clear tokens
function clearTokens(): void {
  pearTokens = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pear_tokens')
  }
}

// Check if authenticated
export function isPearAuthenticated(): boolean {
  const tokens = pearTokens || loadTokens()
  if (!tokens) return false
  // Check if token is expired (with 60s buffer)
  return Date.now() < tokens.expiresAt - 60000
}

// Get current tokens
export function getPearTokens(): PearTokens | null {
  return pearTokens || loadTokens()
}

// ============================================
// Authentication
// ============================================

/**
 * Get EIP-712 message for signing
 */
async function getEIP712Message(address: string): Promise<EIP712Message> {
  const url = new URL(`${PEAR_API_BASE}/auth/eip712-message`)
  url.searchParams.set('address', address)
  url.searchParams.set('clientId', CLIENT_ID)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get auth message' }))
    throw new Error(error.message || 'Failed to get EIP-712 message')
  }

  return response.json()
}

/**
 * Authenticate with Pear Protocol using EIP-712 signature
 */
export async function authenticatePear(address: string): Promise<PearTokens> {
  console.log('[Pear] Authenticating...', address)

  // Step 1: Get EIP-712 message
  const eip712Data = await getEIP712Message(address)
  console.log('[Pear] Got EIP-712 message:', eip712Data)

  // Step 2: Sign with wallet
  const signature = await signTypedData(wagmiConfig, {
    domain: eip712Data.domain as any,
    types: eip712Data.types as any,
    primaryType: 'Authentication',
    message: eip712Data.message as any
  })
  console.log('[Pear] Signature obtained')

  // Step 3: Submit signature to authenticate
  const authResponse = await fetch(`${PEAR_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'eip712',
      address,
      clientId: CLIENT_ID,
      details: {
        signature,
        timestamp: eip712Data.timestamp
      }
    })
  })

  if (!authResponse.ok) {
    const error = await authResponse.json().catch(() => ({ message: 'Authentication failed' }))
    throw new Error(error.message || 'Authentication failed')
  }

  const authResult = await authResponse.json()
  console.log('[Pear] Authentication successful')

  const tokens: PearTokens = {
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    expiresAt: Date.now() + (authResult.expiresIn * 1000)
  }

  saveTokens(tokens)
  return tokens
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<PearTokens> {
  const tokens = getPearTokens()
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch(`${PEAR_API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken })
  })

  if (!response.ok) {
    clearTokens()
    throw new Error('Token refresh failed - please re-authenticate')
  }

  const result = await response.json()
  const newTokens: PearTokens = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: Date.now() + (result.expiresIn * 1000)
  }

  saveTokens(newTokens)
  return newTokens
}

/**
 * Get valid access token, refreshing if needed
 */
async function getAccessToken(): Promise<string> {
  let tokens = getPearTokens()

  if (!tokens) {
    throw new Error('Not authenticated with Pear Protocol')
  }

  // Refresh if expired or about to expire (60s buffer)
  if (Date.now() > tokens.expiresAt - 60000) {
    tokens = await refreshAccessToken()
  }

  return tokens.accessToken
}

/**
 * Logout from Pear
 */
export async function logoutPear(): Promise<void> {
  const tokens = getPearTokens()
  if (tokens?.refreshToken) {
    try {
      await fetch(`${PEAR_API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      })
    } catch (e) {
      console.error('[Pear] Logout request failed:', e)
    }
  }
  clearTokens()
}

// ============================================
// Agent Wallet
// ============================================

/**
 * Get or create agent wallet for trade execution
 */
export async function getAgentWallet(): Promise<string> {
  const token = await getAccessToken()

  // First try to get existing wallet
  let response = await fetch(`${PEAR_API_BASE}/agentWallet`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    const data = await response.json()
    if (data.agentWalletAddress) {
      return data.agentWalletAddress
    }
  }

  // If no wallet exists, create one
  response = await fetch(`${PEAR_API_BASE}/agentWallet`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create agent wallet' }))
    throw new Error(error.message || 'Failed to create agent wallet')
  }

  const data = await response.json()
  console.log('[Pear] Agent wallet created:', data.agentWalletAddress)
  console.log('[Pear] Note:', data.message)

  return data.agentWalletAddress
}

// ============================================
// Position Management
// ============================================

/**
 * Create a new position (pair/basket trade)
 */
export async function createPosition(params: CreatePositionParams): Promise<CreatePositionResponse> {
  const token = await getAccessToken()

  const body: Record<string, any> = {
    slippage: params.slippage ?? 0.01, // 1% default
    executionType: params.executionType ?? 'MARKET',
    leverage: params.leverage,
    usdValue: params.usdValue,
    longAssets: params.longAssets,
    shortAssets: params.shortAssets
  }

  // Add trigger parameters if specified
  if (params.trigger) {
    body['executionType'] = 'TRIGGER'
    body['triggerType'] = params.trigger.type
    body['triggerValue'] = params.trigger.value
    body['direction'] = params.trigger.direction
    if (params.trigger.assetName) {
      body['assetName'] = params.trigger.assetName
    }
  }

  // Add TWAP parameters if specified
  if (params.executionType === 'TWAP' && params.twapDuration) {
    body['twapDuration'] = params.twapDuration
    body['twapIntervalSeconds'] = params.twapIntervalSeconds ?? 30
  }

  // Add risk management if specified
  if (params.stopLoss) {
    body['stopLoss'] = params.stopLoss
  }
  if (params.takeProfit) {
    body['takeProfit'] = params.takeProfit
  }

  console.log('[Pear] Creating position:', body)

  const response = await fetch(`${PEAR_API_BASE}/positions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create position' }))
    throw new Error(error.message || 'Failed to create position')
  }

  const result = await response.json()
  console.log('[Pear] Position created:', result)
  return result
}

/**
 * Get all open positions
 */
export async function getOpenPositions(): Promise<PearPosition[]> {
  const token = await getAccessToken()

  const response = await fetch(`${PEAR_API_BASE}/positions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get positions' }))
    throw new Error(error.message || 'Failed to get positions')
  }

  return response.json()
}

/**
 * Close a position
 */
export async function closePosition(positionId: string): Promise<void> {
  const token = await getAccessToken()

  const response = await fetch(`${PEAR_API_BASE}/positions/${positionId}/close`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to close position' }))
    throw new Error(error.message || 'Failed to close position')
  }

  console.log('[Pear] Position closed:', positionId)
}

// ============================================
// Orders
// ============================================

/**
 * Get open orders
 */
export async function getOpenOrders(): Promise<any[]> {
  const token = await getAccessToken()

  const response = await fetch(`${PEAR_API_BASE}/orders/open`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    return []
  }

  return response.json()
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const token = await getAccessToken()

  const response = await fetch(`${PEAR_API_BASE}/orders/${orderId}/cancel`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to cancel order' }))
    throw new Error(error.message || 'Failed to cancel order')
  }
}

// ============================================
// Battle Helpers
// ============================================

/**
 * Convert BattleAssets to Pear format
 */
export function battleAssetsToPear(assets: BattleAsset[]): Array<{ asset: string; weight: number }> {
  return assets.map(a => ({
    asset: a.symbol,
    weight: a.weight
  }))
}

/**
 * Create a battle position (wrapper for createPosition)
 */
export async function createBattlePosition(
  longAssets: BattleAsset[],
  shortAssets: BattleAsset[],
  usdValue: number,
  leverage: number,
  options?: {
    trigger?: BattleTrigger
    stopLossPercent?: number
    takeProfitPercent?: number
  }
): Promise<CreatePositionResponse> {
  const params: CreatePositionParams = {
    longAssets: battleAssetsToPear(longAssets),
    shortAssets: battleAssetsToPear(shortAssets),
    usdValue,
    leverage,
    slippage: 0.01
  }

  if (options?.trigger) {
    params.trigger = options.trigger
  }

  if (options?.stopLossPercent) {
    params.stopLoss = { type: 'PERCENTAGE', value: options.stopLossPercent }
  }

  if (options?.takeProfitPercent) {
    params.takeProfit = { type: 'PERCENTAGE', value: options.takeProfitPercent }
  }

  return createPosition(params)
}

// Initialize by loading saved tokens
if (typeof window !== 'undefined') {
  loadTokens()
}
