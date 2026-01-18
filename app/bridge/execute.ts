/**
 * LI.FI Bridge Execution
 * Executes the bridge transaction with progress updates
 */

import { executeRoute } from '@lifi/sdk'
import type { Route, RouteExtended } from '@lifi/sdk'
import { getLiFiConfig, clearBridgeSessions, prepareBridge, finishBridge } from './index'
import { getAccount } from '@wagmi/core'
import { wagmiConfig } from '@config/wagmi'
import type { BridgeStep } from '@app/types'

export interface ExecutionCallbacks {
  onStepUpdate?: (step: BridgeStep, index: number, total: number) => void
  onTxHash?: (txHash: string, chainId: number) => void
  onApprovalNeeded?: () => void
  onApprovalComplete?: () => void
  onBridgeStart?: () => void
  onBridgeComplete?: (toAmount: string) => void
  onError?: (error: ExecutionError) => void
}

export interface ExecutionResult {
  success: boolean
  txHash?: string
  toAmount?: string
  toAmountUsd?: string
  explorerLink?: string
}

export interface ExecutionError {
  code: string
  message: string
  step?: string
  recoverable: boolean
  txHash?: string
}

export async function executeBridge(
  route: Route,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  // Ensure SDK is initialized
  getLiFiConfig()

  const account = getAccount(wagmiConfig)
  if (!account.isConnected || !account.address) {
    throw createExecutionError('NOT_CONNECTED', 'Wallet not connected', undefined, true)
  }

  const totalSteps = route.steps.length
  let currentStepIndex = 0

  // Get the source chain from the first step
  const sourceChainId = route.steps[0]?.action?.fromChainId
  if (!sourceChainId) {
    throw createExecutionError('INVALID_ROUTE', 'Route has no source chain', undefined, true)
  }

  try {
    // CRITICAL: Switch to source chain BEFORE executing
    console.log('[Bridge] Preparing bridge from chain:', sourceChainId)
    await prepareBridge(sourceChainId)
    callbacks?.onBridgeStart?.()

    // Execute the route with progress updates
    await executeRoute(route, {
      updateRouteHook: (updatedRoute: RouteExtended) => {
        // Find current executing step
        const executingStep = updatedRoute.steps.find(
          step => step.execution?.status === 'PENDING' || step.execution?.status === 'ACTION_REQUIRED'
        )

        if (executingStep) {
          const stepIndex = updatedRoute.steps.indexOf(executingStep)
          currentStepIndex = stepIndex

          const bridgeStep: BridgeStep = {
            type: executingStep.type as 'swap' | 'cross' | 'lifi',
            tool: executingStep.tool,
            fromChain: getChainName(executingStep.action.fromChainId),
            toChain: getChainName(executingStep.action.toChainId),
            fromToken: executingStep.action.fromToken.symbol,
            toToken: executingStep.action.toToken.symbol,
            status: executingStep.execution?.status === 'PENDING' ? 'active' : 'pending',
          }

          callbacks?.onStepUpdate?.(bridgeStep, stepIndex, totalSteps)

          // Check for tx hash
          const process = executingStep.execution?.process?.[0]
          if (process?.txHash) {
            callbacks?.onTxHash?.(process.txHash, executingStep.action.fromChainId)
          }
        }

        // Check for completion
        const allDone = updatedRoute.steps.every(
          step => step.execution?.status === 'DONE'
        )
        if (allDone) {
          const lastStep = updatedRoute.steps[updatedRoute.steps.length - 1]
          callbacks?.onBridgeComplete?.(lastStep.execution?.toAmount || route.toAmount)
        }
      },

      acceptExchangeRateUpdateHook: async (params) => {
        const originalRate = parseFloat(params.oldToAmount) / parseFloat(route.fromAmount)
        const newRate = parseFloat(params.newToAmount) / parseFloat(route.fromAmount)
        const rateChange = Math.abs(newRate - originalRate) / originalRate

        if (rateChange <= 0.05) {
          console.log('[Bridge] Accepting rate update:', (rateChange * 100).toFixed(2), '%')
          return true
        }

        console.warn('[Bridge] Rate change too large, rejecting:', (rateChange * 100).toFixed(2), '%')
        return false
      },
    })

    // Switch back to HyperEVM after successful bridge
    await finishBridge()

    return {
      success: true,
      toAmount: route.toAmount,
      toAmountUsd: route.toAmountUSD,
    }

  } catch (error: any) {
    console.error('[Bridge] Execution failed:', error)
    const errorMessage = error?.message || ''

    // Try to switch back to HyperEVM even on failure
    try {
      await finishBridge()
    } catch (e) {
      console.warn('[Bridge] Failed to switch back after error:', e)
    }

    // Handle specific error types
    if (errorMessage.includes('session topic') ||
        errorMessage.includes('No matching key') ||
        errorMessage.includes('session expired')) {
      console.warn('[Bridge] WalletConnect session error, clearing sessions...')
      clearBridgeSessions()
      throw createExecutionError(
        'SESSION_EXPIRED',
        'Wallet session expired. Please disconnect and reconnect your wallet.',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
      throw createExecutionError(
        'USER_REJECTED',
        'Transaction cancelled by user',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    if (errorMessage.includes('insufficient') || errorMessage.includes('funds')) {
      throw createExecutionError(
        'INSUFFICIENT_FUNDS',
        'Insufficient funds for transaction',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    if (errorMessage.includes('timeout')) {
      throw createExecutionError(
        'TIMEOUT',
        'Transaction timed out. Check your wallet for pending transactions.',
        route.steps[currentStepIndex]?.tool,
        false
      )
    }

    if (errorMessage.includes('does not match') || errorMessage.includes('chain')) {
      throw createExecutionError(
        'CHAIN_MISMATCH',
        'Please switch your wallet to the correct network and try again.',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    throw createExecutionError(
      'EXECUTION_FAILED',
      errorMessage || 'Bridge execution failed',
      route.steps[currentStepIndex]?.tool,
      true
    )
  }
}

function createExecutionError(
  code: string,
  message: string,
  step: string | undefined,
  recoverable: boolean,
  txHash?: string
): ExecutionError {
  return { code, message, step, recoverable, txHash }
}

function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    42161: 'Arbitrum',
    8453: 'Base',
    137: 'Polygon',
    10: 'Optimism',
    43114: 'Avalanche',
    56: 'BNB Chain',
    999: 'HyperEVM',
    998: 'HyperEVM Testnet',
  }
  return chainNames[chainId] || `Chain ${chainId}`
}

export async function cancelExecution(): Promise<void> {
  console.log('[Bridge] Execution cancellation requested')
  // Try to return to HyperEVM
  try {
    await finishBridge()
  } catch (e) {
    console.warn('[Bridge] Failed to switch back after cancel:', e)
  }
}
