import DishPicker from "@/components/DishPicker";

export default function WhatPage() {
  return (
    <main className="page">
      <div className="card">
        <h1>Что хочешь покушать? 😋</h1>
        <p className="subtitle">Выбирай, чего душа просит 🐾</p>
        <div style={{ marginTop: 20 }}>
          <DishPicker />
        </div>
      </div>
    </main>
  );
}
