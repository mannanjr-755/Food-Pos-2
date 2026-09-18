export function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}