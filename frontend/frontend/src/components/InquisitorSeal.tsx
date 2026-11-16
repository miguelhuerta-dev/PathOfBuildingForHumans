function InquisitorSeal() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
    >
      {/* Anillo exterior */}
      <circle
        cx="21"
        cy="21"
        r="16"
        stroke="#A8864B"
        strokeWidth="1.5"
      />

      {/* Sol interior */}
      <circle
        cx="21"
        cy="21"
        r="6"
        stroke="#D4AF6A"
        strokeWidth="1.2"
      />

      {/* Centro */}
      <circle
        cx="21"
        cy="21"
        r="2"
        fill="#D4AF6A"
      />

      {/* Rayos cardinales */}
      <line x1="21" y1="2" x2="21" y2="12" stroke="#D4AF6A" />
      <line x1="21" y1="30" x2="21" y2="40" stroke="#D4AF6A" />
      <line x1="2" y1="21" x2="12" y2="21" stroke="#D4AF6A" />
      <line x1="30" y1="21" x2="40" y2="21" stroke="#D4AF6A" />

      {/* Rayos diagonales */}
      <line x1="8" y1="8" x2="14" y2="14" stroke="#A8864B" />
      <line x1="28" y1="28" x2="34" y2="34" stroke="#A8864B" />
      <line x1="34" y1="8" x2="28" y2="14" stroke="#A8864B" />
      <line x1="14" y1="28" x2="8" y2="34" stroke="#A8864B" />
    </svg>
  );
}

export default InquisitorSeal;