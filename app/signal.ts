import { state } from '@app/state'
import { render } from '@app/render'
import { playCRTOn, playCRTOff, playTypeSound } from '@app/audio'
import { randomFrom } from '@app/utils'
import { DIALOGUE } from '@app/dialogue'
import { saveUserData } from '@app/storage'
import type { Emotion, DialogueLine } from '@app/types'

export const CRT_ANIMATION_MS = 300
export const AUTOPLAY_DELAY_MS = 4000

let typewriterTimer: number | null = null
let dialogueDismissTimer: number | null = null
let autoplayTimer: number | null = null

export function connectSignal(callback?: () => void) {
  if (state.dialogueSignal === 'connected' || state.dialogueSignal === 'connecting') {
    if (callback) callback()
    return
  }

  state.dialogueSignal = 'connecting'
  state.dialogueAtEnd = false
  playCRTOn()
  render()

  setTimeout(() => {
    state.dialogueSignal = 'connected'
    render()
    if (callback) callback()
  }, CRT_ANIMATION_MS)
}

export function disconnectSignal(callback?: () => void) {
  clearDismissTimer()
  if (state.dialogueSignal === 'off' || state.dialogueSignal === 'disconnecting') {
    if (callback) callback()
    return
  }

  state.dialogueSignal = 'disconnecting'
  state.currentDialogue = ''
  playCRTOff()
  render()

  setTimeout(() => {
    state.dialogueSignal = 'off'
    render()
    if (callback) callback()
  }, CRT_ANIMATION_MS)
}

export function setEmotion(emotion: Emotion) {
  if (state.currentEmotion === emotion) return
  const img = document.getElementById('avatar-img') as HTMLImageElement
  const portraitImg = document.getElementById('portrait-img') as HTMLImageElement
  if (img) {
    img.style.opacity = '0'
    setTimeout(() => {
      state.currentEmotion = emotion
      img.src = `nemesis-chan/${emotion}.png`
      img.style.opacity = '1'
    }, 200)
  } else {
    state.currentEmotion = emotion
  }
  if (portraitImg) {
    portraitImg.src = `nemesis-chan/${emotion}.png`
  }
}

export function typewriterEffect(text: string, onComplete?: () => void) {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  clearAutoplayTimer()

  // Always store the full text in queue first
  state.dialogueQueue = [text]
  state.typewriterIndex = 0
  state.currentDialogue = ''
  state.dialogueAtEnd = false

  if (!document.getElementById('dialogue-text')) return

  // If paused, don't start typing - just store the text for later
  if (state.dialoguePlayState === 'paused') {
    state.isTyping = true // Mark as typing so resume knows to continue
    render()
    return
  }

  state.isTyping = true
  playTypeSound()
  updateTypingProgress(0, text.length)

  typewriterTimer = window.setInterval(() => {
    const textEl = document.getElementById('dialogue-text')
    if (!textEl || state.dialoguePlayState === 'paused') {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      if (state.dialoguePlayState !== 'paused') state.isTyping = false
      return
    }

    if (state.typewriterIndex < text.length) {
      state.currentDialogue += text[state.typewriterIndex]
      textEl.textContent = state.currentDialogue
      state.typewriterIndex++
      updateTypingProgress(state.typewriterIndex, text.length)
    } else {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      state.isTyping = false
      state.dialogueAtEnd = true
      state.autoplayKey++ // Increment to restart animation
      clearTypingProgress()
      triggerCompletionShimmer()
      render()
      if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
        startAutoplayTimer()
      }
      if (onComplete) onComplete()
    }
  }, 35)
}

function updateTypingProgress(current: number, total: number) {
  const bar = document.querySelector('.dialogue-autoplay-bar') as HTMLElement
  if (bar) {
    const progress = total > 0 ? (current / total) * 100 : 0
    bar.style.width = `${progress}%`
    bar.classList.add('typing')
  }
}

function clearTypingProgress() {
  const bar = document.querySelector('.dialogue-autoplay-bar') as HTMLElement
  if (bar) {
    bar.classList.remove('typing')
    bar.style.width = '0'
  }
}

function triggerCompletionShimmer() {
  const box = document.querySelector('.dialogue-box') as HTMLElement
  if (!box) return

  // Remove class first to reset animation if it was already playing
  box.classList.remove('typing-complete')
  // Force reflow to restart animation
  void box.offsetWidth
  // Add class to trigger shimmer
  box.classList.add('typing-complete')

  // Remove class after animation completes
  setTimeout(() => {
    box.classList.remove('typing-complete')
  }, 800)
}

export function skipTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  const textEl = document.getElementById('dialogue-text')
  if (textEl && state.dialogueQueue.length > 0) {
    const fullText = state.dialogueQueue[0]
    textEl.textContent = fullText
    state.currentDialogue = fullText
    state.typewriterIndex = fullText.length
  }
  state.isTyping = false
  state.dialogueAtEnd = true
  state.autoplayKey++ // Restart autoplay animation
  clearTypingProgress()
  triggerCompletionShimmer()
  render()

  // Start autoplay timer if enabled
  if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
    startAutoplayTimer()
  }
}

export function clearDismissTimer() {
  if (dialogueDismissTimer) {
    clearTimeout(dialogueDismissTimer)
    dialogueDismissTimer = null
  }
}

