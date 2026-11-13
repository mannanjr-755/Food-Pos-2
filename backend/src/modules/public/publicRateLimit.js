const buckets = new Map()

/** Fixed one-minute window per IP; the map is pruned on every request. */
function limiter({ windowMs, max }) {
  return (req, res, next) => {
    const now = Date.now()
    for (const [key, hit] of buckets) if (now - hit.reset > windowMs) buckets.delete(key)

    const key = `${req.ip}:${req.path}`
    let hit = buckets.get(key)
    if (!hit || now > hit.reset) {
      hit = { count: 0, reset: now + windowMs }
      buckets.set(key, hit)
    }
    hit.count += 1

    if (hit.count > max) {
      res.setHeader('Retry-After', Math.ceil((hit.reset - now) / 1000))
      res.status(429).json({ message: 'Too many requests, please try again shortly' })
      return
    }
    next()
  }
}

export const publicMenuLimiter = limiter({ windowMs: 60_000, max: 300 })
export const publicOrderLimiter = limiter({ windowMs: 60_000, max: 30 })
