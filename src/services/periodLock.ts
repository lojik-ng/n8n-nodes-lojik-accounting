import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import { execAsync, getAsync } from '../db/connection.js';

export async function setPeriodLock(db: Database, throughDate: string): Promise<void> {
    await execAsync(
        db,
        `INSERT INTO period_locks (id, through_date) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET through_date = excluded.through_date`,
        [throughDate],
    );
}

export async function getPeriodLock(db: Database): Promise<string | undefined> {
    const row = await getAsync<{ through_date: string }>(
        db,
        `SELECT through_date FROM period_locks WHERE id = 1`,
    );
    return row?.through_date;
}

export async function assertNotLocked(db: Database, date: string): Promise<void> {
    const lock = await getPeriodLock(db);
    if (!lock) return;
    if (date <= lock) {
        throw new Error(`Write operations are locked through ${lock}`);
    }
}