export function clearAutoplayTimer() {
  if (autoplayTimer) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

export function togglePausePlay() {
  if (state.dialoguePlayState === 'playing') {
    // Pausing
    state.dialoguePlayState = 'paused'
    if (typewriterTimer) {
      clearInterval(typewriterTimer)
      typewriterTimer = null
    }
    clearAutoplayTimer()
  } else {
    // Resuming
    state.dialoguePlayState = 'playing'
    // Check if we were mid-typing (isTyping was true when paused, or we have unfinished text)
    if (state.dialogueQueue.length > 0 && state.typewriterIndex < state.dialogueQueue[0].length) {
      state.isTyping = true
      resumeTypewriter()
    } else if (state.autoplayEnabled && state.dialogueAtEnd) {
      // Restart autoplay animation and timer
      state.autoplayKey++
      startAutoplayTimer()
    }
  }
  render()
}

export function skipDialogue() {
  clearDismissTimer()
  clearAutoplayTimer()

  // Stop any current typing immediately
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  state.isTyping = false

  // Skip ALWAYS goes to NEXT dialogue (not just finish current)
  if (state.dialogueSignal === 'connected' || state.dialogueSignal === 'connecting') {
    if (state.introComplete) {
      // Main screen: immediately show next random idle dialogue
      showRandomDialogue('idle')
    } else {
      // During intro: advance to next intro line
      advanceIntroFromSkip()
    }
  }
}

// Callback set by events.ts to allow signal.ts to advance intro without circular deps
let advanceIntroCallback: (() => void) | null = null

export function setAdvanceIntroCallback(cb: () => void) {
  advanceIntroCallback = cb
}

function advanceIntroFromSkip() {
  if (advanceIntroCallback) {
    advanceIntroCallback()
  }
}

export function toggleAutoplay() {
  state.autoplayEnabled = !state.autoplayEnabled
  saveUserData()

  if (state.autoplayEnabled && state.dialogueAtEnd && state.dialoguePlayState === 'playing') {
    startAutoplayTimer()
  } else {
    clearAutoplayTimer()
  }

  render()
}

function startAutoplayTimer() {
  clearAutoplayTimer()

  if (!state.autoplayEnabled || state.dialoguePlayState === 'paused') return

  autoplayTimer = window.setTimeout(() => {
    autoplayTimer = null
    if (state.autoplayEnabled && state.dialoguePlayState === 'playing' && state.introComplete) {
      if (state.dialogueSignal === 'connected' && state.dialogueAtEnd) {
        showRandomDialogue('idle')
      }
    }
  }, AUTOPLAY_DELAY_MS)
}

function resumeTypewriter() {
  if (!document.getElementById('dialogue-text') || state.dialogueQueue.length === 0) return

  const fullText = state.dialogueQueue[0]

  // Don't resume if we're already at the end
  if (state.typewriterIndex >= fullText.length) {
    state.isTyping = false
    state.dialogueAtEnd = true
    state.autoplayKey++ // Restart autoplay animation
    triggerCompletionShimmer()
    render()
    if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
      startAutoplayTimer()
    }
    return
  }

  state.isTyping = true
  playTypeSound()

  typewriterTimer = window.setInterval(() => {
    const textEl = document.getElementById('dialogue-text')
    if (!textEl || state.dialoguePlayState === 'paused') {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      return
    }

    if (state.typewriterIndex < fullText.length) {
      state.currentDialogue += fullText[state.typewriterIndex]
      textEl.textContent = state.currentDialogue
      state.typewriterIndex++
    } else {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      state.isTyping = false
      state.dialogueAtEnd = true
      state.autoplayKey++ // Restart autoplay animation
      triggerCompletionShimmer()
      render()
      if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
        startAutoplayTimer()
      }
    }
  }, 35)
}

export function startDismissTimer() {
  clearDismissTimer()
  dialogueDismissTimer = window.setTimeout(() => {
    if (state.dialogueSignal === 'connected' && state.dialogueAtEnd && state.introComplete) {
      disconnectSignal()
    }
  }, 4000)
}

export function showDialogue(line: DialogueLine, autoDismiss = false) {
  clearDismissTimer()
  state.dialogueQueue = [line.text]
  setEmotion(line.emotion)

  const onComplete = autoDismiss ? startDismissTimer : undefined

  if (state.dialogueSignal !== 'connected') {
    connectSignal(() => {
      const nameEl = document.getElementById('dialogue-name')
      if (nameEl) {
        if (line.showName !== false && state.introComplete) nameEl.classList.add('visible')
        else nameEl.classList.remove('visible')
      }
      typewriterEffect(line.text, onComplete)
    })
  } else {
    const nameEl = document.getElementById('dialogue-name')
    if (nameEl) {
      if (line.showName !== false && state.introComplete) nameEl.classList.add('visible')
      else nameEl.classList.remove('visible')
    }
    typewriterEffect(line.text, onComplete)
  }
}

export function showRandomDialogue(category: keyof typeof DIALOGUE) {
  const options = DIALOGUE[category]
  if (!options || options.length === 0) return
  const lastInCategory = state.lastDialogueByCategory[category]
  let line = randomFrom(options)
  if (options.length > 1 && line.text === lastInCategory) {
    const filtered = options.filter(o => o.text !== lastInCategory)
    line = randomFrom(filtered)
  }
  state.lastDialogueByCategory[category] = line.text
  showDialogue({ ...line, showName: true }, true)
}
