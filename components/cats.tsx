export function CatFace({ mood, size = 120 }: { mood: "sly" | "happy" | "sweet"; size?: number }) {
  const eyes = mood === "sly" ? "︶  ︶" : mood === "happy" ? "^   ^" : "•   •";
  const mouth = mood === "happy" ? "ω" : mood === "sly" ? "‿" : "ᴥ";
  return (
    <div aria-hidden style={{ fontSize: size, lineHeight: 1 }}>
      {mood === "happy" ? "😸" : mood === "sly" ? "😼" : "😺"}
      <div style={{ fontSize: size * 0.18, color: "var(--pink-700)" }}>{eyes} {mouth}</div>
    </div>
  );
}
