import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { runMigrations } from "./schema";
import { logger } from "../logger";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(config.DB_PATH);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    runMigrations(db);
    logger.info("Database initialized", { path: dbPath });
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    logger.info("Database closed");
  }
}
