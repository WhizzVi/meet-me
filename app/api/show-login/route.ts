import { NextRequest, NextResponse } from "next/server";
import { grantShowAccess } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const expected = process.env.SHOW_PASSWORD ?? "";
  if (typeof body.password === "string" && expected && body.password === expected) {
    await grantShowAccess();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
