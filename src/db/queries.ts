import { getDb } from "./index";

export interface MemberRow {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  status: "pending" | "introduced" | "left";
  intro_text: string | null;
  intro_msg_id: number | null;
  joined_at: string;
  introduced_at: string | null;
  updated_at: string;
}

// ── Members ──────────────────────────────────────────

export function upsertMember(
  telegramId: number,
  username: string | null,
  firstName: string | null
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO members (telegram_id, username, first_name, status)
     VALUES (?, ?, ?, 'pending')
     ON CONFLICT(telegram_id) DO UPDATE SET
       username   = excluded.username,
       first_name = excluded.first_name,
       status     = 'pending',
       updated_at = datetime('now')`
  ).run(telegramId, username, firstName);
}

export function getMember(telegramId: number): MemberRow | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM members WHERE telegram_id = ?")
    .get(telegramId) as MemberRow | undefined;
}

export function markIntroduced(
  telegramId: number,
  introText: string,
  introMsgId: number
) {
  const db = getDb();
  db.prepare(
    `UPDATE members SET
       status        = 'introduced',
       intro_text    = ?,
       intro_msg_id  = ?,
       introduced_at = datetime('now'),
       updated_at    = datetime('now')
     WHERE telegram_id = ?`
  ).run(introText, introMsgId, telegramId);
}

export function markLeft(telegramId: number) {
  const db = getDb();
  db.prepare(
    `UPDATE members SET status = 'left', updated_at = datetime('now')
     WHERE telegram_id = ?`
  ).run(telegramId);
}

export function resetMember(telegramId: number) {
  const db = getDb();
  db.prepare(
    `UPDATE members SET
       status        = 'pending',
       intro_text    = NULL,
       intro_msg_id  = NULL,
       introduced_at = NULL,
       updated_at    = datetime('now')
     WHERE telegram_id = ?`
  ).run(telegramId);
}

export function getStats() {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'introduced' THEN 1 ELSE 0 END) as introduced,
         SUM(CASE WHEN status = 'left' THEN 1 ELSE 0 END) as left_count
       FROM members`
    )
    .get() as {
    total: number;
    pending: number;
    introduced: number;
    left_count: number;
  };
}

// ── Events ───────────────────────────────────────────

export function logEvent(
  telegramId: number,
  eventType: string,
  payload?: Record<string, unknown>
) {
  const db = getDb();
  db.prepare(
    "INSERT INTO events (telegram_id, event_type, payload) VALUES (?, ?, ?)"
  ).run(telegramId, eventType, payload ? JSON.stringify(payload) : null);
}
