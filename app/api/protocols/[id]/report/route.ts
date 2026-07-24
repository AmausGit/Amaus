import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ExperienceLog, Protocol } from "@/lib/types";
import { computeCompositeReport } from "@/lib/report";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/protocols/[id]/report">) {
  const { id } = await ctx.params;
  const db = getDb();

  const protocol = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol | undefined;
  if (!protocol) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }

  const logs = db
    .prepare("SELECT * FROM experience_log WHERE protocol_id = ? ORDER BY timestamp ASC")
    .all(id) as ExperienceLog[];

  const report = computeCompositeReport(protocol, logs);
  return NextResponse.json({ report });
}
