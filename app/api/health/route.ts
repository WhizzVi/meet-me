import { NextResponse } from "next/server";
import { storageHealth } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await storageHealth();

  const restKeys = Object.keys(process.env).filter(
    (key) => key.endsWith("KV_REST_API_URL") || key.endsWith("KV_REST_API_TOKEN"),
  );

  return NextResponse.json({
    backend: health.backend,
    redisCheck: health.redisCheck,
    detectedRestKeys: restKeys,
  });
}
