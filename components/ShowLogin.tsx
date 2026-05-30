"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ShowLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function submit() {
    const response = await fetch("/api/show-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div>
      <div className="field">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Пароль"
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
      </div>
      {error && <p style={{ color: "var(--pink-700)" }}>Неверный пароль 🙀</p>}
      <button type="button" className="btn" style={{ width: "100%" }} onClick={submit}>
        Войти
      </button>
    </div>
  );
}
