import { UtensilsCrossed } from 'lucide-react';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/format';
import { EmptyState } from '@/components/ui/EmptyState';

interface TopSellingCardProps {
  items: (MenuItem & { sold: number })[];
  limit?: number;
}

export function TopSellingCard({ items, limit = 5 }: TopSellingCardProps) {
  const list = items.slice(0, limit);

  if (list.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No sales data yet"
        description="Top selling items will appear here once you have some sales."
      />
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {list.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <UtensilsCrossed size={18} className="text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-800">{item.name}</div>
            <div className="text-xs text-slate-400">{item.category?.name}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-md bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-600">
              {item.sold} sold
            </span>
            <span className="text-sm font-medium text-slate-700">{formatCurrency(item.price)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}