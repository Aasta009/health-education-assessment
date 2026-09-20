import { cookies } from "next/headers";

export type StudentSession = { role: "student"; id: string; name: string; cls: string; groupNo: number | null; isLeader: boolean };
export type TeacherSession = { role: "teacher" };
export type Session = StudentSession | TeacherSession;

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
