import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { DatabaseConfig, LojikAccountingCredentials } from '../types/index.js';

// Use process.cwd() as package root (simpler for both runtime and tests)
const packageRoot = process.cwd();

let dbConnection: sqlite3.Database | null = null;
let isInitialized = false;

/**
 * SQL schema for the accounting database
 */
const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    through_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Resolve the database file path based on credentials and environment
 */
function resolveDatabasePath(credentials: LojikAccountingCredentials): string {
    // Check for environment override first
    const envOverride = process.env.DATABASE_FILE;
    if (envOverride) {
        return isAbsolute(envOverride) ? envOverride : resolve(process.cwd(), envOverride);
    }

    // Use credentials databaseFileName relative to package root
    return join(packageRoot, credentials.databaseFileName);
}

/**
 * Initialize SQLite3 database with proper settings
 */
function initializeDatabase(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Set required pragmas
            db.run('PRAGMA foreign_keys = ON;');
            db.run('PRAGMA journal_mode = WAL;');
            db.run('PRAGMA busy_timeout = 10000;');

            // Create schema
            db.exec(SCHEMA_SQL, (err) => {
                if (err) {
                    reject(new Error(`Failed to initialize database schema: ${err.message}`));
                } else {
                    resolve();
                }
            });
        });
    });
}

/**
 * Initialize the database connection
 */
export async function initializeDatabaseConnection(config: DatabaseConfig): Promise<void> {
    if (isInitialized && dbConnection) {
        return;
    }

    const dbPath = resolveDatabasePath(config.credentials);

    // Ensure the directory exists
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        dbConnection = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
            if (err) {
                reject(new Error(`Failed to open database: ${err.message}`));
                return;
            }

            try {
                await initializeDatabase(dbConnection!);
                isInitialized = true;
                resolve();
            } catch (initErr) {
                reject(initErr);
            }
        });
    });
}

/**
 * Get the database connection instance
 */
export function getDatabaseConnection(): sqlite3.Database {
    if (!dbConnection || !isInitialized) {
        throw new Error('Database connection not initialized. Call initializeDatabaseConnection first.');
    }
    return dbConnection;
}

/**
 * Close the database connection and reset state
 */
export function closeDatabaseConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!dbConnection) {
            // Reset state even if no connection
            dbConnection = null;
            isInitialized = false;
            resolve();
            return;
        }

        dbConnection.close((err) => {
            if (err) {
                reject(new Error(`Failed to close database: ${err.message}`));
            } else {
                dbConnection = null;
                isInitialized = false;
                resolve();
            }
        });
    });
}

/**
 * Run a query with parameters (prepared statement)
 */
export function runQuery(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    const db = getDatabaseConnection();
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(new Error(`Query failed: ${err.message}`));
            } else {
                resolve(this);
            }
        });
    });
}

/**
 * Get a single row from a query
 */
export function getQuery<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const db = getDatabaseConnection();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(new Error(`Query failed: ${err.message}`));
            } else {
                resolve(row as T | undefined);
            }
        });
    });
}

/**
 * Get all rows from a query
 */
export function getAllQuery<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = getDatabaseConnection();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(new Error(`Query failed: ${err.message}`));
            } else {
                resolve(rows as T[]);
            }
        });
    });
}

/**
 * Execute multiple statements in a transaction
 */
export function runTransaction(operations: (() => Promise<unknown>)[]): Promise<void> {
    const db = getDatabaseConnection();

    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await new Promise<void>((resolveBegin, rejectBegin) => {
                    db.run('BEGIN TRANSACTION', (err) => {
                        if (err) rejectBegin(err);
                        else resolveBegin();
                    });
                });

                // Execute all operations
                for (const operation of operations) {
                    await operation();
                }

                await new Promise<void>((resolveCommit, rejectCommit) => {
                    db.run('COMMIT', (err) => {
                        if (err) rejectCommit(err);
                        else resolveCommit();
                    });
                });

                resolve();
            } catch (error) {
                // Rollback on any error
                db.run('ROLLBACK', () => {
                    reject(error);
                });
            }
        });
    });
}
