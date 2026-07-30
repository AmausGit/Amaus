import fs from "node:fs";
import { google, sheets_v4, drive_v3 } from "googleapis";
import type { SheetCellValue } from "./format";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

// Writing more than this many rows in one values.update call risks hitting
// Sheets API request size limits, so large tables are chunked.
const WRITE_CHUNK_SIZE = 5000;

export interface GoogleClients {
  sheets: sheets_v4.Sheets;
  drive: drive_v3.Drive;
}

export async function getGoogleClients(): Promise<GoogleClients> {
  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

  let credentials: Record<string, unknown>;
  if (inlineKey) {
    credentials = JSON.parse(inlineKey);
  } else if (keyFile) {
    credentials = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  } else {
    throw new Error(
      "Set GOOGLE_SERVICE_ACCOUNT_KEY (inline JSON) or GOOGLE_SERVICE_ACCOUNT_KEY_FILE (path to the key file).",
    );
  }

  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    drive: google.drive({ version: "v3", auth }),
  };
}

export interface EnsureSpreadsheetResult {
  spreadsheetId: string;
  created: boolean;
}

/**
 * Reuses an existing spreadsheet (adding any missing tabs) when
 * `spreadsheetId` is given, otherwise creates a fresh one with all tabs
 * pre-created.
 */
export async function ensureSpreadsheet(
  sheets: sheets_v4.Sheets,
  opts: { spreadsheetId?: string; title: string; tabNames: readonly string[] },
): Promise<EnsureSpreadsheetResult> {
  if (opts.spreadsheetId) {
    const existing = await sheets.spreadsheets.get({ spreadsheetId: opts.spreadsheetId });
    const existingTitles = new Set(
      (existing.data.sheets ?? []).map((s) => s.properties?.title),
    );
    const missing = opts.tabNames.filter((name) => !existingTitles.has(name));

    if (missing.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: opts.spreadsheetId,
        requestBody: {
          requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
        },
      });
    }

    return { spreadsheetId: opts.spreadsheetId, created: false };
  }

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: opts.title },
      sheets: opts.tabNames.map((title) => ({ properties: { title } })),
    },
  });

  return { spreadsheetId: created.data.spreadsheetId!, created: true };
}

export async function clearSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string,
): Promise<void> {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${tabName}'`,
  });
}

/** Writes a full table (header row + data rows) into a tab, chunked for size. */
export async function writeSheetValues(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string,
  rows: SheetCellValue[][],
): Promise<void> {
  for (let start = 0; start < rows.length; start += WRITE_CHUNK_SIZE) {
    const chunk = rows.slice(start, start + WRITE_CHUNK_SIZE);
    const startRow = start + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A${startRow}`,
      valueInputOption: "RAW",
      requestBody: { values: chunk },
    });
  }
}

export async function shareSpreadsheet(
  drive: drive_v3.Drive,
  fileId: string,
  emailAddress: string,
): Promise<void> {
  await drive.permissions.create({
    fileId,
    sendNotificationEmail: false,
    requestBody: { type: "user", role: "writer", emailAddress },
  });
}
