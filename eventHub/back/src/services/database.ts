/**
 * Base de donnees SQLite — EventHub
 *
 * Ce fichier gere la connexion et le schema de la base SQLite.
 * better-sqlite3 est synchrone — plus simple pour un serveur Express.
 */

import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'eventhub.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    date TEXT NOT NULL, time TEXT NOT NULL, location TEXT NOT NULL,
    city TEXT NOT NULL, price REAL NOT NULL, total_places INTEGER NOT NULL,
    available_places INTEGER NOT NULL, category TEXT NOT NULL, image TEXT,
    organizer_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, qr_code TEXT NOT NULL UNIQUE, event_id TEXT NOT NULL,
    user_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'valid',
    purchase_date TEXT NOT NULL, used_at TEXT, cancelled_at TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id), FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL
  );
`);

export default db;