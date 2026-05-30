import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

export type Attempt = {
  id: string;
  date: string;
  time: string;
  dish: string | null;
  createdAt: string;
  updatedAt: string;
};

const ATTEMPTS_KEY = "attempts";

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

function buildAttempt(input: { date: string; time: string }): Attempt {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    date: input.date,
    time: input.time,
    dish: null,
    createdAt: now,
    updatedAt: now,
  };
}

function withDish(attempt: Attempt, dish: string): Attempt {
  const updatedAt = new Date().toISOString();
  return {
    ...attempt,
    dish,
    updatedAt:
      updatedAt === attempt.createdAt
        ? new Date(new Date(updatedAt).getTime() + 1).toISOString()
        : updatedAt,
  };
}

function byCreatedAt(items: Attempt[]): Attempt[] {
  return items.slice().sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function parseAttempt(value: unknown): Attempt {
  return typeof value === "string" ? (JSON.parse(value) as Attempt) : (value as Attempt);
}

function dataFile(): string {
  return process.env.SUBMISSIONS_FILE ?? path.join(process.cwd(), "data", "submissions.json");
}

async function fileReadAll(): Promise<Attempt[]> {
  try {
    const raw = await fs.readFile(dataFile(), "utf8");
    return JSON.parse(raw) as Attempt[];
  } catch {
    return [];
  }
}

async function fileWriteAll(attempts: Attempt[]): Promise<void> {
  const file = dataFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(attempts, null, 2), "utf8");
}

async function redisGetAll(): Promise<Attempt[]> {
  const response = await getRedis().hgetall<Record<string, unknown>>(ATTEMPTS_KEY);
  if (!response) return [];
  return byCreatedAt(Object.values(response).map(parseAttempt));
}

async function redisGet(id: string): Promise<Attempt | null> {
  const response = await getRedis().hget<unknown>(ATTEMPTS_KEY, id);
  return response == null ? null : parseAttempt(response);
}

async function redisSave(attempt: Attempt): Promise<void> {
  await getRedis().hset(ATTEMPTS_KEY, { [attempt.id]: attempt });
}

export async function createAttempt(input: { date: string; time: string }): Promise<Attempt> {
  const attempt = buildAttempt(input);

  if (redisConfigured()) {
    await redisSave(attempt);
    return attempt;
  }

  const all = await fileReadAll();
  all.push(attempt);
  await fileWriteAll(all);
  return attempt;
}

export async function setDish(id: string, dish: string): Promise<Attempt | null> {
  if (redisConfigured()) {
    const existing = await redisGet(id);
    if (!existing) return null;
    const updated = withDish(existing, dish);
    await redisSave(updated);
    return updated;
  }

  const all = await fileReadAll();
  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = withDish(all[index], dish);
  all[index] = updated;
  await fileWriteAll(all);
  return updated;
}

export async function getAttempt(id: string): Promise<Attempt | null> {
  if (redisConfigured()) return redisGet(id);
  const all = await fileReadAll();
  return all.find((item) => item.id === id) ?? null;
}

export async function getAllAttempts(): Promise<Attempt[]> {
  if (redisConfigured()) return redisGetAll();
  return fileReadAll();
}
