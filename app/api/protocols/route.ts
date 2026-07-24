import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Protocol, ProtocolType } from "@/lib/types";

const VALID_TYPES: ProtocolType[] = [
  "colon_cleanse",
  "liver_cleanse",
  "kidney_therapy",
  "cancer_protocol",
  "diet",
  "other",
];

export async function GET() {
  const db = getDb();
  const protocols = db
    .prepare(
      `SELECT p.*,
        (SELECT MAX(timestamp) FROM experience_log WHERE protocol_id = p.id) AS last_log_timestamp
       FROM protocols p
       ORDER BY p.created_at DESC`
    )
    .all() as (Protocol & { last_log_timestamp: string | null })[];
  return NextResponse.json({ protocols });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Protocol name is required." }, { status: 400 });
  }

  const protocol_type: ProtocolType = VALID_TYPES.includes(body.protocol_type)
    ? body.protocol_type
    : "other";

  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO protocols (
      name, protocol_type, creator_name, creator_credentials, company, product_name,
      dosage_per_use, course_duration, begin_date, end_date, dosage_schedule_time,
      salient_notes, interaction_warnings, expected_timeline, public_reviews_summary,
      public_benchmark_rating, return_window, created_at, updated_at
    ) VALUES (
      @name, @protocol_type, @creator_name, @creator_credentials, @company, @product_name,
      @dosage_per_use, @course_duration, @begin_date, @end_date, @dosage_schedule_time,
      @salient_notes, @interaction_warnings, @expected_timeline, @public_reviews_summary,
      @public_benchmark_rating, @return_window, @created_at, @updated_at
    )
  `);

  const result = stmt.run({
    name,
    protocol_type,
    creator_name: body.creator_name ?? null,
    creator_credentials: body.creator_credentials ?? null,
    company: body.company ?? null,
    product_name: body.product_name ?? null,
    dosage_per_use: body.dosage_per_use ?? null,
    course_duration: body.course_duration ?? null,
    begin_date: body.begin_date ?? null,
    end_date: body.end_date ?? null,
    dosage_schedule_time: body.dosage_schedule_time ?? null,
    salient_notes: body.salient_notes ?? null,
    interaction_warnings: body.interaction_warnings ?? null,
    expected_timeline: body.expected_timeline ?? null,
    public_reviews_summary: body.public_reviews_summary ?? null,
    public_benchmark_rating:
      typeof body.public_benchmark_rating === "number" ? body.public_benchmark_rating : null,
    return_window: body.return_window ?? null,
    created_at: now,
    updated_at: now,
  });

  const protocol = db
    .prepare("SELECT * FROM protocols WHERE id = ?")
    .get(result.lastInsertRowid) as Protocol;

  return NextResponse.json({ protocol }, { status: 201 });
}
