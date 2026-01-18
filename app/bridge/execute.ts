/**
 * LI.FI Bridge Execution
 * Executes the bridge transaction with progress updates
 */

import { executeRoute } from '@lifi/sdk'
import type { Route, RouteExtended } from '@lifi/sdk'
import { getLiFiConfig, clearBridgeSessions } from './index'
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

  try {
    // Execute the route with progress updates
    const executionResult = await executeRoute(route, {
      // Update hook for progress tracking
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

      // Note: Chain switching is handled by the EVM provider configured in index.ts
      // The switchChainHook there properly returns the WalletClient after switching

      // Accept exchange rate updates within tolerance
      acceptExchangeRateUpdateHook: async (params) => {
        // Auto-accept if the new rate is within 5% of original
        const originalRate = parseFloat(params.oldToAmount) / parseFloat(route.fromAmount)
        const newRate = parseFloat(params.newToAmount) / parseFloat(route.fromAmount)
        const rateChange = Math.abs(newRate - originalRate) / originalRate

        if (rateChange <= 0.05) {
          console.log('[Bridge] Accepting rate update:', rateChange * 100, '%')
          return true
        }

        console.warn('[Bridge] Rate change too large, rejecting:', rateChange * 100, '%')
        return false
      },
    })

    // Extract final result
    const lastStep = route.steps[route.steps.length - 1]
    const txHash = lastStep.transactionRequest?.data
      ? undefined // Will be set by execution
      : undefined

    return {
      success: true,
      toAmount: route.toAmount,
      toAmountUsd: route.toAmountUSD,
    }

  } catch (error: any) {
    console.error('[Bridge] Execution failed:', error)
    const errorMessage = error?.message || ''

    // Handle WalletConnect session errors
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

    // Handle user rejection
    if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
      throw createExecutionError(
        'USER_REJECTED',
        'Transaction cancelled by user',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    // Handle insufficient funds
    if (errorMessage.includes('insufficient') || errorMessage.includes('funds')) {
      throw createExecutionError(
        'INSUFFICIENT_FUNDS',
        'Insufficient funds for transaction',
        route.steps[currentStepIndex]?.tool,
        true
      )
    }

    // Handle timeout
    if (errorMessage.includes('timeout')) {
      throw createExecutionError(
        'TIMEOUT',
        'Transaction timed out. Check your wallet for pending transactions.',
        route.steps[currentStepIndex]?.tool,
        false
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
  // LI.FI SDK doesn't have a direct cancel method
  // The user can reject transactions in their wallet
  console.log('[Bridge] Execution cancellation requested')
}
