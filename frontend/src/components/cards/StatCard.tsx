import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  change: number;
  changeLabel?: string;
  changePositive?: boolean;
}

export function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  change,
  changeLabel,
  changePositive,
}: StatCardProps) {
  const positive = changePositive ?? change >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        <span className="pt-0.5 text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}
        >
          <TrendIcon size={12} />
          {positive ? '+' : ''}
          {change}%
        </span>
        {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
      </div>
    </div>
  );
}