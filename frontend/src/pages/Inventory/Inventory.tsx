import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Plus, RefreshCw, Search } from 'lucide-react';
import { inventoryApi } from '@/services/api';
import type { InventoryItem } from '@/types';
import { cn } from '@/utils/cn';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

const ITEM_CATEGORIES = ['Meat', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Other'];

const addSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(1, 'Select a category'),
  stock: z.coerce.number().nonnegative('Stock must be 0 or more'),
  unit: z.string().min(1, 'Unit is required'),
  minStock: z.coerce.number().nonnegative('Minimum stock must be 0 or more'),
});
type AddForm = z.infer<typeof addSchema>;

const updateSchema = z.object({
  stock: z.coerce.number().nonnegative('Stock must be 0 or more'),
});
type UpdateForm = z.infer<typeof updateSchema>;

function StockBar({ stock, minStock }: { stock: number; minStock: number }) {
  const pct = Math.min(100, Math.round((stock / Math.max(minStock * 2, 1)) * 100));
  const low = stock <= minStock;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 text-sm font-semibold text-slate-700">{stock}</span>
      <div className="h-1.5 w-24 rounded-full bg-gray-100">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            low ? 'bg-red-400' : 'bg-primary-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Inventory() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<InventoryItem | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventory', debounced],
    queryFn: () => inventoryApi.getAll({ search: debounced || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  };

  const addMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      invalidate();
      setAddOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => inventoryApi.update(id, { stock }),
    onSuccess: () => {
      invalidate();
      setUpdateTarget(null);
    },
  });

  const addForm = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: '', category: 'Meat', stock: 0, unit: 'kg', minStock: 10 },
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { stock: 0 },
  });

  const openUpdate = (item: InventoryItem) => {
    setUpdateTarget(item);
    updateForm.reset({ stock: item.stock });
  };

  const lowStockItems = items?.filter((it) => it.stock <= it.minStock) ?? [];

  return (
    <>
      <PageHeader title="Inventory / Stock" subtitle="Track your ingredients and stock levels.">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="h-10 w-72 max-w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
          />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add Stock
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="card flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
              <p className="text-sm font-medium text-slate-700">Failed to load inventory.</p>
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
                      {['Item', 'Category', 'Stock', 'Status', 'Action'].map((h) => (
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
                    {items && items.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState
                            title="No inventory items"
                            description="Try a different search or add new stock."
                          />
                        </td>
                      </tr>
                    ) : (
                      items?.map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.unit}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{item.category}</td>
                          <td className="px-4 py-3.5">
                            <StockBar stock={item.stock} minStock={item.minStock} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge
                              status={item.stock <= item.minStock ? 'low stock' : 'in stock'}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <Button variant="secondary" size="sm" onClick={() => openUpdate(item)}>
                              <RefreshCw size={13} />
                              Update
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
        </div>

        <div className="card h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-[15px] font-semibold text-slate-900">Low Stock Alerts</h2>
          </div>
          {lowStockItems.length === 0 ? (
            <EmptyState
              title="All good"
              description="No items are running low right now."
            />
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50/50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-red-600">
                      {item.stock} {item.unit} left (min {item.minStock})
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openUpdate(item)}>
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Stock Item">
        <form
          onSubmit={addForm.handleSubmit((data) =>
            addMutation.mutate({
              name: data.name,
              category: data.category,
              stock: data.stock,
              unit: data.unit,
              minStock: data.minStock,
            })
          )}
          className="space-y-4"
        >
          <Input label="Item name" placeholder="e.g. Chicken Breast" {...addForm.register('name')} error={addForm.formState.errors.name?.message} />
          <Select label="Category" {...addForm.register('category')}>
            {ITEM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock quantity" type="number" min={0} {...addForm.register('stock')} error={addForm.formState.errors.stock?.message} />
            <Input label="Unit" placeholder="e.g. kg" {...addForm.register('unit')} error={addForm.formState.errors.unit?.message} />
          </div>
          <Input label="Minimum stock" type="number" min={0} {...addForm.register('minStock')} error={addForm.formState.errors.minStock?.message} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              <Plus size={16} />
              {addMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!updateTarget}
        onClose={() => setUpdateTarget(null)}
        title={updateTarget ? `Update Stock — ${updateTarget.name}` : ''}
      >
        <form
          onSubmit={updateForm.handleSubmit((data) => {
            if (updateTarget) {
              updateMutation.mutate({ id: updateTarget.id, stock: data.stock });
            }
          })}
          className="space-y-4"
        >
          <Input
            label="New stock level"
            type="number"
            min={0}
            {...updateForm.register('stock')}
            error={updateForm.formState.errors.stock?.message}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setUpdateTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <RefreshCw size={16} />
              {updateMutation.isPending ? 'Saving...' : 'Update Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}