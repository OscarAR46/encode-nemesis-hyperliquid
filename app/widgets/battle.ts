/**
 * Battle Widget - Pear Protocol Pair Trading Arena
 *
 * This widget allows users to:
 * - Select a narrative theme (basket of assets)
 * - Choose battle mode (Solo, 1v1, 2v2, Royale)
 * - Configure stake, leverage, and duration
 * - Execute pair/basket trades via Pear Protocol
 */

import type { WidgetDefinition } from '@app/widgets/base'
import { wrapWidget } from '@app/widgets/base'
import { state } from '@app/state'
import { ICONS } from '@app/icons'
import { formatUSD, truncAddr } from '@app/utils'
import { BATTLE_THEMES, getThemeById, DEFAULT_SHORT_ASSETS } from '@app/pear/themes'
import type { BattleMode, BattleDuration, BattleTheme } from '@app/types'

const battleWidget: WidgetDefinition = {
  id: 'battle',
  title: 'Battle Arena',
  render: renderBattleContent,
}

function getModeIcon(mode: BattleMode): string {
  switch (mode) {
    case 'solo': return ICONS.target
    case 'duel': return ICONS.swords
    case 'team': return ICONS.users
    case 'royale': return ICONS.crown
  }
}

function getModeLabel(mode: BattleMode): string {
  switch (mode) {
    case 'solo': return 'Solo'
    case 'duel': return '1v1'
    case 'team': return '2v2'
    case 'royale': return 'Royale'
  }
}

function getDurationLabel(duration: BattleDuration): string {
  switch (duration) {
    case '1h': return '1H'
    case '4h': return '4H'
    case '24h': return '24H'
    case '7d': return '7D'
  }
}

function getButtonText(): string {
  const { battle } = state
  if (battle.isCreating) return 'Creating...'
  if (!battle.isAuthenticated) return 'CONNECT TO PEAR'
  if (!battle.selectedTheme) return 'SELECT THEME'

  switch (battle.selectedMode) {
    case 'solo': return 'OPEN PAIR TRADE'
    case 'duel': return 'SEND CHALLENGE'
    case 'team': return 'CREATE TEAM BATTLE'
    case 'royale': return 'JOIN BATTLE ROYALE'
  }
}

function renderThemeCard(theme: BattleTheme, isSelected: boolean): string {
  const assetList = theme.assets.map(a => a.symbol).join(' + ')
  return `
    <button class="theme-card ${isSelected ? 'selected' : ''}" data-theme="${theme.id}">
      <span class="theme-icon">${theme.icon}</span>
      <div class="theme-info">
        <span class="theme-name">${theme.name}</span>
        <span class="theme-assets">${assetList}</span>
      </div>
    </button>
  `
}

function renderSelectedTheme(): string {
  const { battle } = state
  if (!battle.selectedTheme) {
    return `
      <button class="theme-selector-btn" id="theme-selector-btn">
        <span class="placeholder">Select your narrative...</span>
        <span class="dropdown-arrow">▼</span>
      </button>
    `
  }

  const theme = getThemeById(battle.selectedTheme)
  if (!theme) return ''

  const assetList = theme.assets.map(a => `${a.symbol} (${(a.weight * 100).toFixed(0)}%)`).join(', ')
  const shortAsset = DEFAULT_SHORT_ASSETS[0]?.symbol ?? 'ETH'

  return `
    <button class="theme-selector-btn selected" id="theme-selector-btn">
      <span class="theme-icon">${theme.icon}</span>
      <span class="theme-name">${theme.name}</span>
      <span class="dropdown-arrow">▼</span>
    </button>
    <div class="theme-details">
      <div class="theme-detail-row">
        <span class="label">Long:</span>
        <span class="value long">${assetList}</span>
      </div>
      <div class="theme-detail-row">
        <span class="label">Short:</span>
        <span class="value short">${shortAsset}</span>
      </div>
    </div>
  `
}

function renderThemeDropdown(): string {
  if (!state.battle.showThemeSelector) return ''

  return `
    <div class="theme-dropdown">
      <div class="theme-dropdown-header">
        <span>Choose Your Narrative</span>
        <button class="theme-dropdown-close" id="theme-dropdown-close">&times;</button>
      </div>
      <div class="theme-grid">
        ${BATTLE_THEMES.map(theme =>
          renderThemeCard(theme, theme.id === state.battle.selectedTheme)
        ).join('')}
      </div>
    </div>
  `
}

function renderVsBanner(): string {
  const { battle } = state
  if (battle.selectedMode === 'solo') return ''

  const theme = battle.selectedTheme ? getThemeById(battle.selectedTheme) : null
  const yourBasket = theme
    ? `${theme.icon} ${theme.name}`
    : '???'

  const opponent = battle.selectedMode === 'duel'
    ? (battle.targetAddress ? truncAddr(battle.targetAddress) : 'Waiting...')
    : 'Other Team'

  return `
    <div class="battle-vs-banner">
      <div class="vs-side yours">
        <span class="vs-label">Your Thesis</span>
        <span class="vs-value">${yourBasket}</span>
      </div>
      <div class="vs-icon">${ICONS.swords}</div>
      <div class="vs-side opponent">
        <span class="vs-label">${battle.selectedMode === 'duel' ? 'Rival' : 'Opponent'}</span>
        <span class="vs-value">${opponent}</span>
      </div>
    </div>
  `
}

