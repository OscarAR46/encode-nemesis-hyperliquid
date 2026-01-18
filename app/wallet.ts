/**
 * Wallet Manager v2
 * Improved wallet connection with MetaMask detection and connector selection
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
  | 'NO_PROVIDER'
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
 * Connector info for UI display
 */
export interface ConnectorInfo {
  id: string
  name: string
  icon?: string
  detected: boolean
  ready: boolean
  type: 'injected' | 'walletConnect' | 'coinbase' | 'other'
}

// Connector icons as data URIs for reliability
const CONNECTOR_ICONS: Record<string, string> = {
  metamask: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMTIiIGhlaWdodD0iMTg5IiB2aWV3Qm94PSIwIDAgMjEyIDE4OSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cG9seWdvbiBmaWxsPSIjQ0RCREIyIiBwb2ludHM9IjYwLjc1IDE3My4yNSA4OC4zMTMgMTgwLjU2MyA4OC4zMTMgMTcxIDkwLjU2MyAxNjguNzUgMTA2LjMxMyAxNjguNzUgMTA2LjMxMyAxODAgMTA2LjMxMyAxODcuODc1IDg5LjQzOCAxODcuODc1IDY4LjYyNSAxNzguODc1Ii8+PHBvbHlnb24gZmlsbD0iI0NEQkRCMiIgcG9pbnRzPSIxMDUuNzUgMTczLjI1IDEzMi43NSAxODAuNTYzIDEzMi43NSAxNzEgMTM1IDE2OC43NSAxNTAuNzUgMTY4Ljc1IDE1MC43NSAxODAgMTUwLjc1IDE4Ny44NzUgMTMzLjg3NSAxODcuODc1IDEwNS43NSAxNzguODc1IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAyNTYuNSAwKSIvPjxwb2x5Z29uIGZpbGw9IiMzOTM5MzkiIHBvaW50cz0iOTAuNTYzIDE1Mi40MzggODguMzEzIDE3MSA5MS4xMjUgMTY4Ljc1IDEyMC4zNzUgMTY4Ljc1IDEyMy43NSAxNzEgMTIxLjUgMTUyLjQzOCAxMTcgMTQ5LjYyNSA5NC41IDE1MC4xODgiLz48cG9seWdvbiBmaWxsPSIjRjg5QzM1IiBwb2ludHM9Ijc1LjM3NSAyNy41NjMgODguODc1IDU4LjUgOTUuMDYzIDE1MC4xODggMTE3IDE1MC4xODggMTIzLjc1IDU4LjUgMTM2LjEyNSAyNy41NjMiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjE2LjMxMyA5Ni4xODguOTM4IDEzNy41IDM5LjkzOCAxMzcuNSAzNy41IDk0LjUgMzAuMzc1IDkwLjU2MyAzMy43NSA3OS41IDM5LjM3NSA3NC41IDQ2LjQzOCA3NC41IDM0LjEyNSA1OC44NzUgNDYuNDM4IDQ4LjU2MyA0OC45MzggNDMuMzEzIDYxLjEyNSA0OC41NjMgNjEuMTI1IDU3LjM3NSA1OC44NzUgNjYuMTg4IDU3Ljk0NyA2Mi44MTMgNjUuMDYzIDQ0LjQzOCA3NS4zNzUgMjcuNTYzIi8+PHBvbHlnb24gZmlsbD0iI0Q4N0MzMCIgcG9pbnRzPSI0Ni4xMjUgMTAxLjgxMyAzMS44NzUgMTM4LjM3NSA1OS40MzggMTM1IDM5LjkzOCAxMzcuNSIvPjxwb2x5Z29uIGZpbGw9IiNFQThEM0EiIHBvaW50cz0iNDYuMTI1IDEwMS44MTMgNjcuNSA5NC41IDYxLjEyNSA4MS4zNzUiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjMxLjg3NSAxMzguMzc1IDU2LjI1IDEzNS41NjMgMzkuOTM4IDEzNy41Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSI1Ni4yNSAxMzUuNTYzIDQ2LjEyNSAxMDEuODEzIDY3LjUgOTQuNSA2My41NjMgMTMxLjA2MyIvPjxwb2x5Z29uIGZpbGw9IiNGODlEMzUiIHBvaW50cz0iMTcuNDM4IDg4LjMxMyA2NC41IDkxLjEyNSA0Ni4xMjUgMTAxLjgxMyIvPjxwb2x5Z29uIGZpbGw9IiNENjdDMzAiIHBvaW50cz0iMjAuODEzIDUyLjMxMyA0My44NzUgNDguMTg4IDM1LjA2MyA4MS4zNzUgMTcuNDM4IDg4LjMxMyIvPjxwb2x5Z29uIGZpbGw9IiNFQThGMzUiIHBvaW50cz0iMzQuMTI1IDU4Ljg3NSA2NC41IDkxLjEyNSAxNy40MzggODguMzEzIDM1LjA2MyA4MS4zNzUgNDMuODc1IDQ4LjE4OCI+PC9wb2x5Z29uPjxwb2x5Z29uIGZpbGw9IiNFQThGMzUiIHBvaW50cz0iNDYuNDM4IDQ4LjU2MyA3NS4zNzUgMjcuNTYzIDY0LjUgOTEuMTI1IDM0LjEyNSA1OC44NzUgMzUuMDYzIDgxLjM3NSA0My44NzUgNDguMTg4Ii8+PHBvbHlnb24gZmlsbD0iI0Y4OUQzNSIgcG9pbnRzPSIxOTUuMTg4IDk2LjE4OCAyMTEuNSAxMzcuNSAxNzIuMDYzIDEzNy41IDE3NC41IDk0LjUgMTgxLjEyNSA5MC41NjMgMTc3Ljc1IDc5LjUgMTcyLjEyNSA3NC41IDE2NS4wNjMgNzQuNSAxNzcuMzc1IDU4Ljg3NSAxNjUuMDYzIDQ4LjU2MyAxNjIuNTYzIDQzLjMxMyAxNTAuMzc1IDQ4LjU2MyAxNTAuMzc1IDU3LjM3NSAxNTIuNjI1IDY2LjE4OCAxNTMuNTUzIDYyLjgxMyAxNDYuNDM4IDQ0LjQzOCAxMzYuMTI1IDI3LjU2MyIvPjxwb2x5Z29uIGZpbGw9IiNEODdDMzAiIHBvaW50cz0iMTY1LjM3NSAxMDEuODEzIDE3OS42MjUgMTM4LjM3NSAxNTIuMDYzIDEzNSAxNzIuMDYzIDEzNy41Ii8+PHBvbHlnb24gZmlsbD0iI0VBOEQzQSIgcG9pbnRzPSIxNjUuMzc1IDEwMS44MTMgMTQ0IDk0LjUgMTUwLjM3NSA4MS4zNzUiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjE3OS42MjUgMTM4LjM3NSAxNTUuMjUgMTM1LjU2MyAxNzIuMDYzIDEzNy41Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSIxNTUuMjUgMTM1LjU2MyAxNjUuMzc1IDEwMS44MTMgMTQ0IDk0LjUgMTQ3LjkzOCAxMzEuMDYzIi8+PHBvbHlnb24gZmlsbD0iI0Y4OUQzNSIgcG9pbnRzPSIxOTQuMDYzIDg4LjMxMyAxNDcgOTEuMTI1IDE2NS4zNzUgMTAxLjgxMyIvPjxwb2x5Z29uIGZpbGw9IiNENjdDMzAiIHBvaW50cz0iMTkwLjY4OCA1Mi4zMTMgMTY3LjYyNSA0OC4xODggMTc2LjQzOCA4MS4zNzUgMTk0LjA2MyA4OC4zMTMiLz48cG9seWdvbiBmaWxsPSIjRUE4RjM1IiBwb2ludHM9IjE3Ny4zNzUgNTguODc1IDE0NyA5MS4xMjUgMTk0LjA2MyA4OC4zMTMgMTc2LjQzOCA4MS4zNzUgMTY3LjYyNSA0OC4xODgiLz48cG9seWdvbiBmaWxsPSIjRUE4RjM1IiBwb2ludHM9IjE2NS4wNjMgNDguNTYzIDEzNi4xMjUgMjcuNTYzIDE0NyA5MS4xMjUgMTc3LjM3NSA1OC44NzUgMTc2LjQzOCA4MS4zNzUgMTY3LjYyNSA0OC4xODgiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjEwNiAxNTAuMTg4IDkwLjU2MyAxNTIuNDM4IDg4LjMxMyAxMzUgODMuODEzIDEzMi4xODggOTkgMTI5Ljk1NiAxMTYuNDM4IDEyOS45NTYgMTI4LjYyNSAxMzIuMTg4IDEyMy43NSAxMzUgMTIxLjUgMTUyLjQzOCIvPjxwb2x5Z29uIGZpbGw9IiNFQjhGMzUiIHBvaW50cz0iOTAuNTYzIDI1Ljg3NSA4OC44NzUgNTguNSA5NS4wNjMgNjAuNzUgOTUuMDYzIDY2LjU2MyA5MC41NjMgNjkuMzc1IDkwLjU2MyA3NS45MzcgODguMzEzIDc1LjkzNyA5MC41NjMgODAuMDYyIDg4LjMxMyA4Ny4zNzUgNjMuNTYzIDg3LjM3NSA2OS43NSA3MS4yNSA3NC44MTMgNTcuMzc1IDg4Ljg3NSA1OC41Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSIxMjAuOTM4IDI1Ljg3NSAxMjMuMTI1IDU4LjUgMTE2LjkzOCA2MC43NSAxMTYuOTM4IDY2LjU2MyAxMjEuNDM4IDY5LjM3NSAxMjEuNDM4IDc1LjkzNyAxMjMuNjg4IDc1LjkzNyAxMjEuNDM4IDgwLjA2MiAxMjMuNjg4IDg3LjM3NSAxNDguNDM4IDg3LjM3NSAxNDIuMjUgNzEuMjUgMTM3LjE4OCA1Ny4zNzUgMTIzLjEyNSA1OC41IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAyNTYuNSAwKSIvPjxwb2x5Z29uIGZpbGw9IiNCQjgwMzAiIHBvaW50cz0iODguODc1IDU4LjUgNzUuMzc1IDI3LjU2MyA2My41NjMgODcuMzc1IDg4LjMxMyA4Ny4zNzUgOTAuNTYzIDgwLjA2MiA4OC4zMTMgNzUuOTM3IDkwLjU2MyA3NS45MzcgOTAuNTYzIDY5LjM3NSA5NS4wNjMgNjYuNTYzIDk1LjA2MyA2MC43NSIvPjxwb2x5Z29uIGZpbGw9IiNCQjgwMzAiIHBvaW50cz0iMTIzLjEyNSA1OC41IDEzNi4xMjUgMjcuNTYzIDE0OC40MzggODcuMzc1IDEyMy42ODggODcuMzc1IDEyMS40MzggODAuMDYyIDEyMy42ODggNzUuOTM3IDEyMS40MzggNzUuOTM3IDEyMS40MzggNjkuMzc1IDExNi45MzggNjYuNTYzIDExNi45MzggNjAuNzUiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDI1Ni41IDApIi8+PHBvbHlnb24gZmlsbD0iIzg3MzAyQyIgcG9pbnRzPSI3MS4xMjUgNTcuMzc1IDYzLjU2MyA4Ny4zNzUgNjQuNSA5MS4xMjUgMzQuMTI1IDU4Ljg3NSA0Ni40MzggNDguNTYzIDcxLjEyNSA1Ny4zNzUiLz48cG9seWdvbiBmaWxsPSIjODczMDJDIiBwb2ludHM9IjE0MC4zNzUgNTcuMzc1IDE0OC40MzggODcuMzc1IDE0NyA5MS4xMjUgMTc3LjM3NSA1OC44NzUgMTY1LjA2MyA0OC41NjMgMTQwLjM3NSA1Ny4zNzUiIHRyYW5zZm9ybT0ibWF0cml4KC0xIDAgMCAxIDI1Ni41IDApIi8+PC9nPjwvc3ZnPg==',
  walletconnect: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsPSIjM0I5OUZDIiBkPSJNOS44IDE1LjZjNy44LTcuNyAyMC40LTcuNyAyOC4yIDBsLjkuOS0yLjQgMi40LS45LS45Yy02LjEtNi0xNi0xNi0yMi4xIDBsLTEgMS0yLjQtMi40IDEtMXptMzQuOCA2LjZsMS4xIDEuMS0xMC41IDEwLjQtMS4xLTEuMS0uOC0uOEwyNC4xIDIzbC04LjIgOC4yLTEuOS0xLjktLjgtLjhMMS4xIDIzLjMgMi4yIDIyLjIgMjQgMC40bDEyLjUgMTIuNS0uOC44LTEuMS0xLjFjLTYtNS45LTE1LjgtNS45LTIxLjggMGwtOC4yIDguMi0xLjktMS45IDguMi04LjJjNy45LTcuOCAyMC43LTcuOCAyOC41IDBsOC4yIDguMnoiLz48L3N2Zz4=',
  coinbase: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiMwMDUyRkYiIHJ4PSIxMiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNCAxMGMtNy43IDAtMTQgNi4zLTE0IDE0czYuMyAxNCAxNCAxNCAxNC02LjMgMTQtMTQtNi4zLTE0LTE0LTE0em0wIDIyYy00LjQgMC04LTMuNi04LThzMy42LTggOC04IDggMy42IDggOC0zLjYgOC04IDh6Ii8+PC9zdmc+',
  rabby: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiM4MjQ3RTUiIHJ4PSIxMiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0yNCAzNGMtNS41IDAtMTAtNC41LTEwLTEwczQuNS0xMCAxMC0xMCAxMCA0LjUgMTAgMTAtNC41IDEwLTEwIDEweiIvPjwvc3ZnPg==',
}

