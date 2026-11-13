const PREFIX = 'ckkGuest'

export function readSession(key, fallback) {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}:${key}`)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeSession(key, value) {
  try {
    sessionStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
  } catch {
    // A private tab with storage disabled still keeps the in-memory state.
  }
}

export function clearSession(key) {
  try {
    sessionStorage.removeItem(`${PREFIX}:${key}`)
  } catch {
    // ignore
  }
}

/** Retried submits must reuse the ref, otherwise the kitchen gets a duplicate ticket. */
export function sourceRefFor(tableNumber) {
  const stored = readSession(`ref:${tableNumber}`)
  if (typeof stored === 'string' && stored) return stored
  const created =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  writeSession(`ref:${tableNumber}`, created)
  return created
}

export function forgetSourceRef(tableNumber) {
  clearSession(`ref:${tableNumber}`)
}
