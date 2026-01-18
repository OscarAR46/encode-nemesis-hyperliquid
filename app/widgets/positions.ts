import type { WidgetDefinition } from '@app/widgets/base'
import { wrapWidget } from '@app/widgets/base'
import { state } from '@app/state'
import { formatUSD } from '@app/utils'

const positionsWidget: WidgetDefinition = {
  id: 'positions',
  title: 'Positions',
  render: renderPositionsContent,
}

function renderPositionsContent(): string {
  const openCount = state.positions.filter(p => p.status === 'open').length
  const orderCount = state.orders.filter(o => o.status === 'pending').length

  let posContent = ''
  if (state.posTab === 'positions') {
    const open = state.positions.filter(p => p.status === 'open')
    posContent = open.length === 0
      ? '<div class="empty">No open positions</div>'
      : open.map(p => `
          <div class="pos-item" data-id="${p.id}">
            <div class="pos-header">
              <span class="pos-market">${p.market}</span>
              <span class="pos-side ${p.side}">${p.side.toUpperCase()}</span>
            </div>
            <div class="pos-details">
              <span>${formatUSD(p.size)} @ ${(p.entry * 100).toFixed(0)}¢</span>
              <span class="pos-pnl ${p.pnl >= 0 ? 'up' : 'down'}">${p.pnl >= 0 ? '+' : ''}${formatUSD(p.pnl)}</span>
            </div>
            <button class="pos-close" data-id="${p.id}">Close Position</button>
          </div>
        `).join('')
  } else if (state.posTab === 'orders') {
    const pending = state.orders.filter(o => o.status === 'pending')
    posContent = pending.length === 0
      ? '<div class="empty">No pending orders</div>'
      : pending.map(o => `
          <div class="pos-item">
            <div class="pos-header">
              <span class="pos-market">${o.market}</span>
              <span class="pos-side ${o.side}">${o.side.toUpperCase()}</span>
            </div>
            <div class="pos-details">
              <span>${formatUSD(o.size)} @ ${(o.price * 100).toFixed(0)}¢</span>
              <span>Pending</span>
            </div>
          </div>
        `).join('')
  } else {
    posContent = state.history.length === 0
      ? '<div class="empty">No trade history</div>'
      : state.history.map(h => `
          <div class="pos-item">
            <div class="pos-header">
              <span class="pos-market">${h.market}</span>
              <span class="pos-side ${h.side}">${h.side.toUpperCase()}</span>
            </div>
            <div class="pos-details">
              <span>${formatUSD(h.size)}</span>
              <span class="pos-pnl ${h.pnl >= 0 ? 'up' : 'down'}">${h.pnl >= 0 ? '+' : ''}${formatUSD(h.pnl)}</span>
            </div>
          </div>
        `).join('')
  }

  return `
    <div class="pos-tabs">
      <button class="pos-tab ${state.posTab === 'positions' ? 'active' : ''}" data-tab="positions">
        Open <span class="cnt">${openCount}</span>
      </button>
      <button class="pos-tab ${state.posTab === 'orders' ? 'active' : ''}" data-tab="orders">
        Orders <span class="cnt">${orderCount}</span>
      </button>
      <button class="pos-tab ${state.posTab === 'history' ? 'active' : ''}" data-tab="history">
        History
      </button>
    </div>
    <div class="pos-list">${posContent}</div>
  `
}

export function renderPositionsWidget(): string {
  return wrapWidget(positionsWidget, positionsWidget.render(), 'positions')
}

export default positionsWidget
