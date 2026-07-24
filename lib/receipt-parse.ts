export interface ParsedReceipt {
  date: string | null;
  amount: string | null;
  store: string | null;
}

const DATE_PATTERNS = [
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/,
];

const AMOUNT_LABEL_PATTERN = /(?:total|amount due|grand total|balance due)\D{0,10}\$?\s?(\d+[.,]\d{2})/i;
const GENERIC_AMOUNT_PATTERN = /\$\s?(\d+[.,]\d{2})/g;

export function parseReceiptText(rawText: string): ParsedReceipt {
  const text = rawText.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let date: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }

  let amount: string | null = null;
  const labeled = text.match(AMOUNT_LABEL_PATTERN);
  if (labeled) {
    amount = labeled[1];
  } else {
    const generic = Array.from(text.matchAll(GENERIC_AMOUNT_PATTERN)).map((m) => parseFloat(m[1].replace(",", ".")));
    if (generic.length > 0) {
      amount = Math.max(...generic).toFixed(2);
    }
  }

  // Best-effort guess: the store name is usually one of the first non-numeric lines.
  const store =
    lines.find((l) => l.length >= 3 && l.length <= 40 && !/\d{3,}/.test(l) && !/^\$/.test(l)) ?? null;

  return { date, amount, store };
}
