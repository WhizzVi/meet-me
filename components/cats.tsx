export function CatFace({ mood, size = 120 }: { mood: "sly" | "happy" | "sweet"; size?: number }) {
  const emoji = mood === "happy" ? "😸" : mood === "sly" ? "😼" : "😺";
  return (
    <div
      aria-hidden
      style={{
        fontSize: size,
        lineHeight: 1,
        filter: "drop-shadow(0 8px 16px rgba(232, 92, 135, 0.25))",
      }}
    >
      {emoji}
    </div>
  );
}
