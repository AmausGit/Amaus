# Protocol Tracker

A personal health protocol tracker: record the details of a protocol you've
started once, log quick daily check-ins against it, and get an
Amazon-style composite report on your own results. It also acts as a
proactive adherence coach — nudging you ahead of a scheduled dose and
flagging missed check-ins.

This is not medical advice. See `lib/disclaimer.ts` and the in-app
Settings page for the full disclaimer, which is required reading (and
acceptance) on first launch.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via `better-sqlite3` (file at `data/app.db`, created on first run)
- `tesseract.js` for in-browser receipt OCR (no server-side image processing)

## Data model

Two tables, matching the spec's separation of "set once" vs. "log daily":

- **protocols** — one row per protocol (name, type, creator, dosage,
  schedule, warnings, expected timeline, public reviews/benchmark rating,
  receipt fields).
- **experience_log** — one row per check-in, foreign-keyed to a protocol
  (dose taken, ease of use, feeling, 1–10 rating, would-recommend, notes).
  `timestamp` is always set server-side — there's no client-editable
  timestamp field anywhere in the UI or API.

The **composite report** (`lib/report.ts`) is computed on read, not
stored: total days logged, average rating, good/bad/ugly distribution,
week-over-week trend, recommend %, dose adherence %, adherence-timing vs.
outcome correlation, lightweight NLP tag extraction from free-text notes
(`lib/nlp.ts`), personal-vs-public-benchmark divergence, and "unusual for
you" gap detection based on the user's own historical logging rhythm.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database
and any uploaded receipt images are created under `data/` and
`public/uploads/` on first use (both gitignored).

## Notable implementation notes / limitations

- **Reminders** (`hooks/useDoseReminders.ts`) use the browser Notification
  API and a client-side interval, driven by each protocol's "Dosage
  Schedule Time." They only fire while a tab is open — there's no
  background/OS-level scheduling, since that requires a native app shell
  (e.g. Expo/React Native) rather than a browser tab. This is called out
  in the Settings page.
- **Receipt OCR** runs entirely in the browser via `tesseract.js`, which
  fetches its language model over the network on first use. If that fetch
  fails (e.g. no connectivity), the UI degrades to manual entry rather
  than blocking the save.
- **Public review summarization** is a manual-entry field
  (`public_reviews_summary`) plus an optional numeric benchmark rating
  used for the divergence flag — this app doesn't run its own web
  search/summarization pipeline server-side. Wiring that up (fetch +
  summarize public reviews for a product) would be a natural next step if
  paired with a server-side search API.
- **Single user, no auth** — this is scoped as a personal tracker, not a
  multi-tenant product.

## Hospital bill help (`/bill-help`)

A client-only tool for people worried about hospital bills. Nothing typed
there is stored or sent to the server.

- **Poverty-level calculator** (`lib/fpl.ts`): household size, income and
  state give income as a percent of the 2026 HHS poverty guideline, plus
  the dollar limits at the cutoffs hospital financial assistance policies
  commonly use (100% to 600%). Figures come from the Federal Register
  notice of January 15, 2026; update `TABLES` and `FPL_YEAR` each January.
- **Copy-paste prompt** (`lib/bill-help.ts`): builds a prompt the person
  pastes into Claude or another assistant. It asks the assistant to find
  nonprofit hospitals nearby, read each one's financial assistance policy
  (required under IRS section 501(r)), say which ones the person likely
  qualifies for, draft a request for an itemized bill and an application,
  and check an EOB against the bill.
- **Hospital kit** (`/bill-help/hospitals`): a hospital enters its own
  program details and gets a prompt to publish on its billing page and
  statements, plus a JSON version to post at a stable URL.

## Share with your doctor

Each protocol page has a "Share With Your Doctor" section
(`lib/clinician-brief.ts`, `components/ClinicianBrief.tsx`):

- **Brief for my clinician**: a plain-text summary of the protocol and the
  user's own check-ins (dose, schedule, adherence, average rating by week,
  symptom mentions, the 8 most recent notes) plus three standard questions.
  It reports only logged data and adds no interpretation.
- **Visit prep prompt for AI**: the same brief wrapped in a prompt asking
  an AI assistant to point out patterns, flag anything urgent, and suggest
  questions. The prompt tells the assistant not to recommend dose changes.

Protocol types now include over-the-counter and prescription medications.
Both protocol API routes read the allowed types from `PROTOCOL_TYPES` in
`lib/types.ts` instead of keeping their own copies.
