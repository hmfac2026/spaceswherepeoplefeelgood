import { randomUUID } from "crypto";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const ANON_COOKIE_NAME = "swpfg_anon_id";

export function readAnonId(
  cookieStore: ReadonlyRequestCookies | ResponseCookies,
): string | null {
  return cookieStore.get(ANON_COOKIE_NAME)?.value ?? null;
}

export function ensureAnonId(cookieStore: ResponseCookies): string {
  const existing = cookieStore.get(ANON_COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = randomUUID();
  cookieStore.set({
    name: ANON_COOKIE_NAME,
    value: id,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return id;
}
