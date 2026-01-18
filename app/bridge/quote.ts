/**
 * LI.FI Quote/Route Fetching
 * Gets the best route for bridging from source chain to HyperEVM
 */

import { getQuote as lifiGetQuote, getRoutes } from '@lifi/sdk'
import type { QuoteRequest, Route, RoutesRequest } from '@lifi/sdk'
import { HYPEREVM_CHAIN_ID, getLiFiConfig } from './index'
import { SOURCE_CHAINS } from '@config/chains'

export interface QuoteParams {
  fromChainId: number
  toChainId: number
  fromToken: string      // Token address on source chain
  toToken: string        // Token address on destination (HyperEVM)
  fromAmount: string     // Amount in wei/smallest unit
  fromAddress: string    // User's wallet address
  slippage?: number      // Slippage tolerance (0.03 = 3%)
}

export interface QuoteResult {
  route: Route
  fromAmount: string
  toAmount: string
  toAmountMin: string
  estimatedTime: number  // seconds
  gasCosts: string
  feeCosts: string
  steps: RouteStep[]
}

export interface RouteStep {
  type: 'swap' | 'cross' | 'lifi'
  tool: string
  toolLogo?: string
  fromChain: string
  toChain: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
}

export interface QuoteError {
  code: string
  message: string
  recoverable: boolean
}

function getChainName(chainId: number): string {
  const chain = SOURCE_CHAINS.find(c => c.id === chainId)
  if (chain) return chain.name
  if (chainId === 999) return 'HyperEVM'
  if (chainId === 998) return 'HyperEVM Testnet'
  return `Chain ${chainId}`
}

function parseRouteSteps(route: Route): RouteStep[] {
  return route.steps.map(step => ({
    type: step.type as 'swap' | 'cross' | 'lifi',
    tool: step.tool,
    toolLogo: step.toolDetails?.logoURI,
    fromChain: getChainName(step.action.fromChainId),
    toChain: getChainName(step.action.toChainId),
    fromToken: step.action.fromToken.symbol,
    toToken: step.action.toToken.symbol,
    fromAmount: step.action.fromAmount,
    toAmount: step.estimate?.toAmount || '0',
  }))
}

export async function getQuote(params: QuoteParams): Promise<QuoteResult> {
  // Ensure SDK is initialized
  getLiFiConfig()

  const {
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    fromAmount,
    fromAddress,
    slippage = 0.03,  // 3% default slippage
  } = params

  // Validate inputs
  if (!fromAmount || fromAmount === '0') {
    throw createQuoteError('INVALID_AMOUNT', 'Amount must be greater than 0', true)
  }

  if (!fromAddress || !fromAddress.startsWith('0x')) {
    throw createQuoteError('INVALID_ADDRESS', 'Invalid wallet address', true)
  }

  try {
    // Try to get routes first (more flexible)
    const routesRequest: RoutesRequest = {
      fromChainId,
      toChainId,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount,
      fromAddress,
      options: {
        slippage,
        order: 'RECOMMENDED',
        allowSwitchChain: true,
      },
    }

    console.log('[LI.FI] Requesting routes:', routesRequest)

    const routesResponse = await getRoutes(routesRequest)

    if (!routesResponse.routes || routesResponse.routes.length === 0) {
      throw createQuoteError(
        'NO_ROUTES',
        'No routes available for this swap. Try a different token or amount.',
        true
      )
    }

    // Use the best (first) route
    const route = routesResponse.routes[0]

    // Calculate total estimated time
    const estimatedTime = route.steps.reduce((total, step) => {
      return total + (step.estimate?.executionDuration || 0)
    }, 0)

    // Calculate total gas costs
    const gasCosts = route.steps.reduce((total, step) => {
      const gas = step.estimate?.gasCosts?.[0]?.amountUSD || '0'
      return total + parseFloat(gas)
    }, 0).toFixed(2)

    // Calculate fee costs
    const feeCosts = route.steps.reduce((total, step) => {
      const fees = step.estimate?.feeCosts || []
      const feeTotal = fees.reduce((sum, fee) => sum + parseFloat(fee.amountUSD || '0'), 0)
      return total + feeTotal
    }, 0).toFixed(2)

    return {
      route,
      fromAmount: route.fromAmount,
      toAmount: route.toAmount,
      toAmountMin: route.toAmountMin,
      estimatedTime,
      gasCosts,
      feeCosts,
      steps: parseRouteSteps(route),
    }
  } catch (error: any) {
    // Handle LI.FI specific errors
    if (error.code) {
      throw error // Already a QuoteError
    }

    const message = error?.message || 'Failed to get quote'

    if (message.includes('insufficient') || message.includes('balance')) {
      throw createQuoteError('INSUFFICIENT_BALANCE', 'Insufficient balance for this swap', true)
    }

    if (message.includes('not supported') || message.includes('unsupported')) {
      throw createQuoteError('UNSUPPORTED_ROUTE', 'This route is not supported', true)
    }

    throw createQuoteError('QUOTE_FAILED', message, true)
  }
}

function createQuoteError(code: string, message: string, recoverable: boolean): QuoteError {
  return { code, message, recoverable }
}

export async function getAvailableRoutes(params: Omit<QuoteParams, 'slippage'>): Promise<Route[]> {
  getLiFiConfig()

  const routesRequest: RoutesRequest = {
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    fromTokenAddress: params.fromToken,
    toTokenAddress: params.toToken,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    options: {
      slippage: 0.03,
      order: 'RECOMMENDED',
    },
  }

  const response = await getRoutes(routesRequest)
  return response.routes || []
}
