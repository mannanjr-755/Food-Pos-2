import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { tableApi } from '@/services/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { TableCard } from '@/components/tables/TableCard';

const tableSchema = z.object({
  number: z.coerce.number().int().min(1, 'Table number must be at least 1'),
  seats: z.coerce.number().int().min(1, 'Seats must be at least 1'),
});

type TableFormData = z.infer<typeof tableSchema>;

export function TableManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tableApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: tableApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setModalOpen(false);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: { number: 1, seats: 4 },
  });

  const filtered = tables.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter,
  );

  const counts = {
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  };

  const statusOptions = [
    { value: 'available', label: 'Available', color: 'bg-green-500' },
    { value: 'occupied', label: 'Occupied', color: 'bg-amber-400' },
    { value: 'reserved', label: 'Reserved', color: 'bg-purple-500' },
  ] as const;

  const onSubmit = (data: TableFormData) => {
    createMutation.mutate({ number: data.number, seats: data.seats });
  };

  return (
    <div>
      <PageHeader title="Table Management" subtitle="Manage table status and view active orders.">
        <Button onClick={() => { reset({ number: 1, seats: 4 }); setModalOpen(true); }}>
          <Plus size={16} />
          Add Table
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {statusOptions.map(({ value, label, color }) => (
          <div key={value} className="card flex items-center gap-3 px-4 py-3">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
            <div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-lg font-bold text-slate-900">{counts[value]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="all">All Tables</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onClick={() => setSelectedId(selectedId === table.id ? null : table.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-slate-500">
              No tables found
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Table">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Table Number" type="number" min="1" {...register('number')} error={errors.number?.message} />
          <Input label="Seats" type="number" min="1" {...register('seats')} error={errors.seats?.message} />
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              Create Table
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
