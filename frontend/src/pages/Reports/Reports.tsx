import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  DollarSign,
  Lock,
  Megaphone,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { dashboardApi, reportApi } from '@/services/api';
import { formatCurrency, formatNumber } from '@/utils/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/cards/StatCard';
import { SalesChart } from '@/components/charts/SalesChart';
import { TopSellingCard } from '@/components/cards/TopSellingCard';

const REPORTS_PIN = '1234';

const DATE_RANGES = ['Today', 'Last 7 Days', 'This Month'];

function formatShortDate(value: string): string {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Reports() {
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const navigate = useNavigate();

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  const salesQuery = useQuery({
    queryKey: ['reports-sales', dateRange],
    queryFn: reportApi.getSales,
  });

  const isLoading = dashboardQuery.isLoading || salesQuery.isLoading;
  const isError = dashboardQuery.isError || salesQuery.isError;

  const handleUnlock = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pin === REPORTS_PIN) {
      setUnlocked(true);
      setPin('');
      setPinError('');
    } else {
      setPin('');
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="card w-full max-w-sm p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <Lock size={22} className="text-amber-500" />
          </div>
          <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">Enter PIN</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Reports are protected. Enter your 4-digit PIN to continue.
          </p>
          <form onSubmit={handleUnlock} className="mt-6">
            <Input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setPinError('');
              }}
              placeholder="••••"
              className="text-center text-base tracking-[0.5em]"
              aria-label="Reports PIN"
            />
            {pinError && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-red-500">
                <AlertCircle size={14} />
                {pinError}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/pos')}>
                Cancel
              </Button>
              <Button type="submit">Unlock</Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const stats = dashboardQuery.data?.stats;
  const topSellingItems = dashboardQuery.data?.topSellingItems ?? [];
  const salesData = salesQuery.data?.salesData ?? [];
  const rangeLabel = salesData.length
    ? `${formatShortDate(salesData[0].date)} - ${formatShortDate(salesData[salesData.length - 1].date)}`
    : dateRange;

  return (
    <div>
      <PageHeader
        title="Good Morning, Alex!"
        subtitle="Here's what's happening at your restaurant today."
      >
        <div className="relative">
          <Calendar
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {DATE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      ) : isError || !stats ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-sm font-medium text-slate-700">Failed to load report data.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              dashboardQuery.refetch();
              salesQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={DollarSign}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Total Sales"
              value={formatCurrency(stats.totalSales)}
              change={12.5}
              changeLabel="vs last week"
            />
            <StatCard
              icon={ShoppingBag}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              label="Total Orders"
              value={formatNumber(stats.totalOrders)}
              change={8.2}
              changeLabel="vs last week"
            />
            <StatCard
              icon={ReceiptText}
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
              label="Avg. Order Value"
              value={formatCurrency(stats.avgOrderValue)}
              change={-2.1}
              changePositive={false}
              changeLabel="vs last week"
            />
            <StatCard
              icon={TrendingUp}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              label="Total Profit"
              value={formatCurrency(stats.totalProfit)}
              change={15.3}
              changeLabel="vs last week"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-slate-900">Sales Overview</h2>
                <p className="mt-0.5 text-xs text-slate-500">{rangeLabel}</p>
              </div>
              <SalesChart data={salesData} />
            </div>

            <div className="flex flex-col gap-6">
              <div className="card p-5">
                <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Top Selling Items</h2>
                <TopSellingCard items={topSellingItems} />
              </div>

              <div className="rounded-card bg-gradient-to-br from-primary-600 to-emerald-600 p-5 shadow-card">
                <h3 className="text-lg font-bold text-white">Promote your restaurant</h3>
                <p className="mt-1.5 text-sm text-emerald-50">
                  Reach more customers and grow your sales with targeted marketing campaigns.
                </p>
                <Button className="mt-4 w-full border-0 !bg-white !text-primary-700 shadow-none hover:!bg-emerald-50">
                  <Megaphone size={16} />
                  Launch Campaign
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
