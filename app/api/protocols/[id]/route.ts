import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Protocol, PROTOCOL_TYPES, ProtocolType } from "@/lib/types";
import { parseJsonBody } from "@/lib/api-utils";

const VALID_TYPES: ProtocolType[] = PROTOCOL_TYPES.map((t) => t.value);

const EDITABLE_FIELDS = [
  "name",
  "protocol_type",
  "creator_name",
  "creator_credentials",
  "company",
  "product_name",
  "dosage_per_use",
  "course_duration",
  "begin_date",
  "end_date",
  "dosage_schedule_time",
  "salient_notes",
  "interaction_warnings",
  "expected_timeline",
  "public_reviews_summary",
  "public_benchmark_rating",
  "return_window",
] as const;

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/protocols/[id]">) {
  const { id } = await ctx.params;
  const db = getDb();
  const protocol = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol | undefined;
  if (!protocol) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }
  return NextResponse.json({ protocol });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/protocols/[id]">) {
  const { id } = await ctx.params;
  const db = getDb();
  const existing = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }

  const body = await parseJsonBody(req);
  if (!body) {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (body.protocol_type && !VALID_TYPES.includes(body.protocol_type)) {
    return NextResponse.json({ error: "Invalid protocol type." }, { status: 400 });
  }
  if (typeof body.name === "string" && body.name.trim() === "") {
    return NextResponse.json({ error: "Protocol name cannot be empty." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field];
  }
  updates.updated_at = new Date().toISOString();

  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(", ");

  db.prepare(`UPDATE protocols SET ${setClause} WHERE id = @id`).run({ ...updates, id });

  const protocol = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol;
  return NextResponse.json({ protocol });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/protocols/[id]">) {
  const { id } = await ctx.params;
  const db = getDb();
  const result = db.prepare("DELETE FROM protocols WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
