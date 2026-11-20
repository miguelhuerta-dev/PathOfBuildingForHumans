/** Compact display for game numbers: 8.2M, 52K, 760. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${Math.round(value / 1000)}K`;
  if (abs >= 1_000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
}
