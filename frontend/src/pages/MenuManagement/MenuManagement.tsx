import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import type { MenuItem } from '@/types';
import { menuApi, categoryApi } from '@/services/api';
import { formatCurrency } from '@/utils/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { DataTable } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/Badge';
import type { Column } from '@/components/tables/DataTable';

const menuSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  description: z.string().optional(),
  image: z.string().optional(),
  available: z.enum(['available', 'unavailable']),
});

type MenuFormData = z.infer<typeof menuSchema>;

export function MenuManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu', { category: selectedCategory, search: debouncedSearch }],
    queryFn: () =>
      menuApi.getAll({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: debouncedSearch || undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: menuApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof menuApi.update>[1] }) =>
      menuApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setModalOpen(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setDeleteId(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      price: 0,
      description: '',
      image: '',
      available: 'available',
    },
  });

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return menuItems.length;
    return menuItems.filter((item) => item.categoryId === categoryId).length;
  };

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      name: '',
      categoryId: categories[0]?.id ?? '',
      price: 0,
      description: '',
      image: '',
      available: 'available',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    reset({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description ?? '',
      image: item.image ?? '',
      available: item.available ? 'available' : 'unavailable',
    });
    setModalOpen(true);
  };

  const onSubmit = (data: MenuFormData) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      categoryId: data.categoryId,
      image: data.image || undefined,
      available: data.available === 'available',
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<MenuItem>[] = [
    {
      key: 'image',
      header: '',
      className: 'w-14',
      render: (row) =>
        row.image ? (
          <img src={row.image} alt={row.name} className="h-11 w-11 rounded-lg object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
            <UtensilsCrossed size={18} className="text-gray-400" />
          </div>
        ),
    },
    {
      key: 'name',
      header: 'Item Name',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.name}</div>
          {row.description && (
            <div className="max-w-[200px] truncate text-xs text-slate-400">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="text-sm text-slate-500">{getCategoryName(row.categoryId)}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      className: 'text-right',
      render: (row) => <span className="font-medium">{formatCurrency(row.price)}</span>,
    },
    {
      key: 'available',
      header: 'Status',
      render: (row) => <StatusBadge status={row.available ? 'available' : 'unavailable'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEditModal(row)} className="btn-icon">
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="btn-icon text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Menu Management" subtitle="Manage your food items, categories and prices.">
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Add Item
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
          />
        </div>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-48"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <div className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h3 className="mb-3 px-1 text-sm font-semibold text-slate-700">Categories</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  selectedCategory === 'all'
                    ? 'bg-primary-50 font-semibold text-primary-600'
                    : 'text-slate-600 hover:bg-gray-50'
                }`}
              >
                <span>All</span>
                <Badge variant="gray">{getCategoryCount('all')}</Badge>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    selectedCategory === cat.id
                      ? 'bg-primary-50 font-semibold text-primary-600'
                      : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <Badge variant="gray">{getCategoryCount(cat.id)}</Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="card flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <DataTable<MenuItem>
              columns={columns}
              data={menuItems}
              emptyMessage="No menu items found"
            />
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Select label="Category" {...register('categoryId')} error={errors.categoryId?.message}>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            {...register('price')}
            error={errors.price?.message}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
            />
          </div>
          <Input label="Image URL" {...register('image')} error={errors.image?.message} />
          <Select label="Status" {...register('available')}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>
          <div className="mt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Menu Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
