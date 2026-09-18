export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  category: Category;
  categoryId: string;
  available: boolean;
  createdAt?: string;
}

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  orderId?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string | null;
  table?: Table | null;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  createdAt?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  totalProfit: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topSellingItems: (MenuItem & { sold: number })[];
  recentOrders: Order[];
}

export interface ReportData {
  stats: {
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
  };
  topSellingItems: (MenuItem & { sold: number })[];
  salesData: { date: string; amount: number }[];
}