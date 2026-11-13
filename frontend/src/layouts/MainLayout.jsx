import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import {
  Cloud,
  UtensilsCrossed,
  LayoutGrid,
  Package,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Armchair,
  Receipt,
  ArrowLeft,
} from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import { ChaskaMark, BRAND_NAME, BRAND_TAGLINE } from '../components/ui/Logo'

const navGroups = [
  {
    label: 'Floor',
    items: [
      { name: 'Online Orders', path: '/online-orders', icon: Cloud },
      { name: 'Tables', path: '/tables', icon: Armchair },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { name: 'Menu', path: '/menu', icon: UtensilsCrossed },
      { name: 'Categories', path: '/categories', icon: LayoutGrid },
      { name: 'Inventory', path: '/inventory', icon: Package },
    ],
  },
]

const COLLAPSE_KEY = 'ckkPosCollapsed'

export default function MainLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="min-h-screen bg-lex-900 text-lex-ink">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-lex-700 bg-white shadow-panel transition-all duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[76px]' : 'lg:w-[272px]'}`}
      >
        <div
          className={`relative flex h-[72px] items-center justify-center gap-2.5 border-b border-lex-700 px-3 transition-all duration-300 ${
            collapsed ? 'lg:gap-0' : ''
          }`}
        >
          <ChaskaMark className="h-9 w-9 shrink-0" />
          <div
            className={`flex flex-col overflow-hidden leading-none whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-[160px] opacity-100'
            }`}
          >
            <span className="text-lg font-bold tracking-tight text-lex-ink">Chaska</span>
            <span className="mt-0.5 text-[12px] font-bold tracking-tight text-lex-gold">Management</span>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="lex-press absolute right-3 rounded-lg p-2 text-lex-muted transition hover:bg-lex-800 hover:text-lex-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[58px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-lex-700 bg-white text-lex-gold shadow-soft transition-all duration-300 hover:border-lex-gold hover:bg-lex-gold hover:text-white lg:flex"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        <div className="px-3 pt-4">
          <Link
            to="/pos"
            title="Back to POS"
            className={`lex-press flex items-center gap-3 overflow-hidden rounded-xl border border-lex-700 bg-lex-800 px-3.5 py-2.5 text-sm font-semibold text-lex-gold transition hover:border-lex-gold/35 hover:bg-lex-gold hover:text-white ${
              collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''
            }`}
          >
            {collapsed ? (
              <Receipt className="h-[18px] w-[18px] shrink-0 lg:block" />
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Back to POS</span>
              </>
            )}
          </Link>
        </div>

        <nav aria-label="Main navigation" className="lex-scroll flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p
                className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-lex-faint transition-all duration-300 ${
                  collapsed ? 'lg:max-h-0 lg:opacity-0 lg:mb-0' : 'max-h-6 opacity-100'
                }`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ name, path, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    title={name}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''
                      } ${
                        isActive
                          ? 'bg-lex-gold/10 text-lex-gold ring-1 ring-lex-gold/15'
                          : 'text-lex-muted hover:bg-lex-800 hover:text-lex-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-gradient transition-all duration-200 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                        <span
                          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                            collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-[160px] opacity-100'
                          }`}
                        >
                          {name}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="overflow-hidden border-t border-lex-700 px-3 pb-6 pt-4 text-center transition-all duration-300 lg:px-5">
          <p
            className={`text-sm font-semibold tracking-wide whitespace-nowrap text-lex-gold/90 transition-all duration-300 ${
              collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-[220px] opacity-100'
            }`}
          >
            {BRAND_NAME}
          </p>
          <p
            className={`mx-auto mt-1 text-[11px] leading-relaxed whitespace-nowrap text-lex-faint transition-all duration-300 ${
              collapsed ? 'lg:max-w-0 lg:opacity-0' : 'max-w-[220px] opacity-100'
            }`}
          >
            {BRAND_TAGLINE}
          </p>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-out ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[272px]'
        }`}
      >
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="lex-scroll flex-1">
          <div className="lex-fade-in mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
