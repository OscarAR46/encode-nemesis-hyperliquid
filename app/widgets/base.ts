import type { WidgetId, WidgetPosition, WidgetColumn } from '@app/types'
import { state } from '@app/state'
import { ICONS } from '@app/icons'

export interface WidgetDefinition {
  id: WidgetId
  title: string
  render: () => string
}

/**
 * Wraps widget content in a panel container with proper attributes
 * Handles collapsed state and edit mode styling
 */
export function wrapWidget(
  widget: WidgetDefinition,
  content: string,
  panelKey: keyof typeof state.panelStates
): string {
  const isCollapsed = !state.panelStates[panelKey]
  const collapsedClass = isCollapsed ? ' collapsed' : ''

  return `
    <div class="panel${collapsedClass}" data-widget-id="${widget.id}">
      <div class="panel-head" data-panel="${panelKey}">
        <span class="panel-title">${widget.title}</span>
        ${state.editMode ? renderEditControls(widget.id) : ''}
        <span class="panel-toggle">${ICONS.chevron}</span>
      </div>
      <div class="panel-body">
        ${content}
      </div>
    </div>
  `
}

/**
 * Renders mobile reorder controls for edit mode
 */
function renderEditControls(widgetId: WidgetId): string {
  const widgets = state.layoutConfig.widgets.filter(w => w.visible)
  const currentIndex = widgets.findIndex(w => w.id === widgetId)
  const isFirst = currentIndex === 0
  const isLast = currentIndex === widgets.length - 1

  return `
    <span class="widget-edit-controls">
      <button class="widget-move-btn${isFirst ? ' disabled' : ''}" data-action="move-up" data-widget="${widgetId}" ${isFirst ? 'disabled' : ''}>
        ${ICONS.chevron}
      </button>
      <button class="widget-move-btn${isLast ? ' disabled' : ''}" data-action="move-down" data-widget="${widgetId}" ${isLast ? 'disabled' : ''}>
        ${ICONS.chevron}
      </button>
    </span>
  `
}

/**
 * Gets visible widgets sorted by their order
 */
export function getVisibleWidgetsSorted(): WidgetPosition[] {
  return state.layoutConfig.widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order)
}

/**
 * Gets visible widgets for a specific column, sorted by order
 */
export function getWidgetsByColumn(column: WidgetColumn): WidgetPosition[] {
  return state.layoutConfig.widgets
    .filter(w => w.visible && w.column === column)
    .sort((a, b) => a.order - b.order)
}

/**
 * Panel options for wrapping content
 */
export interface PanelOptions {
  icon?: string
  collapsible?: boolean
  collapsed?: boolean
}

/**
 * Simple panel wrapper for widgets
 * Creates a consistent panel structure with optional header icon
 */
export function wrapInPanel(
  widgetId: WidgetId,
  title: string,
  content: string,
  options?: PanelOptions
): string {
  const panelKey = widgetId as keyof typeof state.panelStates
  const isCollapsed = options?.collapsed ?? !state.panelStates[panelKey]
  const collapsedClass = isCollapsed ? ' collapsed' : ''

  return `
    <div class="panel${collapsedClass}" data-widget-id="${widgetId}">
      <div class="panel-head" data-panel="${panelKey}">
        ${options?.icon ? `<span class="panel-icon">${options.icon}</span>` : ''}
        <span class="panel-title">${title}</span>
        ${state.editMode ? renderEditControls(widgetId) : ''}
        ${options?.collapsible !== false ? `<span class="panel-toggle">${ICONS.chevron}</span>` : ''}
      </div>
      <div class="panel-body">
        ${content}
      </div>
    </div>
  `
}
