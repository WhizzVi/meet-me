import { CatFace } from "@/components/cats";
import { getSid } from "@/lib/session";
import { getAttempt } from "@/lib/storage";
import { dishLabel } from "@/lib/dishes";

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export default async function FinalPage() {
  const sid = await getSid();
  const attempt = sid ? await getAttempt(sid) : null;

  if (!attempt) {
    return (
      <main className="page">
        <div className="card">
          <CatFace mood="sweet" />
          <h1>Ой! 🐱</h1>
          <p className="subtitle">Кажется, мы потеряли твой выбор. Начни сначала 💕</p>
        </div>
      </main>
    );
  }

  const when = `${formatDate(attempt.date)} в ${attempt.time}`;
  const dish = attempt.dish ? dishLabel(attempt.dish) : "что-нибудь вкусное";

  return (
    <main className="page">
      <div className="card">
        <CatFace mood="happy" size={140} />
        <h1>Супер ❤️</h1>
        <p className="subtitle">
          Тогда я заеду за тобой {when} и поедем кушать {dish}! 😻🎉
        </p>
      </div>
    </main>
  );
}
