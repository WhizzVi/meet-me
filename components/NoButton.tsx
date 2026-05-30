"use client";

import { useCallback, useRef, useState } from "react";

export default function NoButton() {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [sly, setSly] = useState(false);

  const flee = useCallback(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    setSly(true);
    const maxLeft = Math.max(0, zone.clientWidth - 130);
    const maxTop = Math.max(0, zone.clientHeight - 60);
    const nextLeft = Math.floor((Math.sin(Date.now() * 0.013) * 0.5 + 0.5) * maxLeft);
    const nextTop = Math.floor((Math.cos(Date.now() * 0.017) * 0.5 + 0.5) * maxTop);
    setPos({ left: nextLeft, top: nextTop });
  }, []);

  return (
    <div ref={zoneRef} className="runaway-zone">
      <button
        type="button"
        className="btn btn-secondary btn-no"
        style={pos ? { left: pos.left, top: pos.top } : { left: "calc(50% + 90px)", top: 40 }}
        onMouseEnter={flee}
        onPointerDown={(event) => {
          event.preventDefault();
          flee();
        }}
        onClick={(event) => event.preventDefault()}
      >
        {sly ? "Нет 😏" : "Нет 😢"}
      </button>
    </div>
  );
}
