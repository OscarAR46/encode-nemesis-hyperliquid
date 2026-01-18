/**
 * Bridge Widget
 * One-click onboarding to HyperEVM via LI.FI
 */

import { state } from '@app/state'
import { ICONS } from '@app/icons'
import { wrapInPanel } from '@app/widgets/base'
import { SOURCE_CHAINS, COMMON_TOKENS } from '@config/chains'
import type { BridgeStep, SourceToken } from '@app/types'

export function renderBridgeWidget(): string {
  const content = renderBridgeContent()
  return wrapInPanel('bridge', ':: Bridge to HyperEVM ::', content, {
    icon: ICONS.bridge || '🌉',
    collapsible: true,
    collapsed: !state.panelStates.bridge,
  })
}

function renderBridgeContent(): string {
  const { bridge } = state

  // Not connected state
  if (!state.connected) {
    return `
      <div class="bridge-connect-prompt">
        <div class="bridge-icon">${ICONS.wallet}</div>
        <p>Connect your wallet to bridge assets to HyperEVM</p>
        <button class="bridge-connect-btn" id="bridge-connect-btn">
          Connect Wallet
        </button>
      </div>
    `
  }

  // Success state
  if (bridge.status === 'success') {
    return renderSuccessState()
  }

  // Failed state
  if (bridge.status === 'failed') {
    return renderFailedState()
  }

  // Executing state (approving, pending, confirming)
  if (['approving', 'pending', 'confirming'].includes(bridge.status)) {
    return renderExecutingState()
  }

  // Default: selection/quoting state
  return renderSelectionState()
}

function renderSelectionState(): string {
  const { bridge } = state
  const selectedChain = SOURCE_CHAINS.find(c => c.id === bridge.sourceChainId)
  const tokens = bridge.sourceChainId ? COMMON_TOKENS[bridge.sourceChainId] || [] : []

  return `
    <div class="bridge-form">
      <!-- From Section -->
      <div class="bridge-section">
        <label class="bridge-label">From</label>

        <div class="bridge-chain-select">
          <button class="bridge-dropdown-btn" id="bridge-chain-dropdown">
            ${selectedChain
              ? `<span class="chain-icon">${selectedChain.icon}</span><span>${selectedChain.name}</span>`
              : '<span class="placeholder">Select Chain</span>'
            }
            <span class="dropdown-arrow">▼</span>
          </button>
          ${state.showBridgePanel ? renderChainDropdown() : ''}
        </div>

        ${bridge.sourceChainId ? `
          <div class="bridge-token-select">
            <button class="bridge-dropdown-btn" id="bridge-token-dropdown">
              ${bridge.sourceToken
                ? `<span class="token-icon">${bridge.sourceToken.icon}</span><span>${bridge.sourceToken.symbol}</span>`
                : '<span class="placeholder">Select Token</span>'
              }
              <span class="dropdown-arrow">▼</span>
            </button>
          </div>

          <div class="bridge-amount-input">
            <input
              type="number"
              id="bridge-amount-input"
              class="bridge-input"
              placeholder="0.00"
              value="${bridge.amount}"
              step="0.001"
              min="0"
            />
            ${bridge.sourceToken?.balance ? `
              <button class="bridge-max-btn" id="bridge-max-btn">MAX</button>
            ` : ''}
          </div>

          ${bridge.sourceToken?.balance ? `
            <div class="bridge-balance">
              Balance: ${bridge.sourceToken.balance} ${bridge.sourceToken.symbol}
            </div>
          ` : ''}
        ` : ''}
      </div>

      <!-- Arrow -->
      <div class="bridge-arrow">
        <span class="arrow-icon">↓</span>
      </div>

      <!-- To Section -->
      <div class="bridge-section">
        <label class="bridge-label">To HyperEVM</label>

        <div class="bridge-destination">
          <div class="bridge-chain-display">
            <span class="chain-icon">🌀</span>
            <span>HyperEVM</span>
          </div>

          <div class="bridge-dest-token-select">
            <button class="bridge-dest-token-btn ${bridge.destinationToken === 'HYPE' ? 'active' : ''}" data-token="HYPE">
              HYPE
            </button>
            <button class="bridge-dest-token-btn ${bridge.destinationToken === 'USDC' ? 'active' : ''}" data-token="USDC">
              USDC
            </button>
          </div>
        </div>
      </div>

      <!-- Quote Section -->
      ${renderQuoteSection()}

      <!-- Action Button -->
      ${renderActionButton()}

      <!-- Powered by LI.FI -->
      <div class="bridge-powered-by">
        Powered by <a href="https://li.fi" target="_blank" rel="noopener">LI.FI</a>
      </div>
    </div>
  `
}

