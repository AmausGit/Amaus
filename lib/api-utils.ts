import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseJsonBody(req: NextRequest): Promise<any | null> {
  try {
    const body = await req.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
    return body;
  } catch {
    return null;
  }
}
