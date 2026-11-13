import { useEffect } from 'react'
import { BRAND_NAME } from '../ui/Logo'
import { useSettings } from '../../contexts/SettingsContext'
import PrintFooter from './PrintFooter'
import { paperClass, readPrinterSettings } from '../../utils/printerSettings'
import { formatDateTime } from '../../utils/datetime'

export default function KotPrint({ order, open, onDone }) {
  const { settings } = useSettings()
  const printer = readPrinterSettings()

  useEffect(() => {
    if (!open || !order) return undefined
    const t = setTimeout(() => {
      window.print()
      onDone?.()
    }, 250)
    return () => clearTimeout(t)
  }, [open, order, onDone])

  if (!open || !order) return null

  return (
    <div
      id="kot-print"
      className={`fixed left-[-9999px] top-0 bg-white p-4 text-black ${paperClass(printer.paperSize)}`}
    >
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em]">
        {settings?.businessName || BRAND_NAME}
      </p>
      <p className="mt-1 text-center text-lg font-extrabold">KOT</p>
      <p className="mt-1 text-center text-xs">
        #{order.orderNumber} · {order.orderType}
        {order.table ? ` · ${order.table}` : ''}
      </p>
      {order.waiter && <p className="text-center text-xs font-semibold">Waiter: {order.waiter}</p>}
      <p className="text-center text-[10px] text-gray-600">{formatDateTime(order.completedAt || order.createdAt || new Date())}</p>
      <div className="my-3 border-t border-dashed border-gray-400" />
      <ul className="space-y-2 text-sm">
        {(order.items || []).map((line, i) => (
          <li key={i}>
            <div className="font-semibold">
              {line.quantity}× {line.name}
              {line.size ? ` (${line.size})` : ''}
            </div>
          </li>
        ))}
      </ul>
      <PrintFooter />
    </div>
  )
}
