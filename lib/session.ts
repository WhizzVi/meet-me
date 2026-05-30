import { cookies } from "next/headers";

const SID = "sid";
const SHOW_AUTH = "show_auth";

export async function setSid(id: string): Promise<void> {
  const store = await cookies();
  store.set(SID, id, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function getSid(): Promise<string | null> {
  const store = await cookies();
  return store.get(SID)?.value ?? null;
}

export async function grantShowAccess(): Promise<void> {
  const store = await cookies();
  store.set(SHOW_AUTH, "1", { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function hasShowAccess(): Promise<boolean> {
  const store = await cookies();
  return store.get(SHOW_AUTH)?.value === "1";
}
