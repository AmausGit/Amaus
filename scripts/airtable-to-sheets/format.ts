export type SheetCellValue = string | number | boolean;

/**
 * Converts an Airtable field value into a plain Sheets-friendly cell value.
 * Single/multi-select values already come back from the Airtable records API
 * as plain option-name strings (not IDs), so they pass through untouched —
 * this mainly normalizes attachments, collaborators, and linked records.
 */
export function formatCellValue(value: unknown): SheetCellValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatArrayItem(item)).join(", ");
  }
  if (typeof value === "object") {
    return formatObjectItem(value as Record<string, unknown>);
  }
  return String(value);
}

function formatArrayItem(item: unknown): string {
  if (item === null || item === undefined) return "";
  if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
    return String(item);
  }
  if (typeof item === "object") return formatObjectItem(item as Record<string, unknown>);
  return String(item);
}

function formatObjectItem(obj: Record<string, unknown>): string {
  // Attachments: { filename, url, ... }
  if (typeof obj.filename === "string" && typeof obj.url === "string") {
    return `${obj.filename} (${obj.url})`;
  }
  // Collaborators: { name, email }
  if (typeof obj.name === "string") return obj.name;
  if (typeof obj.email === "string") return obj.email;
  return JSON.stringify(obj);
}
