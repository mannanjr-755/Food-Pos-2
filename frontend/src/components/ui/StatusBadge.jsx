const TONES = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-lex-800 text-lex-muted ring-lex-600/60',
  gold: 'bg-lex-gold/10 text-lex-gold ring-lex-gold/25',
}

const STATUS_MAP = {
  pending: { label: 'Pending', tone: 'amber' },
  held: { label: 'Held', tone: 'gray' },
  accepted: { label: 'Confirmed', tone: 'green' },
  preparing: { label: 'Preparing', tone: 'blue' },
  ready: { label: 'Ready', tone: 'purple' },
  served: { label: 'Served', tone: 'teal' },
  completed: { label: 'Completed', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
  paid: { label: 'Paid', tone: 'green' },
  unpaid: { label: 'Unpaid', tone: 'amber' },
  refunded: { label: 'Refunded', tone: 'gray' },
  failed: { label: 'Failed', tone: 'red' },
  low: { label: 'Low stock', tone: 'amber' },
  out: { label: 'Out of stock', tone: 'red' },
  ok: { label: 'In stock', tone: 'green' },
  untracked: { label: 'Untracked', tone: 'gray' },
  active: { label: 'Active', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'gray' },
  available: { label: 'Available', tone: 'green' },
}

export default function StatusBadge({ status, label, tone, className = '' }) {
  const key = String(status || '').toLowerCase()
  const preset = STATUS_MAP[key] || { label: status || '—', tone: 'gray' }
  const resolvedTone = tone || preset.tone
  const text = label || preset.label
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[resolvedTone] || TONES.gray} ${className}`}
    >
      {text}
    </span>
  )
}
