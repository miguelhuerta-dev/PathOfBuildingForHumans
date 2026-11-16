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
      width="48"
      height="48"
      viewBox="0 0 48 48"
      style={{
        transform: `
          scaleX(${flipX ? -1 : 1})
          scaleY(${flipY ? -1 : 1})
        `,
      }}
    >
      <path
        d="M4 44V4H44"
        stroke="#A8864B"
        strokeWidth="1.5"
        fill="none"
      />

      <circle
        cx="4"
        cy="44"
        r="2.5"
        fill="#D4AF6A"
      />

      <path
        d="M10 38C22 38 30 30 30 18"
        stroke="#A8864B"
        strokeWidth="1"
        fill="none"
      />

      <circle
        cx="12"
        cy="36"
        r="1.5"
        fill="#D4AF6A"
      />
    </svg>
  );
}

export default AtlasCorner;