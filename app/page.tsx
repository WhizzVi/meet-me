import Link from "next/link";
import NoButton from "@/components/NoButton";

export default function Home() {
  return (
    <main className="page">
      <div className="card">
        <h1>Ты пойдёшь со мной на свидание? 🥰</h1>
        <p className="subtitle">Только честно… 🐾</p>
        <div className="btn-row" style={{ marginTop: 24 }}>
          <Link href="/when" className="btn">Да 💖</Link>
        </div>
        <NoButton />
      </div>
    </main>
  );
}