function renderChainDropdown(): string {
  return `
    <div class="bridge-dropdown-menu" id="bridge-chain-menu">
      ${SOURCE_CHAINS.map(chain => `
        <button class="bridge-dropdown-item ${chain.id === state.bridge.sourceChainId ? 'selected' : ''}"
                data-chain-id="${chain.id}">
          <span class="chain-icon">${chain.icon}</span>
          <span class="chain-name">${chain.name}</span>
        </button>
      `).join('')}
    </div>
  `
}

function renderTokenDropdown(): string {
  const tokens = state.bridge.sourceChainId
    ? COMMON_TOKENS[state.bridge.sourceChainId] || []
    : []

  return `
    <div class="bridge-dropdown-menu" id="bridge-token-menu">
      ${tokens.map(token => `
        <button class="bridge-dropdown-item ${token.address === state.bridge.sourceToken?.address ? 'selected' : ''}"
                data-token-address="${token.address}"
                data-token-symbol="${token.symbol}"
                data-token-decimals="${token.decimals}"
                data-token-icon="${token.icon}"
                data-token-name="${token.name}">
          <span class="token-icon">${token.icon}</span>
          <span class="token-info">
            <span class="token-symbol">${token.symbol}</span>
            <span class="token-name">${token.name}</span>
          </span>
        </button>
      `).join('')}
    </div>
  `
}

