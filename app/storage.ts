import { state } from '@app/state'
import type { NavTab, AvatarMode } from '@app/types'

const STORAGE_KEY = 'nemesis_user_data'
const STORAGE_VERSION = 2 // Bumped: 'small' -> 'head' avatar mode

interface StoredData {
  version: number
  hasVisited: boolean
  tutorialComplete: boolean
  tabTutorialShown: Record<NavTab, boolean>
  avatarMode: AvatarMode
  autoplayEnabled: boolean
  lastVisit: number
  lastConnectedAddress?: string
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
  }
}

function migrateData(data: StoredData & { avatarMode?: string }): StoredData {
  // Migrate v1 -> v2: 'small' becomes 'head'
  if (data.avatarMode === 'small') {
    data.avatarMode = 'head'
  }
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
