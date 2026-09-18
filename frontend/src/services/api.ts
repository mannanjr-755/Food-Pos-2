import axios from 'axios';
import type {
  Category,
  MenuItem,
  Table,
  Order,
  DashboardData,
  InventoryItem,
  ReportData,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard').then((r) => r.data),
};

export const categoryApi = {
  getAll: () => api.get<Category[]>('/categories').then((r) => r.data),
};

export const menuApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get<MenuItem[]>('/menu-items', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get<MenuItem>(`/menu-items/${id}`).then((r) => r.data),
  create: (data: {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    image?: string;
    available?: boolean;
  }) => api.post<MenuItem>('/menu-items', data).then((r) => r.data),
  update: (
    id: string,
    data: {
      name: string;
      description?: string;
      price: number;
      categoryId: string;
      image?: string;
      available?: boolean;
    }
  ) => api.put<MenuItem>(`/menu-items/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/menu-items/${id}`).then((r) => r.data),
};

export const tableApi = {
  getAll: () => api.get<Table[]>('/tables').then((r) => r.data),
  create: (data: { number: number; seats?: number }) =>
    api.post<Table>('/tables', data).then((r) => r.data),
  update: (id: string, data: { status?: string; orderId?: string | null }) =>
    api.put<Table>(`/tables/${id}`, data).then((r) => r.data),
};

export const orderApi = {
  getAll: (params?: { status?: string }) =>
    api.get<Order[]>('/orders', { params }).then((r) => r.data),
  create: (data: {
    tableId?: string | null;
    items: { menuItemId: string; quantity: number }[];
  }) => api.post<Order>('/orders', data).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
};

export const inventoryApi = {
  getAll: (params?: { search?: string }) =>
    api.get<InventoryItem[]>('/inventory', { params }).then((r) => r.data),
  create: (data: {
    name: string;
    category: string;
    stock: number;
    unit?: string;
    minStock?: number;
  }) => api.post<InventoryItem>('/inventory', data).then((r) => r.data),
  update: (id: string, data: { stock: number }) =>
    api.put<InventoryItem>(`/inventory/${id}`, data).then((r) => r.data),
};

export const reportApi = {
  getSales: () => api.get<ReportData>('/reports/sales').then((r) => r.data),
};