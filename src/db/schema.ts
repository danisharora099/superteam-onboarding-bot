import type Database from "better-sqlite3";

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      telegram_id   INTEGER PRIMARY KEY,
      username      TEXT,
      first_name    TEXT,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','introduced','left')),
      intro_text    TEXT,
      intro_msg_id  INTEGER,
      joined_at     TEXT NOT NULL DEFAULT (datetime('now')),
      introduced_at TEXT,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER NOT NULL,
      event_type  TEXT NOT NULL,
      payload     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
    CREATE INDEX IF NOT EXISTS idx_events_telegram_id ON events(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  `);
}
