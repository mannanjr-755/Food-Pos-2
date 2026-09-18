import { UtensilsCrossed, Plus } from 'lucide-react';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function ProductCard({ item, onAdd }: ProductCardProps) {
  const disabled = !item.available;

  return (
    <div
      className={cn(
        'group rounded-card bg-white shadow-card border border-gray-100 overflow-hidden transition hover:shadow-card-hover cursor-pointer',
        disabled && 'grayscale opacity-60'
      )}
    >
      <div className="relative h-36 w-full bg-gray-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover select-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UtensilsCrossed className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{item.category.name}</p>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm font-bold text-primary-600">
            {formatCurrency(item.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onAdd(item);
            }}
            disabled={disabled}
            aria-label={`Add ${item.name} to order`}
            className="rounded-lg bg-primary-600 p-1.5 text-white transition hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
