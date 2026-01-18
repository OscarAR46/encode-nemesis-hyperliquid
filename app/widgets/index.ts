import type { WidgetId, WidgetColumn } from '@app/types'
import { renderMarketWidget } from '@app/widgets/market'
import { renderOrderWidget } from '@app/widgets/order'
import { renderPositionsWidget } from '@app/widgets/positions'
import { renderBridgeWidget } from '@app/widgets/bridge'
import { renderBattleWidget } from '@app/widgets/battle'
import { getVisibleWidgetsSorted, getWidgetsByColumn } from '@app/widgets/base'

// Widget render function registry
const widgetRenderers: Record<WidgetId, () => string> = {
  market: renderMarketWidget,
  order: renderOrderWidget,
  positions: renderPositionsWidget,
  bridge: renderBridgeWidget,
  battle: renderBattleWidget,
}

/**
 * Renders a single widget by its ID
 */
export function renderWidget(widgetId: WidgetId): string {
  const renderer = widgetRenderers[widgetId]
  if (!renderer) {
    console.warn(`[Widgets] Unknown widget ID: ${widgetId}`)
    return ''
  }
  return renderer()
}

/**
 * Renders all visible widgets in their configured order (legacy single column)
 */
export function renderAllWidgets(): string {
  const visibleWidgets = getVisibleWidgetsSorted()
  return visibleWidgets
    .map(w => renderWidget(w.id))
    .join('')
}

/**
 * Renders widgets for a specific column
 */
export function renderColumnWidgets(column: WidgetColumn): string {
  const widgets = getWidgetsByColumn(column)
  return widgets
    .map(w => renderWidget(w.id))
    .join('')
}

// Re-export utilities
export { getVisibleWidgetsSorted, getWidgetsByColumn } from '@app/widgets/base'
export type { WidgetDefinition } from '@app/widgets/base'