function renderActiveBattles(): string {
  const { battle } = state
  if (battle.activeBattles.length === 0) return ''

  return `
    <div class="active-battles">
      <div class="active-battles-header" id="toggle-active-battles">
        <span>${ICONS.zap} Active Battles (${battle.activeBattles.length})</span>
        <span class="dropdown-arrow">${battle.showActiveBattles ? '▲' : '▼'}</span>
      </div>
      ${battle.showActiveBattles ? `
        <div class="active-battles-list">
          ${battle.activeBattles.map(b => `
            <div class="battle-item ${b.status}">
              <div class="battle-item-header">
                <span class="battle-mode">${getModeIcon(b.mode)} ${getModeLabel(b.mode)}</span>
                <span class="battle-pnl ${b.challenger.position.pnl >= 0 ? 'up' : 'down'}">
                  ${b.challenger.position.pnl >= 0 ? '+' : ''}${formatUSD(b.challenger.position.pnl)}
                </span>
              </div>
              <div class="battle-item-details">
                <span>${b.challenger.themeName || 'Custom'}</span>
                <span class="battle-time">${getDurationLabel(b.duration)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

function renderBattleContent(): string {
  const { battle } = state
  const canSubmit = battle.isAuthenticated && battle.selectedTheme && !battle.isCreating

  return `
    <div class="battle-arena">
      <!-- Mode Selection -->
      <div class="battle-modes">
        ${(['solo', 'duel', 'team', 'royale'] as BattleMode[]).map(mode => `
          <button class="battle-mode ${battle.selectedMode === mode ? 'active' : ''}" data-mode="${mode}">
            ${getModeIcon(mode)}
            <span>${getModeLabel(mode)}</span>
          </button>
        `).join('')}
      </div>

      <!-- Theme Selection -->
      <div class="battle-theme-section">
        <label class="form-label">Your Narrative ${ICONS.zap}</label>
        ${renderSelectedTheme()}
        ${renderThemeDropdown()}
      </div>

      <!-- VS Banner (for competitive modes) -->
      ${renderVsBanner()}

      <!-- Target Address (for 1v1) -->
      ${battle.selectedMode === 'duel' ? `
        <div class="form-group">
          <label class="form-label">Challenge Rival</label>
          <div class="form-input-wrap">
            <input type="text" class="form-input" id="battle-target-input"
                   placeholder="0x... or name.eth" value="${battle.targetAddress}">
          </div>
        </div>
      ` : ''}

      <!-- Stake & Config -->
      <div class="battle-config">
        <div class="config-row">
          <div class="form-group half">
            <label class="form-label">Stakes</label>
            <div class="form-input-wrap">
              <input type="number" class="form-input" id="battle-stake-input"
                     value="${battle.stake}" min="10" max="10000" step="10">
              <span class="form-suffix">USDC</span>
            </div>
          </div>
          <div class="form-group half">
            <label class="form-label">Leverage</label>
            <div class="leverage-select">
              ${[1, 2, 3, 5, 10].map(lev => `
                <button class="leverage-btn ${battle.leverage === lev ? 'active' : ''}" data-leverage="${lev}">
                  ${lev}x
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Duration</label>
          <div class="duration-select">
            ${(['1h', '4h', '24h', '7d'] as BattleDuration[]).map(dur => `
              <button class="duration-btn ${battle.selectedDuration === dur ? 'active' : ''}" data-duration="${dur}">
                ${getDurationLabel(dur)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Summary -->
      ${battle.selectedTheme ? `
        <div class="battle-summary">
          <div class="summary-row">
            <span class="label">Position Size</span>
            <span class="value">${formatUSD(battle.stake * battle.leverage)}</span>
          </div>
          <div class="summary-row">
            <span class="label">Max Loss</span>
            <span class="value loss">-${formatUSD(battle.stake)}</span>
          </div>
          <div class="summary-row">
            <span class="label">Potential Gain</span>
            <span class="value profit">Unlimited</span>
          </div>
        </div>
      ` : ''}

      <!-- Error Message -->
      ${battle.createError ? `
        <div class="battle-error">
          ${battle.createError}
        </div>
      ` : ''}

      <!-- Action Button -->
      <button class="battle-submit-btn ${battle.selectedMode}"
              id="battle-submit-btn"
              ${!canSubmit && battle.isAuthenticated ? 'disabled' : ''}>
        ${battle.isCreating ? `<span class="spinner"></span>` : ''}
        ${getButtonText()}
      </button>

      <!-- Powered by Pear -->
      <div class="battle-powered-by">
        Powered by <a href="https://www.pear.garden" target="_blank" rel="noopener">Pear Protocol</a>
      </div>

      <!-- Active Battles -->
      ${renderActiveBattles()}
    </div>
  `
}

export function renderBattleWidget(): string {
  return wrapWidget(battleWidget, battleWidget.render(), 'battle')
}

export default battleWidget
