import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import { allAsync, execAsync, getAsync, withTransaction } from '../db/connection';
import type { Account } from '../types/index';

export async function createAccount(db: Database, input: {
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
    parentId?: number | undefined;
}): Promise<Account> {
    const sql = `INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)`;
    const params = [input.code, input.name, input.type, input.parentId ?? null];
    await new Promise<void>((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
    const account = await getAsync<Account>(db, `SELECT * FROM accounts WHERE code = ?`, [
        input.code,
    ]);
    if (!account) throw new Error('Failed to fetch created account');
    return account;
}

export async function updateAccount(db: Database, input: {
    id: number;
    code?: string | undefined;
    name?: string | undefined;
    type?: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense' | undefined;
    parentId?: number | null | undefined;
}): Promise<Account> {
    const current = await getAsync<Account>(db, `SELECT * FROM accounts WHERE id = ?`, [
        input.id,
    ]);
    if (!current) throw new Error('Account not found');
    const next = {
        code: input.code ?? current.code,
        name: input.name ?? current.name,
        type: input.type ?? current.type,
        parent_id: input.parentId === undefined ? current.parent_id : input.parentId,
    };
    await execAsync(
        db,
        `UPDATE accounts SET code = ?, name = ?, type = ?, parent_id = ? WHERE id = ?`,
        [next.code, next.name, next.type, next.parent_id, input.id],
    );
    const updated = await getAsync<Account>(db, `SELECT * FROM accounts WHERE id = ?`, [input.id]);
    if (!updated) throw new Error('Failed to fetch updated account');
    return updated;
}

export async function getAccountById(db: Database, id: number): Promise<Account | undefined> {
    return getAsync<Account>(db, `SELECT * FROM accounts WHERE id = ?`, [id]);
}

export async function listAccounts(
    db: Database,
    filters: { code?: string | undefined; name?: string | undefined; type?: Account['type'] | undefined },
): Promise<Account[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filters.code) {
        conditions.push('code LIKE ?');
        params.push(`%${filters.code}%`);
    }
    if (filters.name) {
        conditions.push('name LIKE ?');
        params.push(`%${filters.name}%`);
    }
    if (filters.type) {
        conditions.push('type = ?');
        params.push(filters.type);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return allAsync<Account>(db, `SELECT * FROM accounts ${where} ORDER BY code ASC`, params);
}

export async function deleteAccount(db: Database, id: number): Promise<number[]> {
    // gather descendant ids
    const rows = await allAsync<{ id: number; parent_id: number | null }>(
        db,
        `WITH RECURSIVE descendants(id) AS (
      SELECT id FROM accounts WHERE id = ?
      UNION ALL
      SELECT a.id FROM accounts a JOIN descendants d ON a.parent_id = d.id
    ) SELECT id, (SELECT parent_id FROM accounts WHERE id = id) as parent_id FROM accounts WHERE id IN (SELECT id FROM descendants)`,
        [id],
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];

    // Check for journal lines referencing any of these accounts
    const placeholders = ids.map(() => '?').join(',');
    const ref = await getAsync<{ cnt: number }>(
        db,
        `SELECT COUNT(*) as cnt FROM journal_lines WHERE account_id IN (${placeholders})`,
        ids,
    );
    if ((ref?.cnt ?? 0) > 0) {
        throw new Error('Cannot delete account(s) with existing journal lines');
    }

    await withTransaction(db, async () => {
        await execAsync(db, `DELETE FROM accounts WHERE id IN (${placeholders})`, ids);
    });
    return ids;
}


