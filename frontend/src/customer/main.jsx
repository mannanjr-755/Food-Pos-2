import React from 'react'
import ReactDOM from 'react-dom/client'
import GuestMenu from './GuestMenu'
import '../index.css'

/** The Express app (and Vite in dev) serves this bundle for /t/<tableNumber>. */
function tableNumberFromLocation() {
  const fromPath = window.location.pathname.match(/^\/t\/(\d+)/)
  if (fromPath) return Number(fromPath[1])
  const fromQuery = Number(new URLSearchParams(window.location.search).get('table'))
  return Number.isInteger(fromQuery) && fromQuery > 0 ? fromQuery : null
}

const tableNumber = tableNumberFromLocation()

ReactDOM.createRoot(document.getElementById('customer-root')).render(
  <React.StrictMode>
    {tableNumber ? (
      <GuestMenu tableNumber={tableNumber} />
    ) : (
      <div className="flex min-h-screen items-center justify-center bg-lex-900 px-6 text-center">
        <div>
          <p className="font-display text-xl font-bold">Scan the code on your table</p>
          <p className="mt-2 text-sm text-lex-muted">This page needs a table number, for example /t/1.</p>
        </div>
      </div>
    )}
  </React.StrictMode>,
)
