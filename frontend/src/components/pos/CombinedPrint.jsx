import { useEffect } from 'react'
import formatCurrency from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/datetime'
import { BRAND_NAME, ChaskaMark } from '../ui/Logo'
import { useSettings } from '../../contexts/SettingsContext'
import PrintFooter from './PrintFooter'
import { paperClass, readPrinterSettings } from '../../utils/printerSettings'

/**
 * Single print job containing Customer Bill + KOT with a page break.
 */
export default function CombinedPrint({ open, order, onDone }) {
  const { settings } = useSettings()
  const printer = readPrinterSettings()

  useEffect(() => {
    if (!open || !order) return undefined
    const t = setTimeout(() => {
      window.print()
      onDone?.()
    }, 300)
    return () => clearTimeout(t)
  }, [open, order, onDone])

  if (!open || !order) return null

  const items = order.items || []
  const payment = order.payment || {}
  const width = paperClass(printer.paperSize)

  return (
    <div id="combined-print" className={`fixed left-[-9999px] top-0 bg-white text-black ${width}`}>
      {/* BILL */}
      <section className="p-4">
        <div className="text-center">
          <ChaskaMark className="mx-auto h-10 w-10" />
          <p className="mt-1 text-lg font-bold text-[#0F5C3A]">{settings.businessName || BRAND_NAME}</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">Customer Bill</p>
        </div>
        <div className="my-2 border-t border-dashed border-gray-300" />
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between"><span>Order</span><span className="font-semibold">#{order.orderNumber}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{formatDateTime(order.completedAt || order.createdAt || new Date())}</span></div>
          <div className="flex justify-between"><span>Type</span><span>{order.orderType}</span></div>
          {order.waiter && <div className="flex justify-between"><span>Waiter</span><span className="font-semibold">{order.waiter}</span></div>}
          {order.table && <div className="flex justify-between"><span>Table</span><span>{order.table}</span></div>}
          {order.offline && <div className="flex justify-between text-amber-700"><span>Mode</span><span>Offline</span></div>}
        </div>
        <div className="my-2 border-t border-dashed border-gray-300" />
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, i) => (
              <tr key={i}>
                <td className="py-1">
                  <span className="block">{line.name}</span>
                  {line.size ? <span className="text-[10px] text-gray-500">{line.size}</span> : null}
                </td>
                <td className="text-center">{line.quantity}</td>
                <td className="text-right">{formatCurrency(line.lineTotal ?? line.price * line.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="my-2 border-t border-dashed border-gray-300" />
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>
          )}
          <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
          <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(payment.received || 0)}</span></div>
          <div className="flex justify-between"><span>Due</span><span>{formatCurrency(payment.due || 0)}</span></div>
        </div>
        <PrintFooter />
      </section>

      <div style={{ pageBreakBefore: 'always' }} />

      {/* KOT */}
      <section className="p-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em]">{settings.businessName || BRAND_NAME}</p>
        <p className="mt-1 text-center text-lg font-extrabold">KOT</p>
        <p className="text-center text-xs">
          #{order.orderNumber} · {order.orderType}
          {order.table ? ` · ${order.table}` : ''}
        </p>
        {order.waiter && <p className="text-center text-xs font-semibold">Waiter: {order.waiter}</p>}
        <div className="my-3 border-t border-dashed border-gray-400" />
        <ul className="space-y-2 text-sm">
          {items.map((line, i) => (
            <li key={i} className="font-semibold">
              {line.quantity}× {line.name}
              {line.size ? ` (${line.size})` : ''}
            </li>
          ))}
        </ul>
        <PrintFooter />
      </section>
    </div>
  )
}
