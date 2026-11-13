let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    return ctx
  } catch {
    return null
  }
}

/**
 * Play a short notification beep using the WebAudio oscillator.
 * Safe to call repeatedly; no-op when WebAudio is unavailable.
 */
export default function beep({ frequency = 880, duration = 0.18, volume = 0.08 } = {}) {
  const audio = getCtx()
  if (!audio) return
  try {
    if (audio.state === 'suspended') audio.resume?.()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + duration + 0.02)
  } catch {
    /* ignore audio errors */
  }
}
