const SETTINGS_CACHE_KEY = 'ckkPosSettings'

export function cacheSettings(settings) {
  if (settings) localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings))
}

export function getCachedSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function currencySymbol() {
  return getCachedSettings().currencySymbol || '$'
}

/**
 * Format a monetary amount for display, e.g. "Rs. 1,080".
 * Shows decimals only when the value has a fractional part.
 */
export default function formatCurrency(amount, symbol = currencySymbol()) {
  const value = Number(amount)
  const safe = Number.isFinite(value) ? value : 0
  const hasFraction = Math.round(safe * 100) % 100 !== 0
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${symbol} ${formatted}`
}
