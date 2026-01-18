import type { WidgetDefinition } from '@app/widgets/base'
import { wrapWidget } from '@app/widgets/base'
import { state } from '@app/state'
import { ICONS } from '@app/icons'
import { formatUSD, getMarket } from '@app/utils'

const orderWidget: WidgetDefinition = {
  id: 'order',
  title: 'Place Order',
  render: renderOrderContent,
}

function getOrderButtonText(): string {
  switch (state.orderTab) {
    case 'yes': return 'BUY YES'
    case 'no': return 'BUY NO'
    case 'lobby': return 'CREATE LOBBY'
    case 'duel': return 'SEND CHALLENGE'
  }
}

function renderOrderContent(): string {
  const m = getMarket()
  const price = state.orderTab === 'no' ? m.noPrice : m.yesPrice
  const payout = state.stake / price
  const profit = payout - state.stake
  const isLobby = state.orderTab === 'lobby'
  const isDuel = state.orderTab === 'duel'

  return `
    <div class="order-tabs">
      <button class="order-tab yes ${state.orderTab === 'yes' ? 'active' : ''}" data-tab="yes">${ICONS.check} YES</button>
      <button class="order-tab no ${state.orderTab === 'no' ? 'active' : ''}" data-tab="no">${ICONS.cross} NO</button>
      <button class="order-tab lobby ${state.orderTab === 'lobby' ? 'active' : ''}" data-tab="lobby">${ICONS.lobby} Lobby</button>
      <button class="order-tab duel ${state.orderTab === 'duel' ? 'active' : ''}" data-tab="duel">${ICONS.swords} 1v1</button>
    </div>
    <div class="form-group">
      <label class="form-label">Stake Amount</label>
      <div class="form-input-wrap">
        <input type="number" class="form-input" id="stake-input" value="${state.stake}" min="1" step="10">
        <span class="form-suffix">USDC</span>
      </div>
      <input type="range" class="stake-slider" id="stake-slider" min="10" max="1000" step="10" value="${state.stake}">
    </div>
    ${(isLobby || isDuel) ? `
      <div class="form-group">
        <label class="form-label">${isLobby ? 'Invite Friend (Address/ENS)' : 'Challenge Rival (Address/ENS)'}</label>
        <div class="form-input-wrap">
          <input type="text" class="form-input" id="target-input" placeholder="0x... or name.eth" value="${state.targetAddress}">
        </div>
      </div>
    ` : ''}
    <div class="order-summary">
      <div class="summary-row"><span class="label">Price</span><span class="value">${(price * 100).toFixed(0)}¢</span></div>
      <div class="summary-row"><span class="label">Shares</span><span class="value">${payout.toFixed(2)}</span></div>
      <div class="summary-row"><span class="label">Potential Profit</span><span class="value profit">+${formatUSD(profit)}</span></div>
    </div>
    <button class="order-btn ${state.orderTab}" id="order-btn" ${state.processing ? 'disabled' : ''}>
      ${state.processing ? 'Processing...' : getOrderButtonText()}
    </button>
  `
}

export function renderOrderWidget(): string {
  return wrapWidget(orderWidget, orderWidget.render(), 'order')
}

export default orderWidget
