import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ExperienceLog, Protocol } from "@/lib/types";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/protocols/[id]/logs">) {
  const { id } = await ctx.params;
  const db = getDb();
  const logs = db
    .prepare("SELECT * FROM experience_log WHERE protocol_id = ? ORDER BY timestamp DESC")
    .all(id) as ExperienceLog[];
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/protocols/[id]/logs">) {
  const { id } = await ctx.params;
  const db = getDb();

  const protocol = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol | undefined;
  if (!protocol) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }

  const body = await req.json();
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Rating must be a number between 1 and 10." }, { status: 400 });
  }

  // Timestamp is always server-generated — never trust a client-supplied value here.
  const timestamp = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO experience_log (
      protocol_id, timestamp, dose_taken, ease_of_use, feeling, rating, would_recommend, notes
    ) VALUES (
      @protocol_id, @timestamp, @dose_taken, @ease_of_use, @feeling, @rating, @would_recommend, @notes
    )
  `);

  const result = stmt.run({
    protocol_id: Number(id),
    timestamp,
    dose_taken: body.dose_taken ? 1 : 0,
    ease_of_use: typeof body.ease_of_use === "number" ? body.ease_of_use : null,
    feeling: typeof body.feeling === "string" ? body.feeling : null,
    rating,
    would_recommend:
      body.would_recommend === true ? 1 : body.would_recommend === false ? 0 : null,
    notes: typeof body.notes === "string" ? body.notes : null,
  });

  const log = db.prepare("SELECT * FROM experience_log WHERE id = ?").get(result.lastInsertRowid) as ExperienceLog;

  return NextResponse.json({ log }, { status: 201 });
}
