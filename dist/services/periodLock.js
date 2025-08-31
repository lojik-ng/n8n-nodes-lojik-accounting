import { execAsync, getAsync } from '../db/connection.js';
export async function setPeriodLock(db, throughDate) {
    await execAsync(db, `INSERT INTO period_locks (id, through_date) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET through_date = excluded.through_date`, [throughDate]);
}
export async function getPeriodLock(db) {
    const row = await getAsync(db, `SELECT through_date FROM period_locks WHERE id = 1`);
    return row?.through_date;
}
export async function assertNotLocked(db, date) {
    const lock = await getPeriodLock(db);
    if (!lock)
        return;
    if (date <= lock) {
        throw new Error(`Write operations are locked through ${lock}`);
    }
}
//# sourceMappingURL=periodLock.js.map