/**
 * Map wagmi errors to our error types
 */
function mapError(error: unknown): WalletError {
  const message = error instanceof Error ? error.message : String(error)
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('user rejected') || lowerMessage.includes('user denied') || lowerMessage.includes('rejected')) {
    return new WalletError('USER_REJECTED', 'Connection cancelled by user')
  }
  
  if (lowerMessage.includes('chain') && lowerMessage.includes('not supported')) {
    return new WalletError('CHAIN_NOT_SUPPORTED', 'Please switch to a supported network')
  }
  
  if (lowerMessage.includes('no connector') || lowerMessage.includes('connector not found')) {
    return new WalletError('CONNECTOR_NOT_FOUND', 'Wallet not found. Please install a wallet extension.')
  }

  if (lowerMessage.includes('no provider') || lowerMessage.includes('provider not found')) {
    return new WalletError('NO_PROVIDER', 'No wallet provider found. Please install MetaMask or another wallet.')
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
 * Detect if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).ethereum?.isMetaMask
}

/**
 * Detect if any injected wallet is available
 */
export function hasInjectedWallet(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).ethereum
}

/**
 * Get injected wallet name
 */
export function getInjectedWalletName(): string {
  if (typeof window === 'undefined') return 'Browser Wallet'
  const ethereum = (window as any).ethereum
  if (!ethereum) return 'Browser Wallet'
  
  if (ethereum.isMetaMask) return 'MetaMask'
  if (ethereum.isRabby) return 'Rabby'
  if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet'
  if (ethereum.isTrust) return 'Trust Wallet'
  if (ethereum.isPhantom) return 'Phantom'
  if (ethereum.isBraveWallet) return 'Brave Wallet'
  
  return 'Browser Wallet'
}

