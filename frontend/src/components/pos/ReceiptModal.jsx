import { useEffect } from 'react'
import Modal from '../ui/Modal'
import { Printer } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/datetime'
import { BRAND_NAME, ChaskaMark } from '../ui/Logo'
import { useSettings } from '../../contexts/SettingsContext'
import PrintFooter from './PrintFooter'
import { paperClass, readPrinterSettings } from '../../utils/printerSettings'

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function ReceiptModal({ open, onClose, order, autoPrint = false }) {
  const { settings } = useSettings()
  const printer = readPrinterSettings()

  useEffect(() => {
    if (!open || !autoPrint || !order) return undefined
    const t = setTimeout(() => window.print(), 250)
    return () => clearTimeout(t)
  }, [open, autoPrint, order])

  if (!order) return null

  const items = order.items || []
  const payment = order.payment || {}

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bill"
      size="sm"
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="lex-btn-secondary flex-1">
            Close
          </button>
          <button type="button" onClick={() => window.print()} className="lex-btn-primary flex flex-1 items-center justify-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      }
    >
      <div
        id="receipt-print"
        className={`mx-auto rounded-xl border border-gray-200 bg-white p-5 font-sans text-gray-900 ${paperClass(printer.paperSize)}`}
      >
        <div className="text-center">
          <ChaskaMark className="mx-auto h-11 w-11" />
          <p className="mt-1.5 text-xl font-bold tracking-tight text-[#0F5C3A]">
            {settings.businessName || BRAND_NAME}
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Food POS</p>
          {settings.phone && <p className="mt-1 text-xs text-gray-500">Tel: {settings.phone}</p>}
          {settings.address && <p className="text-xs text-gray-500">{settings.address}</p>}
        </div>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Order</span>
            <span className="font-semibold">#{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{formatDateTime(order.completedAt || order.createdAt || new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span>{order.orderType || 'Takeaway'}</span>
          </div>
          {order.waiter && (
            <div className="flex justify-between">
              <span className="text-gray-500">Waiter</span>
              <span className="font-semibold">{order.waiter}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="max-w-[60%] truncate">{order.customer?.name || 'Walk-in Customer'}</span>
          </div>
          {order.table && (
            <div className="flex justify-between">
              <span className="text-gray-500">Table</span>
              <span>{order.table}</span>
            </div>
          )}
        </div>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-1 font-medium">Item</th>
              <th className="pb-1 text-center font-medium">Qty</th>
              <th className="pb-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, i) => (
              <tr key={i} className="align-top">
                <td className="py-1 pr-1">
                  <span className="block leading-tight">{line.name}</span>
                  {line.size ? <span className="text-[10px] text-gray-500">{line.size}</span> : null}
                  <span className="block text-[10px] text-gray-500">{formatCurrency(line.price)} ea</span>
                </td>
                <td className="py-1 text-center">{line.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(line.lineTotal ?? line.price * line.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Tax ({settings.taxRate ?? 0}%)</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-gray-300" />

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Payment</span>
            <span className="capitalize">{capitalize(payment.method) || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Paid</span>
            <span>{formatCurrency(payment.received || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Due</span>
            <span>{formatCurrency(payment.due || 0)}</span>
          </div>
          {Number(payment.change) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Change</span>
              <span>{formatCurrency(payment.change)}</span>
            </div>
          )}
        </div>

        {settings.receiptFooter ? (
          <p className="mt-4 text-center text-xs italic text-gray-800">{settings.receiptFooter}</p>
        ) : (
          <p className="mt-4 text-center text-xs italic text-gray-800">Thank you for your visit!</p>
        )}
        <PrintFooter />
      </div>
    </Modal>
  )
}
