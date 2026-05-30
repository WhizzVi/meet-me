import { NextResponse } from "next/server";
import { getAttempt } from "@/lib/storage";
import { getSid } from "@/lib/session";

export async function GET() {
  const sid = await getSid();
  if (!sid) return NextResponse.json({ ok: false }, { status: 400 });
  const attempt = await getAttempt(sid);
  if (!attempt) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, attempt });
}
