import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, UtensilsCrossed } from 'lucide-react';
import { orderApi } from '@/services/api';
import type { Order, Table } from '@/types';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

const TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'completed'];

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function itemsSummary(order: Order): string {
  const parts = order.items.map(
    (it) => `${it.quantity}× ${it.menuItem?.name ?? 'Item'}`
  );
  const shown = parts.slice(0, 2).join(', ');
  const rest = parts.length - 2;
  return rest > 0 ? `${shown} +${rest} more` : shown;
}

export function OrderManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => orderApi.getAll({ status: activeTab === 'all' ? undefined : activeTab }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null;

  const tableName = (order: Order) => (order.table ? `Table ${(order.table as Table).number}` : 'Takeaway');
  const itemCount = (order: Order) => order.items.reduce((sum, it) => sum + it.quantity, 0);

  const nextStatus = selectedOrder
    ? STATUS_ORDER[STATUS_ORDER.indexOf(selectedOrder.status) + 1]
    : undefined;

  const nextActionLabel =
    nextStatus === 'completed' ? 'Mark Complete' : nextStatus ? `Mark ${nextStatus[0].toUpperCase()}${nextStatus.slice(1)}` : undefined;

  const handleStatusChange = (status: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate(
      { id: selectedOrder.id, status },
      { onSuccess: () => setSelectedOrderId(null) }
    );
  };

  return (
    <>
      <PageHeader title="Order Management" subtitle="Track and manage all incoming orders." />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = orders && activeTab === 'all' ? undefined : orders?.length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-slate-600 hover:bg-gray-50'
              )}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs font-semibold',
                    activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="card flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-sm font-medium text-slate-700">Failed to load orders.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  {['Order #', 'Table', 'Items', 'Status', 'Time', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders && orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={UtensilsCrossed}
                        title={`No ${activeTab === 'all' ? '' : activeTab} orders`}
                        description="Orders will appear here as they come in."
                      />
                    </td>
                  </tr>
                ) : (
                  orders?.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3.5 text-slate-600">{tableName(order)}</td>
                      <td className="max-w-[260px] px-4 py-3.5">
                        <p className="truncate text-slate-600">{itemsSummary(order)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {formatTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        title={selectedOrder ? `Order ${selectedOrder.orderNumber}` : ''}
      >
        {selectedOrder && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={selectedOrder.status} />
              <span className="text-sm text-slate-500">
                {tableName(selectedOrder)} · {itemCount(selectedOrder)} items ·{' '}
                {formatTime(selectedOrder.createdAt)}
              </span>
            </div>

            <div className="mb-5 overflow-hidden rounded-xl border border-gray-100">
              {selectedOrder.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {it.menuItem?.image ? (
                      <img
                        src={it.menuItem.image}
                        alt={it.menuItem?.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                        <UtensilsCrossed size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {it.menuItem?.name}
                      </p>
                      <p className="text-xs text-slate-400">× {it.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatCurrency(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-5 space-y-1.5 rounded-xl bg-gray-50/70 px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (8%)</span>
                <span>{formatCurrency(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.status !== 'completed' && nextStatus && nextActionLabel && (
              <Button
                className="w-full"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusChange(nextStatus)}
              >
                {nextActionLabel}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}