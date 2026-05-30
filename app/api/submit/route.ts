import { NextRequest, NextResponse } from "next/server";
import { createAttempt, setDish } from "@/lib/storage";
import { setSid, getSid } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    if (typeof body.date === "string" && typeof body.time === "string") {
      const attempt = await createAttempt({ date: body.date, time: body.time });
      await setSid(attempt.id);
      return NextResponse.json({ ok: true, id: attempt.id });
    }

    if (typeof body.dish === "string") {
      const sid = await getSid();
      if (!sid) return NextResponse.json({ ok: false, error: "no_sid" }, { status: 400 });
      const updated = await setDish(sid, body.dish);
      if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  } catch (error) {
    console.error("submit failed:", error);
    return NextResponse.json({ ok: false, error: "storage_failed" }, { status: 500 });
  }
}
