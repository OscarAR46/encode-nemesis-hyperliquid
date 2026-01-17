import { state } from '@app/state'
import type { NavTab, AvatarMode } from '@app/types'

const STORAGE_KEY = 'nemesis_user_data'
const STORAGE_VERSION = 1

interface StoredData {
  version: number
  hasVisited: boolean
  tutorialComplete: boolean
  tabTutorialShown: Record<NavTab, boolean>
  avatarMode: AvatarMode
  autoplayEnabled: boolean
  lastVisit: number
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

export function loadUserData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()

    const data = JSON.parse(raw) as StoredData

    if (data.version !== STORAGE_VERSION) {
      return getDefaultData()
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
