import { allAsync, execAsync, getAsync, withTransaction } from '../db/connection.js';
export async function createJournalEntry(db, input) {
    return withTransaction(db, async () => {
        await execAsync(db, `INSERT INTO journal_entries (date, description, reference) VALUES (?, ?, ?)`, [input.date, input.description ?? null, input.reference ?? null]);
        const entry = await getAsync(db, `SELECT * FROM journal_entries ORDER BY id DESC LIMIT 1`);
        if (!entry)
            throw new Error('Failed to create journal entry');
        const insertLine = db.prepare(`INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)`);
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                for (const line of input.lines) {
                    const debit = (line.debit ?? 0).valueOf();
                    const credit = (line.credit ?? 0).valueOf();
                    insertLine.run([entry.id, line.accountId, debit, credit]);
                }
                insertLine.finalize((err) => (err ? reject(err) : resolve()));
            });
        });
        const lines = await allAsync(db, `SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id ASC`, [entry.id]);
        return { entry, lines };
    });
}
export async function deleteJournalEntry(db, id) {
    await execAsync(db, `DELETE FROM journal_entries WHERE id = ?`, [id]);
    return { deleted: true };
}
export async function getJournalEntryById(db, id) {
    const entry = await getAsync(db, `SELECT * FROM journal_entries WHERE id = ?`, [
        id,
    ]);
    if (!entry)
        return undefined;
    const lines = await allAsync(db, `SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY id ASC`, [id]);
    return { entry, lines };
}
export async function searchJournalEntries(db, input) {
    const conditions = [];
    const params = [];
    if (input.startDate) {
        conditions.push('date >= ?');
        params.push(input.startDate);
    }
    if (input.endDate) {
        conditions.push('date <= ?');
        params.push(input.endDate);
    }
    if (input.reference) {
        conditions.push('reference LIKE ?');
        params.push(`%${input.reference}%`);
    }
    if (input.description) {
        conditions.push('description LIKE ?');
        params.push(`%${input.description}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return allAsync(db, `SELECT * FROM journal_entries ${where} ORDER BY date DESC, id DESC`, params);
}
//# sourceMappingURL=journal.js.map