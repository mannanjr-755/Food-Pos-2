import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History, Settings, LogOut, Printer, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ChaskaMark, BRAND_NAME } from '../ui/Logo'
import { currencySymbol } from '../../utils/formatCurrency'

export default function PosHeader({ itemCount = 0, onOpenCart }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)
  const currency = currencySymbol() || 'PKR'

  useEffect(() => {
    const onClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="shrink-0 border-b border-lex-700 bg-white px-3 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ChaskaMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0 leading-tight">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="truncate text-base font-extrabold tracking-tight text-lex-ink sm:text-lg">
                {BRAND_NAME.split(' ')[0]}
              </p>
              <span className="rounded-md bg-lex-gold-pale px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-lex-gold">
                POS
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-lex-muted">
              <span className="font-semibold text-lex-ink">{user?.name || 'Front Cashier'}</span>
              <span className="mx-1.5 text-lex-700">·</span>
              <span className="capitalize">{user?.role || 'Cashier'}</span>
              <span className="mx-1.5 text-lex-700">·</span>
              <span className="font-semibold text-lex-gold">{currency}</span>
            </p>
          </div>
        </div>

        <nav className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">
          <button type="button" className="pos-nav-btn" onClick={() => navigate('/history')}>
            <History className="h-4 w-4 text-lex-gold" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button type="button" className="pos-nav-btn" onClick={() => navigate('/printer-settings')}>
            <Printer className="h-4 w-4 text-lex-gold" />
            <span className="hidden sm:inline">Printer</span>
          </button>

          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              className="pos-nav-btn"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <Settings className="h-4 w-4 text-lex-gold" />
              <span className="hidden sm:inline">Settings</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-lex-faint sm:block" />
            </button>
            {settingsOpen && (
              <div className="lex-fade-in absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-2xl border border-lex-700 bg-white shadow-panel">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false)
                    logout()
                    navigate('/login', { replace: true })
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-lex-error transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {onOpenCart && itemCount > 0 && (
            <button type="button" onClick={onOpenCart} className="lex-btn-primary relative px-3 py-2 lg:hidden">
              Order
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-lex-gold">
                {itemCount}
              </span>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
