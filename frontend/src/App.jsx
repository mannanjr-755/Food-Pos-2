import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import POS from './pages/POS'
import History from './pages/History'
import PrinterSettings from './pages/PrinterSettings'
import OnlineOrders from './pages/OnlineOrders'
import Tables from './pages/Tables'
import Menu from './pages/Menu'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import NotFound from './pages/NotFound'
import Spinner from './components/ui/Spinner'

function ProtectedRoute() {
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lex-900">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10 text-lex-gold" />
          <p className="text-sm font-semibold tracking-[0.18em] text-lex-gold/85">CHASKA POS</p>
          <p className="text-sm text-lex-muted">Loading your terminal…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pos" element={<POS />} />
        <Route path="/history" element={<History />} />
        <Route path="/printer-settings" element={<PrinterSettings />} />
        <Route path="/" element={<Navigate to="/pos" replace />} />
        <Route path="/dashboard" element={<Navigate to="/pos" replace />} />

        <Route element={<MainLayout />}>
          <Route path="/online-orders" element={<OnlineOrders />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/inventory" element={<Inventory />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
