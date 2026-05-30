import { describe, it, expect, beforeEach, vi } from "vitest";

const store = new Map<string, Record<string, unknown>>();

vi.mock("@upstash/redis", () => ({
  Redis: class {
    static fromEnv() {
      return new this();
    }
    async hset(key: string, obj: Record<string, unknown>) {
      const current = store.get(key) ?? {};
      Object.assign(current, obj);
      store.set(key, current);
      return Object.keys(obj).length;
    }
    async hget(key: string, field: string) {
      return store.get(key)?.[field] ?? null;
    }
    async hgetall(key: string) {
      const current = store.get(key);
      return current && Object.keys(current).length ? current : null;
    }
  },
}));

import { createAttempt, setDish, getAttempt, getAllAttempts } from "@/lib/storage";

beforeEach(() => {
  store.clear();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  delete process.env.SUBMISSIONS_FILE;
});

describe("storage (redis backend)", () => {
  it("creates and reads back an attempt", async () => {
    const created = await createAttempt({ date: "2026-06-01", time: "19:30" });
    const fetched = await getAttempt(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.dish).toBeNull();
  });

  it("sets dish and bumps updatedAt", async () => {
    const created = await createAttempt({ date: "2026-06-01", time: "19:30" });
    const updated = await setDish(created.id, "ramen");
    expect(updated?.dish).toBe("ramen");
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
    expect((await getAttempt(created.id))?.dish).toBe("ramen");
  });

  it("returns all attempts sorted oldest-first", async () => {
    const first = await createAttempt({ date: "2026-06-01", time: "19:30" });
    const second = await createAttempt({ date: "2026-06-02", time: "20:00" });
    const all = await getAllAttempts();
    expect(all.map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it("returns null for unknown id", async () => {
    expect(await getAttempt("nope")).toBeNull();
  });
});
