import path from 'node:path';
import sqlite3 from 'sqlite3';
const { verbose } = sqlite3;
type Database = sqlite3.Database;
import { DateTime } from 'luxon';

// Single shared connection
let dbInstance: Database | null = null;

export interface DatabaseConfig {
    databaseFileName: string;
}

function resolveDatabasePath(config: DatabaseConfig): string {
    const override = process.env.DATABASE_FILE;
    if (override && override.trim().length > 0) {
        return override;
    }
    const toolRoot = path.resolve(__dirname, '../..');
    return path.join(toolRoot, config.databaseFileName);
}

function runPragma(db: Database, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

async function initializeSchema(db: Database): Promise<void> {
    const schemaSql = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Asset','Liability','Equity','Income','Expense')),
  parent_id INTEGER NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS period_locks (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  through_date TEXT NOT NULL
);
`;

    await new Promise<void>((resolve, reject) => {
        db.exec(schemaSql, (err: Error | null) => (err ? reject(err) : resolve()));
    });
}

export function getDb(config: DatabaseConfig): Promise<Database> {
    if (dbInstance) return Promise.resolve(dbInstance);

    verbose();
    const dbPath = resolveDatabasePath(config);
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, async (openErr: Error | null) => {
            if (openErr) return reject(openErr);
            try {
                await runPragma(db, 'PRAGMA foreign_keys = ON;');
                await runPragma(db, "PRAGMA journal_mode = WAL;");
                await runPragma(db, 'PRAGMA busy_timeout = 10000;');
                await initializeSchema(db);
                dbInstance = db;
                resolve(db);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export async function withTransaction<T>(db: Database, executor: () => Promise<T>): Promise<T> {
    await execAsync(db, 'BEGIN');
    try {
        const result = await executor();
        await execAsync(db, 'COMMIT');
        return result;
    } catch (err) {
        try {
            await execAsync(db, 'ROLLBACK');
        } catch {
            // ignore rollback errors
        }
        throw err;
    }
}

export function execAsync(db: Database, sql: string, params?: unknown[]): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params ?? [], function (err: Error | null) {
            if (err) reject(err);
            else resolve();
        });
    });
}

export function getAsync<T = unknown>(
    db: Database,
    sql: string,
    params?: unknown[],
): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        db.get(sql, params ?? [], (err: Error | null, row: unknown) => {
            if (err) reject(err);
            else resolve(row as T | undefined);
        });
    });
}

export function allAsync<T = unknown>(
    db: Database,
    sql: string,
    params?: unknown[],
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params ?? [], (err: Error | null, rows: unknown[]) => {
            if (err) reject(err);
            else resolve((rows as T[]) ?? []);
        });
    });
}

export function nowIsoUtc(): string {
    return DateTime.now().toUTC().toISO();
}


