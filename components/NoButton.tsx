"use client";

import { useCallback, useRef, useState } from "react";

export default function NoButton() {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [sly, setSly] = useState(false);

  const flee = useCallback((clientX: number, clientY: number) => {
    const zone = zoneRef.current;
    if (!zone) return;
    setSly(true);
    const rect = zone.getBoundingClientRect();
    const maxLeft = Math.max(0, zone.clientWidth - 130);
    const maxTop = Math.max(0, zone.clientHeight - 60);
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;
    const jitterX = Math.abs(Math.sin(clientX * 12.9898 + clientY * 78.233)) % 1;
    const jitterY = Math.abs(Math.sin(clientX * 39.346 + clientY * 11.135)) % 1;
    const nextLeft = cursorX < zone.clientWidth / 2 ? maxLeft * (0.6 + 0.4 * jitterX) : maxLeft * (0.4 * jitterX);
    const nextTop = cursorY < zone.clientHeight / 2 ? maxTop * (0.6 + 0.4 * jitterY) : maxTop * (0.4 * jitterY);
    setPos({ left: Math.floor(nextLeft), top: Math.floor(nextTop) });
  }, []);

  return (
    <div ref={zoneRef} className="runaway-zone">
      <button
        type="button"
        className="btn btn-secondary btn-no"
        style={pos ? { left: pos.left, top: pos.top } : { left: "calc(50% + 90px)", top: 40 }}
        onMouseEnter={(event) => flee(event.clientX, event.clientY)}
        onPointerDown={(event) => {
          event.preventDefault();
          flee(event.clientX, event.clientY);
        }}
        onClick={(event) => event.preventDefault()}
      >
        {sly ? "Нет 😏" : "Нет 😢"}
      </button>
    </div>
  );
}
