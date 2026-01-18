import { state, DEFAULT_LAYOUT } from '@app/state'
import { render } from '@app/render'
import { saveUserData } from '@app/storage'
import type { WidgetId, WidgetColumn, WidgetPosition } from '@app/types'

/**
 * Toggles edit mode on/off
 */
export function toggleEditMode(): void {
  state.editMode = !state.editMode
  render()
}

/**
 * Exits edit mode
 */
export function exitEditMode(): void {
  state.editMode = false
  render()
}

/**
 * Updates the full widget layout (positions and columns)
 * Called after drag-drop between or within columns
 */
export function updateWidgetLayout(updates: Array<{ id: WidgetId; column: WidgetColumn; order: number }>): void {
  const updatedWidgets = updates.map(update => {
    const existing = state.layoutConfig.widgets.find(w => w.id === update.id)
    return {
      id: update.id,
      column: update.column,
      order: update.order,
      visible: existing?.visible ?? true,
    }
  })

  state.layoutConfig.widgets = updatedWidgets
  saveUserData()
  render()
}

/**
 * Legacy function - updates order within single column (for mobile buttons)
 */
export function updateWidgetOrder(newOrder: WidgetId[]): void {
  const updatedWidgets = newOrder.map((id, index) => {
    const existing = state.layoutConfig.widgets.find(w => w.id === id)
    return {
      id,
      column: existing?.column ?? 0 as WidgetColumn,
      order: index,
      visible: existing?.visible ?? true,
    }
  })

  state.layoutConfig.widgets = updatedWidgets
  saveUserData()
  render()
}

/**
 * Moves a widget up in the order within its column
 */
export function moveWidgetUp(widgetId: WidgetId): void {
  const widget = state.layoutConfig.widgets.find(w => w.id === widgetId)
  if (!widget) return

  // Get widgets in the same column, sorted by order
  const columnWidgets = state.layoutConfig.widgets
    .filter(w => w.column === widget.column)
    .sort((a, b) => a.order - b.order)

  const currentIndex = columnWidgets.findIndex(w => w.id === widgetId)
  if (currentIndex <= 0) return // Already at top

  // Swap with previous widget
  const prev = columnWidgets[currentIndex - 1]
  if (prev) {
    const tempOrder = widget.order
    widget.order = prev.order
    prev.order = tempOrder
  }

  saveUserData()
  render()
}

/**
 * Moves a widget down in the order within its column
 */
export function moveWidgetDown(widgetId: WidgetId): void {
  const widget = state.layoutConfig.widgets.find(w => w.id === widgetId)
  if (!widget) return

  // Get widgets in the same column, sorted by order
  const columnWidgets = state.layoutConfig.widgets
    .filter(w => w.column === widget.column)
    .sort((a, b) => a.order - b.order)

  const currentIndex = columnWidgets.findIndex(w => w.id === widgetId)
  if (currentIndex < 0 || currentIndex >= columnWidgets.length - 1) return // Already at bottom

  // Swap with next widget
  const next = columnWidgets[currentIndex + 1]
  if (next) {
    const tempOrder = widget.order
    widget.order = next.order
    next.order = tempOrder
  }

  saveUserData()
  render()
}

/**
 * Moves a widget to a different column
 */
export function moveWidgetToColumn(widgetId: WidgetId, targetColumn: WidgetColumn): void {
  const widget = state.layoutConfig.widgets.find(w => w.id === widgetId)
  if (!widget || widget.column === targetColumn) return

  // Get max order in target column
  const targetColumnWidgets = state.layoutConfig.widgets.filter(w => w.column === targetColumn)
  const maxOrder = targetColumnWidgets.length > 0
    ? Math.max(...targetColumnWidgets.map(w => w.order))
    : -1

  widget.column = targetColumn
  widget.order = maxOrder + 1

  // Reorder source column
  const sourceColumnWidgets = state.layoutConfig.widgets
    .filter(w => w.column !== targetColumn && w.id !== widgetId)
    .sort((a, b) => a.order - b.order)
  sourceColumnWidgets.forEach((w, i) => w.order = i)

  saveUserData()
  render()
}

/**
 * Toggles widget visibility
 */
export function toggleWidgetVisibility(widgetId: WidgetId): void {
  const widget = state.layoutConfig.widgets.find(w => w.id === widgetId)
  if (widget) {
    widget.visible = !widget.visible
    saveUserData()
    render()
  }
}

/**
 * Resets layout to default configuration
 */
export function resetLayout(): void {
  state.layoutConfig = structuredClone(DEFAULT_LAYOUT)
  saveUserData()
  render()
}

/**
 * Gets the current widget order as an array of IDs (all columns combined)
 */
export function getWidgetOrder(): WidgetId[] {
  return state.layoutConfig.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order)
    .map(w => w.id)
}
