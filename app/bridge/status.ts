/**
 * LI.FI Bridge Status Tracking
 * Monitor ongoing bridge transactions
 */

import { getStatus } from '@lifi/sdk'
import type { StatusResponse } from '@lifi/sdk'
import { getLiFiConfig } from './index'

export interface BridgeStatusParams {
  txHash: string
  bridge: string       // The bridge tool name (e.g., 'hop', 'stargate')
  fromChain: number
  toChain: number
}

export interface BridgeStatusResult {
  status: 'PENDING' | 'DONE' | 'FAILED' | 'NOT_FOUND' | 'INVALID'
  substatus?: string
  sending?: TransactionInfo
  receiving?: TransactionInfo
  bridgeExplorerLink?: string
  fromAmount?: string
  toAmount?: string
  error?: string
}

export interface TransactionInfo {
  txHash: string
  txLink?: string
  amount: string
  token: string
  chainId: number
  timestamp?: number
}

export async function getBridgeStatus(params: BridgeStatusParams): Promise<BridgeStatusResult> {
  getLiFiConfig()

  try {
    const response = await getStatus({
      txHash: params.txHash,
      bridge: params.bridge,
      fromChain: params.fromChain,
      toChain: params.toChain,
    })

    return mapStatusResponse(response)
  } catch (error: any) {
    console.error('[Bridge] Status check failed:', error)

    if (error?.message?.includes('not found')) {
      return {
        status: 'NOT_FOUND',
        error: 'Transaction not found. It may still be processing.',
      }
    }

    return {
      status: 'INVALID',
      error: error?.message || 'Failed to get status',
    }
  }
}

function mapStatusResponse(response: StatusResponse): BridgeStatusResult {
  const result: BridgeStatusResult = {
    status: mapLiFiStatus(response.status),
    substatus: response.substatus,
    bridgeExplorerLink: response.bridgeExplorerLink,
  }

  // Map sending transaction
  if (response.sending) {
    result.sending = {
      txHash: response.sending.txHash || '',
      txLink: response.sending.txLink,
      amount: response.sending.amount || '0',
      token: response.sending.token?.symbol || 'Unknown',
      chainId: response.sending.chainId || 0,
      timestamp: response.sending.timestamp,
    }
    result.fromAmount = response.sending.amount
  }

  // Map receiving transaction
  if (response.receiving) {
    result.receiving = {
      txHash: response.receiving.txHash || '',
      txLink: response.receiving.txLink,
      amount: response.receiving.amount || '0',
      token: response.receiving.token?.symbol || 'Unknown',
      chainId: response.receiving.chainId || 0,
      timestamp: response.receiving.timestamp,
    }
    result.toAmount = response.receiving.amount
  }

  return result
}

function mapLiFiStatus(status: string): BridgeStatusResult['status'] {
  switch (status) {
    case 'DONE':
      return 'DONE'
    case 'FAILED':
      return 'FAILED'
    case 'NOT_FOUND':
      return 'NOT_FOUND'
    case 'PENDING':
    case 'ACTION_REQUIRED':
    default:
      return 'PENDING'
  }
}

// Poll for status updates
export async function pollBridgeStatus(
  params: BridgeStatusParams,
  onUpdate: (status: BridgeStatusResult) => void,
  options?: {
    interval?: number      // Polling interval in ms (default 5000)
    maxAttempts?: number   // Max polling attempts (default 120 = 10 minutes)
  }
): Promise<BridgeStatusResult> {
  const interval = options?.interval || 5000
  const maxAttempts = options?.maxAttempts || 120

  let attempts = 0

  return new Promise((resolve, reject) => {
    const poll = async () => {
      attempts++

      try {
        const status = await getBridgeStatus(params)
        onUpdate(status)

        if (status.status === 'DONE' || status.status === 'FAILED') {
          resolve(status)
          return
        }

        if (attempts >= maxAttempts) {
          resolve({
            status: 'PENDING',
            error: 'Status polling timed out. The bridge may still complete.',
          })
          return
        }

        setTimeout(poll, interval)
      } catch (error: any) {
        if (attempts >= maxAttempts) {
          reject(error)
          return
        }

        // Continue polling on transient errors
        setTimeout(poll, interval)
      }
    }

    poll()
  })
}

// Get explorer link for a transaction
export function getExplorerLink(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx/',
    42161: 'https://arbiscan.io/tx/',
    8453: 'https://basescan.org/tx/',
    137: 'https://polygonscan.com/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
    43114: 'https://snowtrace.io/tx/',
    56: 'https://bscscan.com/tx/',
    999: 'https://explorer.hyperliquid.xyz/tx/',
    998: 'https://explorer.hyperliquid-testnet.xyz/tx/',
  }

  const base = explorers[chainId] || 'https://etherscan.io/tx/'
  return `${base}${txHash}`
}
