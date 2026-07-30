# Airtable → Google Sheets export (ARD)

Pulls every record from all 13 tables of the "ARD - Autism Resource
Directory" Airtable base (`appn7qavULQGZ6JNY`) and writes them into a single
Google Sheet — one tab per table, columns matching Airtable's field names
and order exactly. Re-runnable: point it at the same spreadsheet to refresh
it, or leave that unset to create a new one each time.

## One-time setup

### 1. Airtable Personal Access Token

Create a token at <https://airtable.com/create/tokens> with:

- Scopes: `data.records:read`, `schema.bases:read`
- Access: the "ARD - Autism Resource Directory" base

### 2. Google service account

The script authenticates as a Google service account rather than doing an
interactive OAuth flow each run, since it's meant to be re-run unattended.

1. In a Google Cloud project, enable the **Google Sheets API** and
   **Google Drive API**.
2. Create a Service Account, then create and download a JSON key for it.
3. Note the service account's `client_email` — you'll need it below.

### 3. Environment variables

Put these in `.env.local` at the repo root (already gitignored):

```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
# AIRTABLE_BASE_ID=appn7qavULQGZ6JNY   # optional, this is the default

GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/path/to/service-account-key.json
# or inline instead of a file path:
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional — set on the very first run to auto-share the new sheet with
# your own Google account (service accounts have their own Drive space,
# so without this you won't see the file):
GOOGLE_SHARE_WITH_EMAIL=you@example.com

# Optional — set after the first run so subsequent runs update the same
# sheet instead of creating a new one each time (printed at the end of
# every run). If you'd rather point at a sheet you created yourself,
# share that sheet with the service account's client_email as an Editor
# first, then set this to its ID (the long string in the sheet's URL).
# GOOGLE_SHEETS_SPREADSHEET_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
```

## Running it

```bash
npm install
npm run export:ard
```

The script will:

1. Fetch the base's schema (table + field names, in Airtable's order).
2. Verify all 13 expected tables exist (fails fast with a clear error if a
   table was renamed).
3. Create the spreadsheet (or reuse `GOOGLE_SHEETS_SPREADSHEET_ID`), adding
   any missing tabs.
4. For each table: fully paginate every record, clear that tab, and write a
   header row + all data rows.

It prints the spreadsheet URL at the end, plus the `GOOGLE_SHEETS_SPREADSHEET_ID`
to reuse for future runs.

## Notes

- Single/multi-select fields are written as their plain option text, not
  internal IDs (this is how Airtable's records API already returns them).
- Attachments are written as `filename (url)`; collaborators as their name
  or email; anything else unexpected is JSON-stringified as a fallback.
- Re-running clears each tab before rewriting it, so it always reflects the
  current record count (no leftover stale rows if records were deleted).
- **"ARD Registered Families and Users"** contains sensitive family/child
  data — it's exported like every other table, but review who the target
  spreadsheet is shared with (`GOOGLE_SHARE_WITH_EMAIL` and any manual
  sharing) before treating it as anything other than tightly held.
