"use client";

import { useMemo } from "react";

const GLYPHS = ["💕", "🐾", "💗", "✨", "🐱"];

export default function HeartsBackground() {
  const items = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        left: (index * 53) % 100,
        delay: (index % 9) * 1.3,
        duration: 9 + (index % 6),
        glyph: GLYPHS[index % GLYPHS.length],
        size: 18 + (index % 4) * 8,
      })),
    [],
  );

  return (
    <div className="hearts" aria-hidden>
      {items.map((item, index) => (
        <span
          key={index}
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: item.size,
          }}
        >
          {item.glyph}
        </span>
      ))}
    </div>
  );
}
