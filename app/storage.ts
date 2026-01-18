import { state, DEFAULT_LAYOUT } from '@app/state'
import type { NavTab, AvatarMode, LayoutConfig, WidgetId, WidgetColumn } from '@app/types'

const STORAGE_KEY = 'nemesis_user_data'
const STORAGE_VERSION = 4 // v4: Added column-based layout

// All valid widget IDs - must match WidgetId type
const VALID_WIDGET_IDS: WidgetId[] = ['market', 'order', 'positions']
const VALID_COLUMNS: WidgetColumn[] = [0, 1]

/**
 * Validates layout config and returns a valid config.
 * If validation fails, returns the default layout.
 */
function validateLayoutConfig(config: unknown): LayoutConfig {
  // Must be an object with version and widgets array
  if (!config || typeof config !== 'object') {
    return structuredClone(DEFAULT_LAYOUT)
  }

  const cfg = config as Partial<LayoutConfig>

  // Check version exists and is a number
  if (typeof cfg.version !== 'number') {
    return structuredClone(DEFAULT_LAYOUT)
  }

  // Check widgets is an array
  if (!Array.isArray(cfg.widgets)) {
    return structuredClone(DEFAULT_LAYOUT)
  }

  // Validate each widget has required properties
  for (const widget of cfg.widgets) {
    if (
      !widget ||
      typeof widget !== 'object' ||
      typeof widget.id !== 'string' ||
      typeof widget.order !== 'number' ||
      typeof widget.visible !== 'boolean'
    ) {
      return structuredClone(DEFAULT_LAYOUT)
    }
    // Add column if missing (migration from v1/v2/v3)
    if (typeof widget.column !== 'number' || !VALID_COLUMNS.includes(widget.column as WidgetColumn)) {
      widget.column = 0 // Default to left column
    }
  }

  // Ensure all required widget IDs are present
  const presentIds = new Set(cfg.widgets.map((w) => w.id))
  for (const id of VALID_WIDGET_IDS) {
    if (!presentIds.has(id)) {
      return structuredClone(DEFAULT_LAYOUT)
    }
  }

  // Remove any unknown widget IDs
  const validatedWidgets = cfg.widgets.filter((w) =>
    VALID_WIDGET_IDS.includes(w.id as WidgetId)
  )

  return {
    version: DEFAULT_LAYOUT.version,
    widgets: validatedWidgets,
  }
}

interface StoredData {
  version: number
  hasVisited: boolean
  tutorialComplete: boolean
  tabTutorialShown: Record<NavTab, boolean>
  avatarMode: AvatarMode
  autoplayEnabled: boolean
  lastVisit: number
  lastConnectedAddress?: string
  layoutConfig?: LayoutConfig
}

function getDefaultData(): StoredData {
  return {
    version: STORAGE_VERSION,
    hasVisited: false,
    tutorialComplete: false,
    tabTutorialShown: {
      trade: false,
      feed: false,
      leaderboard: false,
      portfolio: false,
    },
    avatarMode: 'full',
    autoplayEnabled: false,
    lastVisit: 0,
    layoutConfig: structuredClone(DEFAULT_LAYOUT),
  }
}

function migrateData(data: StoredData & { avatarMode?: string }): StoredData {
  // Migrate v1 -> v2: 'small' becomes 'head'
  if (data.avatarMode === 'small') {
    data.avatarMode = 'head'
  }
  // Migrate v2 -> v3: Validate/add layoutConfig
  data.layoutConfig = validateLayoutConfig(data.layoutConfig)
  data.version = STORAGE_VERSION
  return data as StoredData
}

export function loadUserData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()

    const data = JSON.parse(raw) as StoredData

    // Migrate older versions
    if (data.version < STORAGE_VERSION) {
      return migrateData(data)
    }

    return data
  } catch {
    return getDefaultData()
  }
}

export function saveUserData(): void {
  try {
    const data: StoredData = {
      version: STORAGE_VERSION,
      hasVisited: true,
      tutorialComplete: state.tutorialComplete,
      tabTutorialShown: state.tabTutorialShown,
      avatarMode: state.avatarMode,
      autoplayEnabled: state.autoplayEnabled,
      lastVisit: Date.now(),
      lastConnectedAddress: state.connected ? state.address : undefined,
      layoutConfig: state.layoutConfig,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage not available or full
  }
}

export function initFromStorage(): boolean {
  const data = loadUserData()

  if (data.hasVisited) {
    state.isReturningPlayer = true
    state.tutorialComplete = data.tutorialComplete
    state.tabTutorialShown = data.tabTutorialShown
    state.avatarMode = data.avatarMode
    state.autoplayEnabled = data.autoplayEnabled
    // Validate layout config before applying
    state.layoutConfig = validateLayoutConfig(data.layoutConfig)
    return true
  }

  return false
}

export function clearUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage not available
  }
}

export function markTutorialComplete(): void {
  state.tutorialComplete = true
  saveUserData()
}

export function markTabTutorialShown(tab: NavTab): void {
  state.tabTutorialShown[tab] = true
  saveUserData()
}
