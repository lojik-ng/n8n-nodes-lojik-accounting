import Database from 'better-sqlite3';
import { dirname, join, resolve, isAbsolute } from 'path';
import { existsSync, mkdirSync } from 'fs';
// Use process.cwd() as package root (simpler for both runtime and tests)
const packageRoot = process.cwd();
let dbConnection = null;
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
function resolveDatabasePath(credentials) {
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
function initializeDatabase(db) {
    // Set required pragmas
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 10000');
    // Create schema
    db.exec(SCHEMA_SQL);
}
/**
 * Initialize the database connection
 */
export function initializeDatabaseConnection(config) {
    return new Promise((resolve, reject) => {
        try {
            if (isInitialized && dbConnection) {
                resolve();
                return;
            }
            const dbPath = resolveDatabasePath(config.credentials);
            // Ensure the directory exists
            const dbDir = dirname(dbPath);
            if (!existsSync(dbDir)) {
                mkdirSync(dbDir, { recursive: true });
            }
            // Create database connection
            dbConnection = new Database(dbPath);
            // Initialize database
            initializeDatabase(dbConnection);
            isInitialized = true;
            resolve();
        }
        catch (error) {
            reject(new Error(`Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}
/**
 * Get the database connection instance
 */
export function getDatabaseConnection() {
    if (!dbConnection || !isInitialized) {
        throw new Error('Database connection not initialized. Call initializeDatabaseConnection first.');
    }
    return dbConnection;
}
/**
 * Close the database connection and reset state
 */
export function closeDatabaseConnection() {
    return new Promise((resolve) => {
        try {
            if (dbConnection) {
                dbConnection.close();
            }
        }
        catch (error) {
            // Ignore close errors
        }
        dbConnection = null;
        isInitialized = false;
        resolve();
    });
}
/**
 * Run a query with parameters (prepared statement)
 */
export function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = getDatabaseConnection();
            const stmt = db.prepare(sql);
            const result = stmt.run(...params);
            resolve(result);
        }
        catch (error) {
            reject(new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}
/**
 * Get a single row from a query
 */
export function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = getDatabaseConnection();
            const stmt = db.prepare(sql);
            const result = stmt.get(...params);
            resolve(result);
        }
        catch (error) {
            reject(new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}
/**
 * Get all rows from a query
 */
export function getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = getDatabaseConnection();
            const stmt = db.prepare(sql);
            const result = stmt.all(...params);
            resolve(result);
        }
        catch (error) {
            reject(new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
}
/**
 * Execute multiple statements in a transaction
 */
export function runTransaction(operations) {
    return new Promise(async (resolve, reject) => {
        const db = getDatabaseConnection();
        const transaction = db.transaction(async () => {
            // Execute all operations
            for (const operation of operations) {
                await operation();
            }
        });
        try {
            transaction();
            resolve();
        }
        catch (error) {
            reject(error);
        }
    });
}
//# sourceMappingURL=connection.js.map