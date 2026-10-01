import { cookies } from "next/headers";

export type StudentSession = { role: "student"; id: string; name: string; cls: string; groupNo: number | null; isLeader: boolean };
// "staff" covers both the TA and the teacher. TA additionally controls stage
// gating and can view every group; both can view everything read-only but
// neither can ever edit a student's own words.
export type StaffSession = { role: "staff"; kind: "teacher" | "ta" };
export type Session = StudentSession | StaffSession;

const COOKIE = "hea_session";

export function encodeSession(s: Session): string {
  return Buffer.from(JSON.stringify(s), "utf-8").toString("base64url");
}

export function decodeSession(v: string | undefined): Session | null {
  if (!v) return null;
  try {
    return JSON.parse(Buffer.from(v, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export function readSession(): Session | null {
  const c = cookies().get(COOKIE)?.value;
  return decodeSession(c);
}

export function sessionCookieName() {
  return COOKIE;
}

// Shared cookie options so every login path (student / teacher / TA) is
// guaranteed identical, robust settings — a year-long session that survives
// closing the browser entirely, and `secure` since the site is HTTPS-only.
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // ~1 year
};
