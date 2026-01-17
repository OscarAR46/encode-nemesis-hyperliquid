/**
 * Environment Configuration
 * Centralized environment variable handling with validation
 */

export interface EnvConfig {
  walletConnectProjectId: string
  hyperEvmRpcUrl: string
  hyperEvmTestnetRpcUrl: string
  defaultChainId: number
  isDev: boolean
}

function getEnvVar(key: string, fallback?: string): string {
  // Bun exposes env via process.env at build time
  // For browser, we inject these at build or use defaults
  const value = typeof process !== 'undefined' 
    ? process.env[key] 
    : undefined
  
  if (value) return value
  if (fallback !== undefined) return fallback
  
  console.warn(`[ENV] Missing environment variable: ${key}`)
  return ''
}

function validateConfig(config: EnvConfig): void {
  if (!config.walletConnectProjectId) {
    console.error('[ENV] WALLETCONNECT_PROJECT_ID is required for mobile wallet support')
  }
}

export const env: EnvConfig = {
  walletConnectProjectId: getEnvVar('WALLETCONNECT_PROJECT_ID', '848ad5c914224aacbe89ad4679dbf193'),
  hyperEvmRpcUrl: getEnvVar('HYPEREVM_RPC_URL', 'https://rpc.hyperliquid.xyz/evm'),
  hyperEvmTestnetRpcUrl: getEnvVar('HYPEREVM_TESTNET_RPC_URL', 'https://rpc.hyperliquid-testnet.xyz/evm'),
  defaultChainId: parseInt(getEnvVar('DEFAULT_CHAIN_ID', '998'), 10), // Testnet by default for dev
  isDev: getEnvVar('NODE_ENV', 'development') === 'development',
}

validateConfig(env)

export default env
