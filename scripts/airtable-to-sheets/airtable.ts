const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

// Airtable's public API rate limit is 5 requests/sec per base.
const PAGE_DELAY_MS = 220;

export interface AirtableField {
  id: string;
  name: string;
  type: string;
}

export interface AirtableTableSchema {
  id: string;
  name: string;
  fields: AirtableField[];
}

export type AirtableRecordFields = Record<string, unknown>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function airtableFetch<T>(
  path: string,
  apiKey: string,
  searchParams?: URLSearchParams,
): Promise<T> {
  const query = searchParams ? `?${searchParams.toString()}` : "";
  const url = `${AIRTABLE_API_BASE}${path}${query}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 429) {
      // Back off and retry on rate limiting.
      await sleep(attempt * 1000);
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable API error ${res.status} for ${path}: ${body}`);
    }

    return res.json();
  }

  throw new Error(`Airtable API error: exhausted retries for ${path}`);
}

export async function getBaseSchema(
  baseId: string,
  apiKey: string,
): Promise<AirtableTableSchema[]> {
  const data = await airtableFetch<{ tables: AirtableTableSchema[] }>(
    `/meta/bases/${baseId}/tables`,
    apiKey,
  );
  return data.tables;
}

/** Fully paginates a table, returning every record's `fields` object. */
export async function listAllRecords(
  baseId: string,
  tableId: string,
  apiKey: string,
): Promise<AirtableRecordFields[]> {
  const records: AirtableRecordFields[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const data = await airtableFetch<{
      records: { fields: AirtableRecordFields }[];
      offset?: string;
    }>(`/${baseId}/${tableId}`, apiKey, params);
    for (const record of data.records) {
      records.push(record.fields);
    }

    offset = data.offset;
    if (offset) await sleep(PAGE_DELAY_MS);
  } while (offset);

  return records;
}
