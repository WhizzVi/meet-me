import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Attempt = {
  id: string;
  date: string;
  time: string;
  dish: string | null;
  createdAt: string;
  updatedAt: string;
};

function dataFile(): string {
  return process.env.SUBMISSIONS_FILE ?? path.join(process.cwd(), "data", "submissions.json");
}

async function readAll(): Promise<Attempt[]> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    return JSON.parse(raw) as Attempt[];
  } catch {
    return [];
  }
}

async function writeAll(attempts: Attempt[]): Promise<void> {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(attempts, null, 2), "utf8");
}

export async function createAttempt(input: { date: string; time: string }): Promise<Attempt> {
  const now = new Date().toISOString();
  const attempt: Attempt = {
    id: randomUUID(),
    date: input.date,
    time: input.time,
    dish: null,
    createdAt: now,
    updatedAt: now,
  };
  const all = await readAll();
  all.push(attempt);
  await writeAll(all);
  return attempt;
}

export async function setDish(id: string, dish: string): Promise<Attempt | null> {
  const all = await readAll();
  const attempt = all.find((item) => item.id === id);
  if (!attempt) return null;
  attempt.dish = dish;
  const newUpdatedAt = new Date().toISOString();
  attempt.updatedAt = newUpdatedAt === attempt.createdAt
    ? new Date(new Date(newUpdatedAt).getTime() + 1).toISOString()
    : newUpdatedAt;
  await writeAll(all);
  return attempt;
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  const all = await readAll();
  return all.find((item) => item.id === id) ?? null;
}

export async function getAllAttempts(): Promise<Attempt[]> {
  return readAll();
}
