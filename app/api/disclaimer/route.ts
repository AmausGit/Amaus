import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const db = getDb();
  const userAgent = req.headers.get("user-agent");
  const accepted_at = new Date().toISOString();

  db.prepare("INSERT INTO disclaimer_acceptances (accepted_at, user_agent) VALUES (?, ?)").run(
    accepted_at,
    userAgent
  );

  return NextResponse.json({ ok: true, accepted_at });
}
