import { Armchair, Eye } from 'lucide-react';
import type { Table } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface TableCardProps {
  table: Table;
  onClick?: () => void;
}

const accentColors: Record<Table['status'], string> = {
  available: 'bg-green-500',
  occupied: 'bg-amber-400',
  reserved: 'bg-purple-500',
};

export function TableCard({ table, onClick }: TableCardProps) {
  return (
    <div
      onClick={onClick}
      className={`card overflow-hidden p-5 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-card-hover' : ''
      }`}
    >
      <div className={`h-1 rounded-t -mt-5 -mx-5 mb-4 ${accentColors[table.status]}`} />

      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-bold text-slate-900">Table {table.number}</h3>
        <StatusBadge status={table.status} />
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Armchair size={14} />
        <span>{table.seats} seats</span>
      </div>

      <div className="border-t border-gray-100 pt-3">
        {table.status === 'occupied' && table.orderId && (
          <div className="flex items-center justify-between">
            <span className="inline-block rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-slate-700">
              Order #{table.orderId.slice(0, 8)}
            </span>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              <Eye size={12} />
              View
            </button>
          </div>
        )}
        {table.status === 'reserved' && (
          <span className="inline-block rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
            Reserved
          </span>
        )}
        {table.status === 'available' && (
          <span className="text-xs font-medium text-green-600">Ready to seat</span>
        )}
      </div>
    </div>
  );
}
