import Sortable from 'sortablejs'
import { state } from '@app/state'
import { updateWidgetLayout } from '@app/layout/manager'
import type { WidgetId, WidgetColumn } from '@app/types'

let sortableInstances: Sortable[] = []
let pendingInit = false
let isDragging = false

/**
 * Initializes or reinitializes Sortable.js on widget columns
 * Uses requestAnimationFrame to ensure DOM is ready
 */
export function initDragDrop(): void {
  // Don't reinitialize while dragging - causes errors
  if (isDragging) return

  // Prevent multiple pending inits
  if (pendingInit) return
  pendingInit = true

  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    pendingInit = false
    if (!isDragging) {
      initDragDropImmediate()
    }
  })
}

/**
 * Immediate initialization - call only when DOM is ready
 */
function initDragDropImmediate(): void {
  // Clean up existing instances
  destroyDragDrop()

  // Only initialize in edit mode
  if (!state.editMode) return

  const columns = document.querySelectorAll('.widget-column')
  if (columns.length === 0) {
    // DOM not ready yet, try again
    requestAnimationFrame(() => initDragDropImmediate())
    return
  }

  // Create Sortable for each column with shared group
  columns.forEach((column) => {
    const sortable = Sortable.create(column as HTMLElement, {
      animation: 150,
      group: 'widgets', // Allow dragging between columns
      draggable: '.panel',

      // Visual feedback classes
      ghostClass: 'widget-ghost',
      chosenClass: 'widget-chosen',
      dragClass: 'widget-dragging',

      // Swap threshold
      swapThreshold: 0.65,
      invertSwap: true,
      direction: 'vertical',

      // Disable drag on interactive elements
      filter: '.widget-move-btn, .order-btn, .pos-close, .order-tab, .pos-tab, .form-input, .stake-slider, button, input',
      preventOnFilter: false,

      onStart: () => {
        isDragging = true
        document.body.classList.add('dragging')
      },

      onEnd: () => {
        document.body.classList.remove('dragging')

        // Build new layout from DOM
        const layoutUpdate: Array<{ id: WidgetId; column: WidgetColumn; order: number }> = []

        document.querySelectorAll('.widget-column').forEach((col) => {
          const columnIndex = parseInt(col.getAttribute('data-column') || '0', 10) as WidgetColumn

          col.querySelectorAll('[data-widget-id]').forEach((panel, order) => {
            const widgetId = panel.getAttribute('data-widget-id') as WidgetId
            if (widgetId) {
              layoutUpdate.push({ id: widgetId, column: columnIndex, order })
            }
          })
        })

        // Defer state update to let Sortable finish cleanup
        setTimeout(() => {
          isDragging = false
          if (layoutUpdate.length > 0) {
            updateWidgetLayout(layoutUpdate)
            // Reinitialize after DOM update
            requestAnimationFrame(() => {
              initDragDrop()
            })
          }
        }, 10)
      },
    })

    sortableInstances.push(sortable)
  })
}

/**
 * Destroys all Sortable instances
 */
export function destroyDragDrop(): void {
  // Don't destroy while dragging - causes errors
  if (isDragging) return

  sortableInstances.forEach(instance => {
    instance.destroy()
  })
  sortableInstances = []
}

/**
 * Checks if drag-drop is currently active
 */
export function isDragDropActive(): boolean {
  return sortableInstances.length > 0
}
