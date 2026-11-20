import type { ReactNode } from "react";
import { useT } from "../i18n";
import { translateError } from "../i18n/errors";

/** Shared archive controls. Every page uses these instead of styling its own. */

interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipGroupProps<T> {
  label: string;
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  disabled?: boolean;
}

/** A row of toggle chips where exactly one is selected (leagues, guide stages…). */
export function ChipGroup<T extends string | number>({ label, options, selected, onSelect, disabled }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={`border px-4 py-1.5 font-display text-[13px] tracking-[0.12em] transition-colors disabled:opacity-60 ${
              active
                ? "border-gold bg-[linear-gradient(180deg,#4a3618,#241808)] text-[#f2dfa8]"
                : "border-gold-dim/40 text-parchment-dim hover:border-gold-dim hover:text-gold"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface MetalMeterProps {
  label: string;
  value: number;
  max: number;
  className?: string;
}

/** Engraved progress bar with a bronze fill. */
export function MetalMeter({ label, value, max, className = "" }: MetalMeterProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`h-4 border border-[#4a3a22] bg-[#060403]/80 p-[3px] shadow-[inset_0_2px_4px_#000] ${className}`}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="metal-bar meter-fill h-full shadow-[0_0_10px_rgba(230,180,90,0.45)]" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Error message read out by screen readers. */
/** An error in red; a plain message is shown in the chosen language. */
export function ErrorNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  const t = useT();
  return (
    <p role="alert" className={`text-[17px] text-[#ef7563] ${className}`}>
      {typeof children === "string" ? translateError(children, t) : children}
    </p>
  );
}
