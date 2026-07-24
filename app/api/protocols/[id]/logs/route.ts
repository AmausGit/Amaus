import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ExperienceLog, Protocol } from "@/lib/types";
import { parseJsonBody } from "@/lib/api-utils";

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

  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Rating must be a number between 1 and 10." }, { status: 400 });
  }

  // Timestamp is always server-generated — never trust a client-supplied value here.
  const timestamp = new Date().toISOString();

  // The user's own local wall-clock time at the moment of logging, supplied by the
  // client. Used for adherence-timing comparisons instead of re-deriving a time-of-day
  // from the UTC timestamp server-side, which would silently use the server's timezone
  // rather than the user's. Validated as plain HH:MM; anything else is dropped.
  const local_time_of_day =
    typeof body.local_time_of_day === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.local_time_of_day)
      ? body.local_time_of_day
      : null;

  const stmt = db.prepare(`
    INSERT INTO experience_log (
      protocol_id, timestamp, dose_taken, ease_of_use, feeling, rating, would_recommend, notes, local_time_of_day
    ) VALUES (
      @protocol_id, @timestamp, @dose_taken, @ease_of_use, @feeling, @rating, @would_recommend, @notes, @local_time_of_day
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
    local_time_of_day,
  });

  const log = db.prepare("SELECT * FROM experience_log WHERE id = ?").get(result.lastInsertRowid) as ExperienceLog;

  return NextResponse.json({ log }, { status: 201 });
}
