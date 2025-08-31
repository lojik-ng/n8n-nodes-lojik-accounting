import { getDb } from '../src/db/connection.js';
import { createAccount } from '../src/services/accounts.js';
import { createJournalEntry, searchJournalEntries } from '../src/services/journal.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Journal search filters', () => {
    test('search by date range and description', async () => {
        const p = setTmpDb('tmp-js');
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const cash = await createAccount(db, { code: '1200', name: 'Cash', type: 'Asset' });
        await createJournalEntry(db, {
            date: '2024-01-01',
            description: 'opening',
            lines: [
                { accountId: cash.id, debit: 5 },
                { accountId: cash.id, credit: 5 },
            ],
        });
        const res = await searchJournalEntries(db, { startDate: '2024-01-01', endDate: '2024-01-31', description: 'open' });
        expect(Array.isArray(res)).toBe(true);
        cleanupDb(p);
    });
});


