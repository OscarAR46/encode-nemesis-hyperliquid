import type { WidgetDefinition } from '@app/widgets/base'
import { wrapWidget } from '@app/widgets/base'
import { formatTime, formatCompact, getMarket } from '@app/utils'

const marketWidget: WidgetDefinition = {
  id: 'market',
  title: 'Market',
  render: renderMarketContent,
}

function renderMarketContent(): string {
  const m = getMarket()
  const timeLeft = m.expiry - Date.now()

  return `
    <button class="market-btn" id="market-btn">
      <div class="market-asset">${m.asset}</div>
      <div class="market-question">${m.question}</div>
      <div class="market-prices">
        <span class="price-yes">${(m.yesPrice * 100).toFixed(0)}¢ YES</span>
        <span class="price-no">${(m.noPrice * 100).toFixed(0)}¢ NO</span>
      </div>
      <div class="market-meta">${formatTime(timeLeft)} remaining · Vol: ${formatCompact(m.volume)}</div>
    </button>
  `
}

export function renderMarketWidget(): string {
  return wrapWidget(marketWidget, marketWidget.render(), 'market')
}

export default marketWidget
