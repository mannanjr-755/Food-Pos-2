import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Category, MenuItem } from '@/types';
import { cn } from '@/utils/cn';
import { menuApi, categoryApi } from '@/services/api';
import { ProductCard } from '@/components/pos/ProductCard';
import { OrderCart } from '@/components/pos/OrderCart';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

const ALL_CATEGORY: Category = { id: 'all', name: 'All' };

export function POS() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [menuData, categoryData] = await Promise.all([
        menuApi.getAll(),
        categoryApi.getAll(),
      ]);
      setMenu(menuData);
      setCategories(categoryData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const increment = useCallback((id: string) => {
    setCart((prev) =>
      prev.map((line) =>
        line.item.id === id ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
  }, []);

  const decrement = useCallback((id: string) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.item.id === id ? { ...line, quantity: line.quantity - 1 } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const remove = useCallback((id: string) => {
    setCart((prev) => prev.filter((line) => line.item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const filtered = menu.filter(
    (item) =>
      (activeCategory === 'all' || item.categoryId === activeCategory) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] gap-5">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">POS / Billing</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Select items and place orders right from the counter
            </p>
          </div>
          <div className="relative w-64 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="mb-4 flex shrink-0 gap-2 overflow-x-auto pb-1">
          {[ALL_CATEGORY, ...categories].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition',
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-slate-600 hover:bg-gray-50'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm text-slate-500">Failed to load the menu.</p>
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">No items found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pb-1 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((item) => (
                  <ProductCard key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-[360px] shrink-0">
        <OrderCart
          items={cart}
          onIncrement={increment}
          onDecrement={decrement}
          onRemove={remove}
          onClear={clearCart}
        />
      </div>
    </div>
  );
}