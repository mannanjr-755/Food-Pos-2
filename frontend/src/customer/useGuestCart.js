import { useCallback, useMemo, useState } from 'react'
import { readSession, writeSession } from './guestSession'

const MAX_LINES = 40

export default function useGuestCart(tableNumber) {
  const storageKey = `cart:${tableNumber}`
  const [lines, setLines] = useState(() => {
    const stored = readSession(storageKey, {})
    return stored && typeof stored === 'object' ? stored : {}
  })

  const commit = useCallback(
    (next) => {
      writeSession(storageKey, next)
      setLines(next)
    },
    [storageKey],
  )

  const setQty = useCallback(
    (itemId, qty) => {
      const quantity = Math.min(99, Math.max(0, Math.trunc(Number(qty) || 0)))
      const next = { ...lines }
      if (quantity === 0) delete next[itemId]
      else next[itemId] = quantity
      commit(next)
    },
    [commit, lines],
  )

  const clear = useCallback(() => commit({}), [commit])

  const count = useMemo(() => Object.values(lines).reduce((sum, qty) => sum + qty, 0), [lines])

  return { lines, setQty, clear, count, isFull: Object.keys(lines).length >= MAX_LINES }
}
