import "dotenv/config";
import { getBaseSchema, listAllRecords } from "./airtable";
import { formatCellValue, SheetCellValue } from "./format";
import {
  getGoogleClients,
  ensureSpreadsheet,
  clearSheet,
  writeSheetValues,
  shareSpreadsheet,
} from "./sheets";
import { DEFAULT_BASE_ID, TABLE_NAMES } from "./config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const airtableApiKey = requireEnv("AIRTABLE_API_KEY");
  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID;
  const spreadsheetTitle =
    process.env.GOOGLE_SHEET_TITLE || "ARD - Autism Resource Directory Export";
  const existingSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const shareWithEmail = process.env.GOOGLE_SHARE_WITH_EMAIL;

  console.log(`Fetching schema for base ${baseId}...`);
  const schema = await getBaseSchema(baseId, airtableApiKey);
  const schemaByName = new Map(schema.map((table) => [table.name, table]));

  const missingTables = TABLE_NAMES.filter((name) => !schemaByName.has(name));
  if (missingTables.length > 0) {
    throw new Error(
      `These tables were not found in the base (check exact spelling in Airtable): ${missingTables.join(", ")}`,
    );
  }

  const { sheets, drive } = await getGoogleClients();

  const { spreadsheetId, created } = await ensureSpreadsheet(sheets, {
    spreadsheetId: existingSpreadsheetId,
    title: spreadsheetTitle,
    tabNames: TABLE_NAMES,
  });

  console.log(
    created ? `Created new spreadsheet ${spreadsheetId}` : `Reusing spreadsheet ${spreadsheetId}`,
  );

  if (created && shareWithEmail) {
    await shareSpreadsheet(drive, spreadsheetId, shareWithEmail);
    console.log(`Shared spreadsheet with ${shareWithEmail}`);
  }

  let totalRecords = 0;

  for (const tableName of TABLE_NAMES) {
    const table = schemaByName.get(tableName)!;
    console.log(`\n${tableName}: fetching records...`);

    const records = await listAllRecords(baseId, table.id, airtableApiKey);
    totalRecords += records.length;
    console.log(`${tableName}: ${records.length} records fetched, writing to sheet...`);

    // Column order matches the field order in Airtable's table schema.
    const headers = table.fields.map((field) => field.name);
    const rows: SheetCellValue[][] = [headers];
    for (const fields of records) {
      rows.push(headers.map((header) => formatCellValue(fields[header])));
    }

    await clearSheet(sheets, spreadsheetId, tableName);
    await writeSheetValues(sheets, spreadsheetId, tableName, rows);
    console.log(`${tableName}: done.`);
  }

  console.log(`\nExport complete — ${totalRecords} total records.`);
  console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
  if (!existingSpreadsheetId) {
    console.log(
      `\nTo update this same sheet next time instead of creating a new one, set:\nGOOGLE_SHEETS_SPREADSHEET_ID=${spreadsheetId}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
