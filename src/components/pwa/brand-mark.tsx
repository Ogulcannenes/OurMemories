// The app mark: two cream quotation marks on wine. Rendered by the generated icons.
export function BrandMark({ size, padding }: { size: number; padding: number }) {
  const mark = (size - padding * 2) * 0.62;
  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#754653",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={mark} height={mark * (38 / 48)} viewBox="0 0 48 38" fill="#f8f5ef">
        <path d="M20 2C9.5 3.2 2 11 2 22c0 8 4.6 14 11 14 5.4 0 9-3.8 9-8.8 0-4.8-3.6-8.4-8.2-8.4-1.2 0-2.3.2-3.2.6C11.6 12 15.4 7.4 21 5.6Z" />
        <path d="M45 2C34.5 3.2 27 11 27 22c0 8 4.6 14 11 14 5.4 0 9-3.8 9-8.8 0-4.8-3.6-8.4-8.2-8.4-1.2 0-2.3.2-3.2.6C36.6 12 40.4 7.4 46 5.6Z" />
      </svg>
    </div>
  );
}
