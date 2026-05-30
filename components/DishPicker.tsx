"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DISHES } from "@/lib/dishes";

export default function DishPicker() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pick(dishId: string) {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dish: dishId }),
    });
    if (response.ok) {
      router.push("/final");
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="dish-grid">
      {DISHES.map((dish) => (
        <button key={dish.id} type="button" className="dish-btn" onClick={() => pick(dish.id)} disabled={busy}>
          <span className="dish-emoji">{dish.emoji}</span>
          {dish.label}
        </button>
      ))}
    </div>
  );
}
