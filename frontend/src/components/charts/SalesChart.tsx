import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/utils/format';

interface SalesChartProps {
  data: { date: string; amount: number }[];
  height?: number;
}

const formatTick = (v: number) =>
  v < 1000 ? `$${v}` : `$${(v / 1000).toFixed(1)}k`;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);

  return (
    <div className="rounded-lg border-0 bg-white px-3 py-2 shadow-card">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{formatCurrency(value)}</p>
    </div>
  );
}

export function SalesChart({ data, height = 300 }: SalesChartProps) {
  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
        <span className="text-xs font-medium text-slate-500">Sales</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={formatTick}
              width={56}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e2e8f0' }} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}