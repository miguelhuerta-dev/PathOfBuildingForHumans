export { formatNumber } from "./formatNumber";

/** "+12%", "-3%", "0%". */
export function formatSignedPercent(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

/** Text colour for a change where higher is better. */
export function changeTone(value: number): string {
  const rounded = Math.round(value);
  return rounded > 0 ? "text-verdigris" : rounded < 0 ? "text-[#ef7563]" : "text-parchment-faint";
}
