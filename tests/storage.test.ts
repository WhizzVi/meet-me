import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { createAttempt, setDish, getAttempt, getAllAttempts } from "@/lib/storage";

const DATA_FILE = path.join(process.cwd(), "data", "submissions.test.json");

beforeEach(async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  await fs.rm(DATA_FILE, { force: true });
  process.env.SUBMISSIONS_FILE = DATA_FILE;
});

describe("storage", () => {
  it("creates an attempt with date/time and timestamps", async () => {
    const attempt = await createAttempt({ date: "2026-06-01", time: "19:30" });
    expect(attempt.id).toBeTruthy();
    expect(attempt.date).toBe("2026-06-01");
    expect(attempt.time).toBe("19:30");
    expect(attempt.dish).toBeNull();
    expect(attempt.createdAt).toBeTruthy();
    expect(attempt.updatedAt).toBe(attempt.createdAt);
  });

  it("sets dish on an existing attempt and bumps updatedAt", async () => {
    const created = await createAttempt({ date: "2026-06-01", time: "19:30" });
    const updated = await setDish(created.id, "sushi");
    expect(updated?.dish).toBe("sushi");
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("keeps each pass as a separate attempt", async () => {
    await createAttempt({ date: "2026-06-01", time: "19:30" });
    await createAttempt({ date: "2026-06-02", time: "20:00" });
    const all = await getAllAttempts();
    expect(all).toHaveLength(2);
  });

  it("returns null for unknown id", async () => {
    expect(await getAttempt("nope")).toBeNull();
  });
});
