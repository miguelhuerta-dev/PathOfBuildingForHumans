interface AtlasCornerProps {
  flipX?: boolean;
  flipY?: boolean;
}

function AtlasCorner({
  flipX = false,
  flipY = false,
}: AtlasCornerProps) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      style={{
        transform: `
          scaleX(${flipX ? -1 : 1})
          scaleY(${flipY ? -1 : 1})
        `,
      }}
    >
      {/* Línea exterior */}

      <path
        d="M4 56V4H56"
        stroke="#6F5A35"
        strokeWidth="1.5"
      />

      {/* Línea interior */}

      <path
        d="M10 50V10H50"
        stroke="#6F5A35"
        strokeWidth="1"
        opacity="0.8"
      />

      {/* Nodo principal */}

      <circle
        cx="4"
        cy="56"
        r="2.8"
        fill="#8C6A34"
      />

      {/* Nodo secundario */}

      <circle
        cx="16"
        cy="44"
        r="1.8"
        fill="#A8864B"
      />

      {/* Curva ornamental */}

      <path
        d="M16 44
           C 28 44,
             36 36,
             36 24"
        stroke="#6F5A35"
        strokeWidth="1.1"
        fill="none"
      />

      {/* Remate */}

      <path
        d="M36 24
           Q 42 18 48 18"
        stroke="#6F5A35"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export default AtlasCorner;