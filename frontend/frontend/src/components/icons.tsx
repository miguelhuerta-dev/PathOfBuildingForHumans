interface IconProps {
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function AtlasStarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <circle cx="24" cy="24" r="17" strokeWidth="1" />
      <path
        d="M24 6l3.5 14.5L42 24l-14.5 3.5L24 42l-3.5-14.5L6 24l14.5-3.5Z"
        fill="currentColor"
        fillOpacity="0.25"
      />
      <path d="M13 13l7 7M35 13l-7 7M13 35l7-7M35 35l-7-7" strokeWidth="1" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function QuillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 3C12 4 7 9 5 17l-1 4 4-1c3-.8 5.5-2.5 7.5-5L12 14l5-1c1.8-2.6 2.8-6 3-10Z" />
      <path d="M4 21l9-9" />
    </svg>
  );
}

export function SwordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M14.5 3H21v6.5L10 20.5 3.5 14Z" />
      <path d="M3 21l3.5-3.5M6 12l6 6" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z" />
      <path d="M12 7v10M8 11h8" />
    </svg>
  );
}

export function SkullIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 5C13.5 5 7 12.5 7 22c0 5.5 2.7 9.4 5.5 11.5V39c0 2 1.2 3 3 3h17c1.8 0 3-1 3-3v-5.5C38.3 31.4 41 27.5 41 22 41 12.5 34.5 5 24 5Z"
        fill="currentColor"
      />
      <ellipse cx="17" cy="23" rx="4.6" ry="5.2" fill="#1a0806" />
      <ellipse cx="31" cy="23" rx="4.6" ry="5.2" fill="#1a0806" />
      <path d="M24 28l-2.8 5.5h5.6Z" fill="#1a0806" />
      <path d="M19 37v5M23 37v5M27 37v5M31 37v5" stroke="#1a0806" strokeWidth="1.3" />
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.4}>
      <path d="M12 5v9" />
      <path d="M12 18.5v.5" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function SigilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base} strokeWidth={1.2}>
      <path d="M24 4l5 15 15 5-15 5-5 15-5-15L4 24l15-5Z" />
      <path d="M24 14l2.5 7.5L34 24l-7.5 2.5L24 34l-2.5-7.5L14 24l7.5-2.5Z" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

/** GitHub's mark (the Octocat silhouette), for the link to the author's profile. */
export function GitHubIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
