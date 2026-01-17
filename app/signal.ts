import { state } from './state'
import { render } from './render'
import { playCRTOn, playCRTOff, playTypeSound } from './audio'
import { randomFrom } from './utils'
import { DIALOGUE } from './dialogue'
import { saveUserData } from './storage'
import type { Emotion, DialogueLine } from './types'

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
  state.isTyping = true
  state.typewriterIndex = 0
  state.currentDialogue = ''
  state.dialogueAtEnd = false

  if (!document.getElementById('dialogue-text')) return

  if (state.dialoguePlayState === 'paused') {
    state.dialogueQueue = [text]
    return
  }

  playTypeSound()

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
    } else {
      if (typewriterTimer) clearInterval(typewriterTimer)
      typewriterTimer = null
      state.isTyping = false
      state.dialogueAtEnd = true
      if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
        startAutoplayTimer()
      }
      if (onComplete) onComplete()
    }
  }, 35)
}

export function skipTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  const textEl = document.getElementById('dialogue-text')
  if (textEl && state.dialogueQueue.length > 0) {
    textEl.textContent = state.dialogueQueue[0]
    state.currentDialogue = state.dialogueQueue[0]
  }
  state.isTyping = false
  state.dialogueAtEnd = true
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
    state.dialoguePlayState = 'paused'
    if (typewriterTimer) {
      clearInterval(typewriterTimer)
      typewriterTimer = null
    }
    clearAutoplayTimer()
  } else {
    state.dialoguePlayState = 'playing'
    if (state.isTyping && state.dialogueQueue.length > 0) {
      resumeTypewriter()
    } else if (state.autoplayEnabled && state.dialogueAtEnd) {
      startAutoplayTimer()
    }
  }
  render()
}

export function skipDialogue() {
  clearDismissTimer()
  clearAutoplayTimer()

  if (state.isTyping) {
    skipTypewriter()
  }

  if (state.autoplayEnabled && state.dialoguePlayState === 'playing') {
    startAutoplayTimer()
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
        // Always show generic idle dialogue for continuous autoplay
        showRandomDialogue('idle')
      }
    }
  }, AUTOPLAY_DELAY_MS)
}

function resumeTypewriter() {
  if (!document.getElementById('dialogue-text') || state.dialogueQueue.length === 0) return

  playTypeSound()
  const fullText = state.dialogueQueue[0]

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