/**
 * Clear stale WalletConnect sessions from localStorage
 */
function clearStaleWalletConnectSessions(): void {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.startsWith('wc@') ||
      key.startsWith('wagmi') ||
      key.includes('walletconnect')
    )) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.debug('[Wallet] Cleared stale session:', key)
  })
}

/**
 * Initialize wallet - check for existing connection
 * Call this on app startup
 */
export async function initWallet(): Promise<WalletState> {
  try {
    await reconnect(wagmiConfig)
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)

    // Handle stale WalletConnect sessions
    if (errorMessage.includes('session topic') || errorMessage.includes('No matching key')) {
      console.warn('[Wallet] Stale WalletConnect session detected, clearing...')
      clearStaleWalletConnectSessions()
    } else {
      console.debug('[Wallet] No persisted session to reconnect:', errorMessage)
    }
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
 * Get available connectors with display info
 */
export function getAvailableConnectors(): ConnectorInfo[] {
  const connectors = getConnectors(wagmiConfig)
  const hasInjected = hasInjectedWallet()
  const injectedName = getInjectedWalletName()
  
  return connectors.map(connector => {
    const id = connector.id.toLowerCase()
    let type: ConnectorInfo['type'] = 'other'
    let detected = false
    let icon = CONNECTOR_ICONS[id]
    let displayName = connector.name
    
    if (id === 'injected' || id === 'metaMask' || id.includes('metamask')) {
      type = 'injected'
      detected = hasInjected
      displayName = injectedName
      icon = CONNECTOR_ICONS.metamask
      if ((window as any)?.ethereum?.isRabby) {
        icon = CONNECTOR_ICONS.rabby
      }
    } else if (id === 'walletconnect' || id.includes('walletconnect')) {
      type = 'walletConnect'
      icon = CONNECTOR_ICONS.walletconnect
    } else if (id === 'coinbasewallet' || id.includes('coinbase')) {
      type = 'coinbase'
      icon = CONNECTOR_ICONS.coinbase
    }
    
    return {
      id: connector.id,
      name: displayName,
      icon,
      detected,
      ready: true,
      type,
    }
  }).sort((a, b) => {
    // Sort: detected injected first, then WalletConnect, then others
    if (a.detected && a.type === 'injected') return -1
    if (b.detected && b.type === 'injected') return 1
    if (a.type === 'walletConnect') return -1
    if (b.type === 'walletConnect') return 1
    return 0
  })
}

/**
 * Get raw connectors for wagmi operations
 */
export function getRawConnectors(): Connector[] {
  return getConnectors(wagmiConfig)
}

/**
 * Connect wallet using a specific connector ID
 */
export async function connectWalletWithConnector(connectorId: string): Promise<ConnectResult> {
  const account = getAccount(wagmiConfig)
  
  if (account.isConnected) {
    throw new WalletError('ALREADY_CONNECTED', 'Wallet is already connected')
  }

  const connectors = getConnectors(wagmiConfig)
  const connector = connectors.find(c => c.id === connectorId)

  if (!connector) {
    throw new WalletError('CONNECTOR_NOT_FOUND', 'Selected wallet connector not available')
  }

  try {
    console.log('[Wallet] Connecting with:', connector.name)
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
 * Quick connect - auto-selects best available wallet
 * Prioritizes: 1) MetaMask if detected, 2) WalletConnect
 */
export async function connectWallet(): Promise<ConnectResult> {
  const account = getAccount(wagmiConfig)
  
  if (account.isConnected) {
    throw new WalletError('ALREADY_CONNECTED', 'Wallet is already connected')
  }
  
  const connectorInfos = getAvailableConnectors()
  const connectors = getConnectors(wagmiConfig)
  
  // Priority 1: Detected injected wallet (MetaMask, Rabby, etc.)
  const detectedInjected = connectorInfos.find(c => c.detected && c.type === 'injected')
  if (detectedInjected) {
    const connector = connectors.find(c => c.id === detectedInjected.id)
    if (connector) {
      return connectWalletWithConnector(connector.id)
    }
  }
  
  // Priority 2: WalletConnect (works on mobile, shows QR)
  const walletConnect = connectorInfos.find(c => c.type === 'walletConnect')
  if (walletConnect) {
    const connector = connectors.find(c => c.id === walletConnect.id)
    if (connector) {
      return connectWalletWithConnector(connector.id)
    }
  }
  
  // Priority 3: First available connector
  if (connectors.length > 0) {
    return connectWalletWithConnector(connectors[0].id)
  }
  
  throw new WalletError('CONNECTOR_NOT_FOUND', 'No wallet connector available')
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
  return connectors.some(c => c.id === id || c.id.toLowerCase().includes(id.toLowerCase()))
}

/**
 * Get connector by ID
 */
export function getConnector(id: string): Connector | undefined {
  const connectors = getConnectors(wagmiConfig)
  return connectors.find(c => c.id === id)
}
