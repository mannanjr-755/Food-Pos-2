import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { ChaskaMark, BRAND_NAME } from '../components/ui/Logo'

export default function NotFound() {
  return (
    <div className="lex-fade-in flex min-h-screen flex-col items-center justify-center bg-lex-900 px-4 text-center">
      <div className="mb-8">
        <ChaskaMark className="mx-auto h-16 w-16 drop-shadow-[0_6px_20px_rgba(117,75,53,0.22)]" />
        <p className="mt-3 text-xl font-bold text-lex-ink">{BRAND_NAME}</p>
      </div>
      <p className="text-7xl font-bold text-lex-gold/20 sm:text-8xl">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-lex-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-lex-muted">
        This screen doesn’t exist. Head back to the POS to keep service moving.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/pos" className="lex-btn-primary px-6 py-3">
          <Home className="h-5 w-5" />
          Go to POS
        </Link>
        <Link to="/online-orders" className="lex-btn-secondary px-6 py-3">
          <ArrowLeft className="h-5 w-5" />
          Online Orders
        </Link>
      </div>
    </div>
  )
}
