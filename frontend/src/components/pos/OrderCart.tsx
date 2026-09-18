import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { MenuItem, Table } from '@/types';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { tableApi, orderApi } from '@/services/api';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface OrderCartProps {
  items: CartLine[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  taxRate?: number;
}

export function OrderCart({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  taxRate = 8,
}: OrderCartProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    tableApi
      .getAll()
      .then((data) => {
        if (active) setTables(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const totalQty = items.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = items.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!tableId) {
      setError('Please select a table before placing the order.');
      return;
    }
    setError(null);
    setSuccess(null);
    setPlacing(true);
    try {
      const order = await orderApi.create({
        tableId,
        items: items.map((line) => ({
          menuItemId: line.item.id,
          quantity: line.quantity,
        })),
      });
      setPlacing(false);
      setSuccess(`Order #${order.orderNumber} placed successfully.`);
      onClear();
      setTableId('');
    } catch (err) {
      setPlacing(false);
      setError('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card bg-white shadow-card border border-gray-100">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="font-semibold text-slate-900">Current Order</h2>
          {totalQty > 0 && (
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-600">
              {totalQty}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            className="btn-icon hover:text-red-500"
            onClick={() => setConfirmClear(true)}
            aria-label="Clear order"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="px-5 pt-4">
          <Select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full"
          >
            <option value="">Select table</option>
            {tables
              .filter((t) => t.status === 'available' || t.status === 'occupied')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} · {t.seats} seats ({t.status})
                </option>
              ))}
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="mx-5 my-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-4 py-10 text-center">
            <ShoppingCart className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-slate-700">Your cart is empty</p>
            <p className="mt-1 text-xs text-slate-400">Add items from the menu</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 px-5">
            {items.map(({ item, quantity }) => (
              <li key={item.id} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded p-1 text-slate-300 transition hover:text-red-400"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDecrement(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-slate-600 transition hover:bg-gray-50"
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onIncrement(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.price * quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="rounded-xl bg-gray-50/50 p-4 mx-5 mb-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm text-slate-500">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-gray-200 pt-2.5">
              <span className="text-sm font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            {success && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} className="shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={placing}
              className={cn('w-full rounded-xl py-3 text-base', placing && 'opacity-70')}
            >
              {placing ? (
                <>
                  <Spinner size="sm" className="border-white/40 border-t-white" />
                  Placing...
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Place Order <span className="ml-0.5">—</span>{' '}
                  <span className="font-bold">{formatCurrency(total)}</span>
                </>
              )}
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          onClear();
          setConfirmClear(false);
        }}
        title="Clear Order"
        message="Are you sure you want to remove all items from your current order?"
      />
    </div>
  );
}