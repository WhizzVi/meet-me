import ShowLogin from "@/components/ShowLogin";
import { hasShowAccess } from "@/lib/session";
import { getAllAttempts } from "@/lib/storage";
import { dishLabel } from "@/lib/dishes";

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ShowPage() {
  const authed = await hasShowAccess();

  if (!authed) {
    return (
      <main className="page">
        <div className="card">
          <h1>🔒 Секретная страница</h1>
          <p className="subtitle">Введите пароль</p>
          <ShowLogin />
        </div>
      </main>
    );
  }

  const attempts = (await getAllAttempts()).slice().reverse();

  return (
    <main className="page">
      <div className="card" style={{ maxWidth: 760 }}>
        <h1>Результаты 💌</h1>
        <p className="subtitle">Все попытки ({attempts.length})</p>
        {attempts.length === 0 ? (
          <p>Пока пусто 🐾</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Дата свидания</th>
                <th>Время</th>
                <th>Блюдо</th>
                <th>Заполнено</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt, index) => (
                <tr key={attempt.id}>
                  <td>{attempts.length - index}</td>
                  <td>{attempt.date}</td>
                  <td>{attempt.time}</td>
                  <td>{attempt.dish ? dishLabel(attempt.dish) : "—"}</td>
                  <td>{formatStamp(attempt.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
