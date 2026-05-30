import { cookies } from "next/headers";

const SID = "sid";
const SHOW_AUTH = "show_auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

export async function setSid(id: string): Promise<void> {
  const store = await cookies();
  store.set(SID, id, COOKIE_OPTIONS);
}

export async function getSid(): Promise<string | null> {
  const store = await cookies();
  return store.get(SID)?.value ?? null;
}

export async function grantShowAccess(): Promise<void> {
  const store = await cookies();
  store.set(SHOW_AUTH, "1", COOKIE_OPTIONS);
}

export async function hasShowAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(SHOW_AUTH)?.value === "1";
}
