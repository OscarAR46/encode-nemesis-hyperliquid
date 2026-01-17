/**
 * Configuration exports
 */

export { env } from './env'
export { 
  hyperEvmMainnet, 
  hyperEvmTestnet, 
  supportedChains,
  getChainById,
  isChainSupported,
  getDefaultChain,
  type SupportedChainId 
} from './chains'
export { wagmiConfig, type WagmiConfig } from './wagmi'
