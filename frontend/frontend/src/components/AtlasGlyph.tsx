function AtlasGlyph() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
    >
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="#6F5A35"
        strokeWidth="1.5"
      />

      <circle
        cx="24"
        cy="24"
        r="7"
        stroke="#8C6A34"
        strokeWidth="1.2"
      />

      <circle
        cx="24"
        cy="24"
        r="2"
        fill="#8C6A34"
      />

      <line x1="24" y1="2" x2="24" y2="14" stroke="#6F5A35" />
      <line x1="24" y1="34" x2="24" y2="46" stroke="#6F5A35" />
      <line x1="2" y1="24" x2="14" y2="24" stroke="#6F5A35" />
      <line x1="34" y1="24" x2="46" y2="24" stroke="#6F5A35" />

      <line x1="10" y1="10" x2="17" y2="17" stroke="#6F5A35" />
      <line x1="31" y1="31" x2="38" y2="38" stroke="#6F5A35" />
      <line x1="38" y1="10" x2="31" y2="17" stroke="#6F5A35" />
      <line x1="17" y1="31" x2="10" y2="38" stroke="#6F5A35" />
    </svg>
  );
}

export default AtlasGlyph;