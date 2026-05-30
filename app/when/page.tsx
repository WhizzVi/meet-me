import { CatFace } from "@/components/cats";
import WhenForm from "@/components/WhenForm";

export default function WhenPage() {
  return (
    <main className="page">
      <div className="card">
        <CatFace mood="sly" />
        <h1>Клааасс! ❤️</h1>
        <p className="subtitle">Когда у тебя есть свободное окошко?</p>
        <div style={{ marginTop: 20 }}>
          <WhenForm />
        </div>
      </div>
    </main>
  );
}
