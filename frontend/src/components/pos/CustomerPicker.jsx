import { useEffect, useRef, useState } from 'react'
import { UserPlus, Search, X, Check } from 'lucide-react'
import api, { apiErrorMessage } from '../../services/api'
import toast from 'react-hot-toast'

export default function CustomerPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(() => {
      if (!term.trim()) {
        setResults([])
        return
      }
      setSearching(true)
      api
        .get('/customers', { params: { search: term.trim() } })
        .then(({ data }) => setResults(Array.isArray(data) ? data : []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [term, open])

  const select = (c) => {
    onChange({ name: c.name, phone: c.phone })
    setOpen(false)
    setTerm('')
  }

  const saveNew = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Enter a name and phone for the new customer')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/customers', { name: name.trim(), phone: phone.trim() })
      onChange({ name: data.name, phone: data.phone })
      setName('')
      setPhone('')
      setOpen(false)
      toast.success('Customer saved')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      {value?.name ? (
        <div className="lex-fade-in flex items-center justify-between rounded-xl border border-lex-gold/20 bg-lex-900 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-lex-ink">{value.name}</p>
            {value.phone && <p className="truncate text-xs text-lex-muted">{value.phone}</p>}
          </div>
          <button
            type="button"
            aria-label="Remove customer"
            onClick={() => onChange(null)}
            className="rounded-md p-1 text-lex-faint transition hover:bg-red-400/10 hover:text-lex-error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lex-press flex w-full items-center gap-2 rounded-xl border border-dashed border-lex-gold/30 bg-lex-900/60 px-3 py-2 text-sm font-medium text-lex-gold transition hover:border-lex-gold/55 hover:bg-lex-gold/5"
        >
          <UserPlus className="h-4 w-4" />
          Add customer (optional)
        </button>
      )}

      {open && (
        <div className="lex-scale-in absolute z-30 mt-2 w-full rounded-2xl border border-lex-700 bg-lex-850 p-3 shadow-panel">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full rounded-lg border border-lex-700 bg-lex-900 py-2 pl-9 pr-3 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55"
            />
          </div>
          <div className="lex-scroll mt-2 max-h-40 overflow-y-auto">
            {searching && <p className="px-2 py-2 text-xs text-lex-muted">Searching…</p>}
            {!searching && term && results.length === 0 && (
              <p className="px-2 py-2 text-xs text-lex-muted">No matches — add below.</p>
            )}
            {results.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => select(c)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition hover:bg-lex-800"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-lex-ink">{c.name}</span>
                  <span className="block truncate text-xs text-lex-muted">{c.phone}</span>
                </span>
                <Check className="h-4 w-4 text-lex-gold" />
              </button>
            ))}
          </div>

          <div className="mt-2 border-t border-lex-700 pt-2">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-lex-faint">New customer</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="rounded-lg border border-lex-700 bg-lex-900 px-2.5 py-2 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="rounded-lg border border-lex-700 bg-lex-900 px-2.5 py-2 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55"
              />
            </div>
            <button
              type="button"
              onClick={saveNew}
              disabled={saving}
              className="lex-press mt-2 w-full rounded-lg bg-gold-gradient py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Use new customer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
