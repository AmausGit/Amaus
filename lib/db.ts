import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "app.db");

declare global {
   
  var __amausDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      protocol_type TEXT NOT NULL DEFAULT 'other',
      creator_name TEXT,
      creator_credentials TEXT,
      company TEXT,
      product_name TEXT,
      dosage_per_use TEXT,
      course_duration TEXT,
      begin_date TEXT,
      end_date TEXT,
      dosage_schedule_time TEXT,
      salient_notes TEXT,
      interaction_warnings TEXT,
      expected_timeline TEXT,
      public_reviews_summary TEXT,
      public_benchmark_rating REAL,
      receipt_image_path TEXT,
      receipt_ocr_text TEXT,
      receipt_date TEXT,
      receipt_amount TEXT,
      receipt_store TEXT,
      return_window TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS experience_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id INTEGER NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      dose_taken INTEGER NOT NULL DEFAULT 0,
      ease_of_use INTEGER,
      feeling TEXT,
      rating INTEGER NOT NULL,
      would_recommend INTEGER,
      notes TEXT,
      local_time_of_day TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_experience_log_protocol_id ON experience_log(protocol_id);
    CREATE INDEX IF NOT EXISTS idx_experience_log_timestamp ON experience_log(timestamp);

    CREATE TABLE IF NOT EXISTS disclaimer_acceptances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accepted_at TEXT NOT NULL,
      user_agent TEXT
    );
  `);

  // Migration for databases created before local_time_of_day existed: the timestamp
  // column alone can't answer "was this on-schedule?" without assuming the server's
  // timezone matches the user's, which is false whenever the app isn't deployed in UTC-0.
  const columns = db.prepare("PRAGMA table_info(experience_log)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "local_time_of_day")) {
    db.exec("ALTER TABLE experience_log ADD COLUMN local_time_of_day TEXT");
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__amausDb) {
    global.__amausDb = createDb();
  }
  return global.__amausDb;
}
