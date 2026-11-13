/**
 * Date/time helpers matching the topbar format:
 * "Tue, 21 Oct 2026 10:24 AM"
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function timeParts(date) {
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return { clock: `${h}:${m} ${ampm}`, ampm }
}

export function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatClock(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return timeParts(d).clock
}

export function formatDateTime(date = new Date()) {
  return `${formatDate(date)} ${formatClock(date)}`
}

export function formatTime(date = new Date()) {
  return formatClock(date)
}

export function relativeOrTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return formatClock(d)
}
