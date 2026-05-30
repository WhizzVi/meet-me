"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WhenForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!date || !time) return;
    setBusy(true);
    setFailed(false);
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date, time }),
    }).catch(() => null);
    if (response?.ok) {
      router.push("/what");
    } else {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="date">Дата 📅</label>
        <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="time">Время ⏰</label>
        <input id="time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
      </div>
      <button type="submit" className="btn" disabled={busy} style={{ width: "100%" }}>
        Дальше 💌
      </button>
      {failed && (
        <p style={{ color: "var(--pink-700)", marginTop: 12 }}>Упс, что-то пошло не так 🙀 Попробуй ещё раз.</p>
      )}
    </form>
  );
}
