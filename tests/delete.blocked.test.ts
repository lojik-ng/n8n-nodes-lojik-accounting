import { getDb } from '../src/db/connection.js';
import { createAccount, deleteAccount } from '../src/services/accounts.js';
import { createJournalEntry } from '../src/services/journal.js';
import path from 'node:path';
import { unlinkSync } from 'node:fs';

describe('Delete account blocked when referenced by lines', () => {
    test('cannot delete account with lines', async () => {
        const tmp = path.join(process.cwd(), `tmp-del-${Date.now()}-${Math.random()}.sqlite`);
        process.env.DATABASE_FILE = tmp;
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const a = await createAccount(db, { code: '3000', name: 'AR', type: 'Asset' });
        await createJournalEntry(db, {
            date: '2024-01-20',
            lines: [
                { accountId: a.id, debit: 5 },
                { accountId: a.id, credit: 5 },
            ],
        });
        await expect(deleteAccount(db, a.id)).rejects.toThrow();
        try { unlinkSync(tmp); } catch { }
    });
});


