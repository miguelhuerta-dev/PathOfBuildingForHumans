/** "+12%" or "−8%", never "+-8%". */
export function signedPercent(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded)}%`;
}

/**
 * How much more damage a resistance lets through than its maximum would:
 * at 70% with a 76% maximum you take 30% of the damage instead of 24%, i.e. 25% more.
 */
export function extraDamageTaken(resist: number, max: number): number {
  return Math.round(((100 - resist) / Math.max(1, 100 - max) - 1) * 100);
}
