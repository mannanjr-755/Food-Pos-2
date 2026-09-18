import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const variantByStatus: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray'> = {
  available: 'green',
  'in stock': 'green',
  completed: 'green',
  'low stock': 'red',
  occupied: 'amber',
  preparing: 'amber',
  pending: 'amber',
  ready: 'blue',
  reserved: 'purple',
  unavailable: 'gray',
};

const labelByStatus: Record<string, string> = {
  available: 'Available',
  'in stock': 'In Stock',
  'low stock': 'Low Stock',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const label = labelByStatus[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');

  return (
    <Badge variant={variantByStatus[status] ?? 'gray'} className={className}>
      {label}
    </Badge>
  );
}