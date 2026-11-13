import { PackageSearch } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageSearch, title = 'Nothing here', message = '', action }) {
  return (
    <div className="lex-fade-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-lex-600/70 bg-lex-900/50 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lex-850 text-lex-gold shadow-soft ring-1 ring-lex-gold/15">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-lex-ink sm:text-lg">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-lex-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
