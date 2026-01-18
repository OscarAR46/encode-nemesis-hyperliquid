/**
 * Wallet Manager
 * High-level wallet operations abstracting wagmi/core
 */

import {
  connect,
  disconnect,
  getAccount,
  getChainId,
  switchChain,
  watchAccount,
  reconnect,
  getConnectors,
} from '@wagmi/core'
import type { Connector } from '@wagmi/core'
import { wagmiConfig, isChainSupported, getDefaultChain, type SupportedChainId } from '@config/index'

/**
 * Wallet error types for typed error handling
 */
export type WalletErrorType =
  | 'USER_REJECTED'
  | 'CHAIN_NOT_SUPPORTED'
  | 'CONNECTOR_NOT_FOUND'
  | 'ALREADY_CONNECTED'
  | 'NOT_CONNECTED'
  | 'SWITCH_CHAIN_FAILED'
  | 'UNKNOWN'

export class WalletError extends Error {
  type: WalletErrorType
  
  constructor(type: WalletErrorType, message: string) {
    super(message)
    this.type = type
    this.name = 'WalletError'
  }
}

/**
 * Wallet state interface
 */
export interface WalletState {
  connected: boolean
  address: string | null
  chainId: number | null
  isConnecting: boolean
  connector: string | null
}

/**
 * Connection result
 */
export interface ConnectResult {
  address: string
  chainId: number
  connector: string
}

/**
 * Map wagmi errors to our error types
 */
function mapError(error: unknown): WalletError {
  const message = error instanceof Error ? error.message : String(error)
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('user rejected') || lowerMessage.includes('user denied')) {
    return new WalletError('USER_REJECTED', 'Connection cancelled by user')
  }
  
  if (lowerMessage.includes('chain') && lowerMessage.includes('not supported')) {
    return new WalletError('CHAIN_NOT_SUPPORTED', 'Please switch to HyperEVM network')
  }
  
  if (lowerMessage.includes('no connector') || lowerMessage.includes('connector not found')) {
    return new WalletError('CONNECTOR_NOT_FOUND', 'No wallet detected. Install MetaMask or use mobile.')
  }
  
  if (lowerMessage.includes('already connected')) {
    return new WalletError('ALREADY_CONNECTED', 'Wallet is already connected')
  }
  
  return new WalletError('UNKNOWN', message || 'Connection failed. Please try again.')
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: WalletError): string {
  return error.message
}

/**
 * Initialize wallet - check for existing connection
 * Call this on app startup
 */
export async function initWallet(): Promise<WalletState> {
  try {
    await reconnect(wagmiConfig)
  } catch (e) {
    console.debug('[Wallet] No persisted session to reconnect')
  }
  
  return getWalletState()
}

/**
 * Get current wallet state
 */
export function getWalletState(): WalletState {
  const account = getAccount(wagmiConfig)
  
  return {
    connected: account.isConnected,
    address: account.address ?? null,
    chainId: account.chainId ?? null,
    isConnecting: account.isConnecting,
    connector: account.connector?.name ?? null,
  }
}

/**
 * Get available connectors
 */
export function getAvailableConnectors(): Connector[] {
  return getConnectors(wagmiConfig)
}

/**
 * Connect wallet
 * Opens WalletConnect modal on mobile, uses injected wallet on desktop
 */
export async function connectWallet(preferredConnector?: Connector): Promise<ConnectResult> {
  const account = getAccount(wagmiConfig)
  
  if (account.isConnected) {
    throw new WalletError('ALREADY_CONNECTED', 'Wallet is already connected')
  }
  
  try {
    const connectors = getConnectors(wagmiConfig)

    let connector: Connector | undefined = preferredConnector

    if (!connector) {
      // Priority: WalletConnect first for integrated in-page modal experience
      // Users can select MetaMask or other wallets from within the WalletConnect modal
      connector = connectors.find(c => c.id === 'walletConnect')

      // Fallback to first available if WalletConnect not found
      if (!connector) {
        connector = connectors[0]
      }
    }

    if (!connector) {
      throw new WalletError('CONNECTOR_NOT_FOUND', 'No wallet connector available')
    }

    const result = await connect(wagmiConfig, { connector })
    
    const chainId = result.chainId
    if (!isChainSupported(chainId)) {
      try {
        const defaultChain = getDefaultChain()
        await switchChain(wagmiConfig, { chainId: defaultChain.id })
      } catch (switchError) {
        console.warn('[Wallet] Connected to unsupported chain:', chainId)
      }
    }
    
    const finalAccount = getAccount(wagmiConfig)
    
    return {
      address: finalAccount.address!,
      chainId: finalAccount.chainId!,
      connector: connector.name,
    }
  } catch (error) {
    throw mapError(error)
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  const account = getAccount(wagmiConfig)
  
  if (!account.isConnected) {
    return
  }
  
  try {
    await disconnect(wagmiConfig)
  } catch (error) {
    throw mapError(error)
  }
}

/**
 * Switch to a different chain
 */
export async function switchToChain(chainId: SupportedChainId): Promise<void> {
  const account = getAccount(wagmiConfig)
  
  if (!account.isConnected) {
    throw new WalletError('NOT_CONNECTED', 'Wallet is not connected')
  }
  
  if (!isChainSupported(chainId)) {
    throw new WalletError('CHAIN_NOT_SUPPORTED', `Chain ${chainId} is not supported`)
  }
  
  try {
    await switchChain(wagmiConfig, { chainId })
  } catch (error) {
    throw mapError(error)
  }
}

/**
 * Watch for account changes
 * Returns unsubscribe function
 */
export function onAccountChange(
  callback: (state: WalletState) => void
): () => void {
  return watchAccount(wagmiConfig, {
    onChange: (account) => {
      callback({
        connected: account.isConnected,
        address: account.address ?? null,
        chainId: account.chainId ?? null,
        isConnecting: account.isConnecting,
        connector: account.connector?.name ?? null,
      })
    },
  })
}

/**
 * Check if a specific connector type is available
 */
export function hasConnector(id: 'injected' | 'walletConnect' | 'coinbaseWallet'): boolean {
  const connectors = getConnectors(wagmiConfig)
  return connectors.some(c => c.id === id)
}

/**
 * Get connector by ID
 */
export function getConnector(id: string): Connector | undefined {
  const connectors = getConnectors(wagmiConfig)
  return connectors.find(c => c.id === id)
}
