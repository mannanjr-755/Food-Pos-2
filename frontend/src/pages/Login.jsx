import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../services/api'
import Logo, { BRAND_NAME } from '../components/ui/Logo'

const PIN_LENGTH = 5

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, ready } = useAuth()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  useEffect(() => {
    if (ready && isAuthenticated) navigate('/pos', { replace: true })
  }, [ready, isAuthenticated, navigate])

  const submitPin = useCallback(
    async (value) => {
      const code = String(value || '').trim()
      if (code.length !== PIN_LENGTH || submitting.current) return

      submitting.current = true
      setLoading(true)
      setError('')
      try {
        const user = await login(code)
        toast.success(`Welcome back, ${user.name}`)
        navigate('/pos', { replace: true })
      } catch (err) {
        const msg = apiErrorMessage(err, 'Invalid PIN')
        setError(msg)
        toast.error(msg)
        setPin('')
      } finally {
        setLoading(false)
        submitting.current = false
      }
    },
    [login, navigate]
  )

  const appendDigit = (digit) => {
    if (loading) return
    setError('')
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev
      const next = `${prev}${digit}`
      if (next.length === PIN_LENGTH) {
        queueMicrotask(() => submitPin(next))
      }
      return next
    })
  }

  const backspace = () => {
    if (loading) return
    setError('')
    setPin((prev) => prev.slice(0, -1))
  }

  const clearPin = () => {
    if (loading) return
    setError('')
    setPin('')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (loading) return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        appendDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        clearPin()
      } else if (e.key === 'Enter' && pin.length === PIN_LENGTH) {
        e.preventDefault()
        submitPin(pin)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pin, submitPin])

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

  return (
    <div className="relative flex min-h-screen bg-lex-900 text-lex-ink">
      <div className="pointer-events-none absolute inset-0 bg-surface-sheen" aria-hidden="true" />

      <div className="relative hidden w-[48%] flex-col justify-between overflow-hidden bg-navy-gradient p-10 xl:p-14 lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-24 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-0 h-64 w-64 rounded-full bg-black/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative">
          <Logo size="lg" stacked onDark />
        </div>

        <div className="relative max-w-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">Staff terminal</p>
          <h2 className="font-display text-4xl font-bold leading-[1.15] text-white xl:text-5xl">
            Unlock with your PIN.
            <span className="mt-2 block text-white/70">Start taking orders in seconds.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
            Enter the staff PIN to open the POS dashboard, manage table menus, and keep the kitchen queue moving.
          </p>
        </div>

        <p className="relative text-xs text-white/50">© 2026 {BRAND_NAME}</p>
      </div>

      <div className="relative flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-[52%]">
        <div className="lex-fade-in w-full max-w-[400px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" stacked />
          </div>

          <div className="lex-surface p-7 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lex-gold/10 text-lex-gold ring-1 ring-lex-gold/15">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-lex-ink">Enter PIN</h1>
              <p className="mt-1.5 text-sm text-lex-muted">Unlock the cashier POS to continue</p>
            </div>

            {error && (
              <div
                role="alert"
                className="lex-fade-in mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-lex-error"
              >
                {error}
              </div>
            )}

            <div className="mb-6 flex items-center justify-center gap-2.5" aria-label="PIN progress" aria-live="polite">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${
                    i < pin.length
                      ? 'scale-110 bg-lex-gold shadow-[0_0_0_4px_rgba(179,18,27,0.12)]'
                      : 'bg-lex-700 ring-1 ring-lex-600/80'
                  }`}
                />
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-lex-gold" />
                <p className="text-sm font-medium text-lex-muted">Unlocking…</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {keys.map((key) => {
                  if (key === 'clear') {
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={clearPin}
                        className="lex-press rounded-2xl border border-lex-700 bg-lex-900 py-4 text-sm font-semibold text-lex-muted transition hover:border-lex-gold/30 hover:text-lex-ink"
                      >
                        Clear
                      </button>
                    )
                  }
                  if (key === 'back') {
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label="Delete last digit"
                        onClick={backspace}
                        className="lex-press flex items-center justify-center rounded-2xl border border-lex-700 bg-lex-900 py-4 text-lex-muted transition hover:border-lex-gold/30 hover:text-lex-ink"
                      >
                        <Delete className="h-5 w-5" />
                      </button>
                    )
                  }
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => appendDigit(key)}
                      className="lex-press rounded-2xl border border-lex-700 bg-lex-850 py-4 text-2xl font-semibold tabular-nums text-lex-ink shadow-soft transition hover:border-lex-gold/35 hover:bg-white active:bg-lex-gold/5"
                    >
                      {key}
                    </button>
                  )
                })}
              </div>
            )}

            <p className="mt-6 text-center text-xs leading-relaxed text-lex-faint">
              Default PIN is <span className="font-semibold tabular-nums text-lex-muted">12345</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
