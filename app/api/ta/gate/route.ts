import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { ensureReady, getUnlockedLevel, setUnlockedLevel } from "@/lib/db";
import { readSession } from "@/lib/session";
import { MAX_LEVEL } from "@/lib/fields";

export async function GET() {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "staff") {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  const a = await getUnlockedLevel("A");
  const b = await getUnlockedLevel("B");
  return NextResponse.json({ A: a, B: b });
}

export async function POST(req: NextRequest) {
  await ensureReady();
  const session = readSession();
  if (!session || session.role !== "staff" || session.kind !== "ta") {
    return NextResponse.json({ error: "只有助教可以調整關卡開放" }, { status: 403 });
  }
  const { cls, level } = await req.json();
  if (!["A", "B"].includes(cls) || !Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    return NextResponse.json({ error: "參數錯誤" }, { status: 400 });
  }
  await setUnlockedLevel(cls, level);
  return NextResponse.json({ ok: true });
}
