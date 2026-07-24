import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Protocol } from "@/lib/types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/protocols/[id]/receipt-upload">) {
  const { id } = await ctx.params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Protocol not found." }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("receipt");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A receipt image file is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Receipt image is too large (10MB max)." }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const filename = `protocol-${id}-receipt-${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const receipt_image_path = `/uploads/${filename}`;
  const receipt_ocr_text = typeof form.get("ocr_text") === "string" ? String(form.get("ocr_text")) : null;
  const receipt_date = typeof form.get("receipt_date") === "string" ? String(form.get("receipt_date")) : null;
  const receipt_amount = typeof form.get("receipt_amount") === "string" ? String(form.get("receipt_amount")) : null;
  const receipt_store = typeof form.get("receipt_store") === "string" ? String(form.get("receipt_store")) : null;

  db.prepare(`
    UPDATE protocols SET
      receipt_image_path = @receipt_image_path,
      receipt_ocr_text = @receipt_ocr_text,
      receipt_date = @receipt_date,
      receipt_amount = @receipt_amount,
      receipt_store = @receipt_store,
      updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    receipt_image_path,
    receipt_ocr_text,
    receipt_date,
    receipt_amount,
    receipt_store,
    updated_at: new Date().toISOString(),
  });

  const protocol = db.prepare("SELECT * FROM protocols WHERE id = ?").get(id) as Protocol;
  return NextResponse.json({ protocol });
}