function renderQuoteSection(): string {
  const { bridge } = state

  if (bridge.isLoadingQuote) {
    return `
      <div class="bridge-quote bridge-quote-loading">
        <div class="bridge-spinner"></div>
        <span>Finding best route...</span>
      </div>
    `
  }

  if (bridge.quoteError) {
    return `
      <div class="bridge-quote bridge-quote-error">
        <span class="error-icon">⚠️</span>
        <span>${bridge.quoteError}</span>
      </div>
    `
  }

  if (bridge.quote) {
    const { quote } = bridge
    return `
      <div class="bridge-quote">
        <div class="quote-row">
          <span class="quote-label">You'll receive</span>
          <span class="quote-value quote-receive">${formatAmount(quote.toAmount)} ${bridge.destinationToken}</span>
        </div>
        <div class="quote-row">
          <span class="quote-label">Minimum received</span>
          <span class="quote-value">${formatAmount(quote.toAmountMin)} ${bridge.destinationToken}</span>
        </div>
        <div class="quote-row">
          <span class="quote-label">Estimated time</span>
          <span class="quote-value">${formatTime(quote.estimatedTime)}</span>
        </div>
        <div class="quote-row">
          <span class="quote-label">Network fees</span>
          <span class="quote-value">~$${quote.gasCosts}</span>
        </div>
        ${parseFloat(quote.feeCosts) > 0 ? `
          <div class="quote-row">
            <span class="quote-label">Bridge fees</span>
            <span class="quote-value">~$${quote.feeCosts}</span>
          </div>
        ` : ''}

        ${quote.steps.length > 0 ? `
          <div class="quote-route">
            <span class="route-label">Route:</span>
            <div class="route-steps">
              ${quote.steps.map((step, i) => `
                <span class="route-step">
                  ${step.tool}${i < quote.steps.length - 1 ? ' → ' : ''}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  return ''
}

function renderActionButton(): string {
  const { bridge } = state

  // Check if ready to get quote
  const canGetQuote = bridge.sourceChainId &&
                      bridge.sourceToken &&
                      bridge.amount &&
                      parseFloat(bridge.amount) > 0

  // Check if ready to execute
  const canExecute = bridge.quote && bridge.status === 'idle'

  if (bridge.isLoadingQuote) {
    return `
      <button class="bridge-action-btn disabled" disabled>
        <span class="bridge-spinner-small"></span>
        Getting Quote...
      </button>
    `
  }

  if (bridge.quote) {
    return `
      <button class="bridge-action-btn bridge-execute-btn" id="bridge-execute-btn">
        Bridge to HyperEVM
      </button>
    `
  }

  if (canGetQuote) {
    return `
      <button class="bridge-action-btn" id="bridge-quote-btn">
        Get Quote
      </button>
    `
  }

  return `
    <button class="bridge-action-btn disabled" disabled>
      ${!bridge.sourceChainId ? 'Select a chain' :
        !bridge.sourceToken ? 'Select a token' :
        'Enter an amount'}
    </button>
  `
}

function renderExecutingState(): string {
  const { bridge } = state

  return `
    <div class="bridge-executing">
      <div class="bridge-executing-header">
        <div class="bridge-spinner-large"></div>
        <h3>${getStatusTitle(bridge.status)}</h3>
        <p>${getStatusDescription(bridge.status)}</p>
      </div>

      <div class="bridge-steps">
        ${bridge.steps.map((step, index) => renderStepItem(step, index)).join('')}
      </div>

      ${bridge.txHash ? `
        <div class="bridge-tx-info">
          <span class="tx-label">Transaction:</span>
          <a href="${bridge.explorerLink || '#'}" target="_blank" rel="noopener" class="tx-link">
            ${truncateHash(bridge.txHash)}
          </a>
        </div>
      ` : ''}

      <div class="bridge-note">
        <span class="note-icon">ℹ️</span>
        <span>Please don't close this window until the bridge completes.</span>
      </div>
    </div>
  `
}

function renderStepItem(step: BridgeStep, index: number): string {
  const statusIcon = {
    pending: '○',
    active: '◉',
    complete: '✓',
    failed: '✗',
  }[step.status]

  return `
    <div class="bridge-step step-${step.status}">
      <span class="step-icon">${statusIcon}</span>
      <div class="step-info">
        <span class="step-title">${step.type === 'approve' ? 'Approve' : step.tool}</span>
        <span class="step-detail">${step.fromChain} → ${step.toChain}</span>
      </div>
    </div>
  `
}

function renderSuccessState(): string {
  const { bridge } = state

  return `
    <div class="bridge-success">
      <div class="success-icon">✓</div>
      <h3>Bridge Complete!</h3>
      <p class="success-amount">${formatAmount(bridge.finalAmount || '0')} ${bridge.destinationToken}</p>
      <p class="success-subtitle">has been bridged to HyperEVM</p>

      ${bridge.explorerLink ? `
        <a href="${bridge.explorerLink}" target="_blank" rel="noopener" class="success-explorer-link">
          View on Explorer →
        </a>
      ` : ''}

      <button class="bridge-action-btn bridge-new-btn" id="bridge-new-btn">
        Bridge More
      </button>

      <div class="success-next-steps">
        <p>Now you can:</p>
        <ul>
          <li>Trade on Hyperliquid perpetuals</li>
          <li>Explore prediction markets</li>
          <li>Participate in duels</li>
        </ul>
      </div>
    </div>
  `
}

function renderFailedState(): string {
  const { bridge } = state

  return `
    <div class="bridge-failed">
      <div class="failed-icon">✗</div>
      <h3>Bridge Failed</h3>
      <p class="failed-message">${bridge.error || 'An error occurred during the bridge.'}</p>

      ${bridge.txHash ? `
        <a href="${bridge.explorerLink || '#'}" target="_blank" rel="noopener" class="failed-explorer-link">
          View Transaction →
        </a>
      ` : ''}

      <div class="failed-actions">
        <button class="bridge-action-btn" id="bridge-retry-btn">
          Try Again
        </button>
        <button class="bridge-secondary-btn" id="bridge-reset-btn">
          Start Over
        </button>
      </div>
    </div>
  `
}

// Helper functions
function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  if (num >= 1) return num.toFixed(4)
  return num.toFixed(6)
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} min`
  return `~${(seconds / 3600).toFixed(1)} hr`
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 20) return hash
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

function getStatusTitle(status: string): string {
  switch (status) {
    case 'approving': return 'Approving Token...'
    case 'pending': return 'Transaction Pending...'
    case 'confirming': return 'Confirming Bridge...'
    default: return 'Processing...'
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'approving': return 'Please approve the token spend in your wallet'
    case 'pending': return 'Please confirm the transaction in your wallet'
    case 'confirming': return 'Waiting for bridge confirmation'
    default: return 'Please wait...'
  }
}
