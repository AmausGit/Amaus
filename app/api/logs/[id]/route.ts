import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/logs/[id]">) {
  const { id } = await ctx.params;
  const db = getDb();
  const result = db.prepare("DELETE FROM experience_log WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
