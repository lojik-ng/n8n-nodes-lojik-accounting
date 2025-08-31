import { getDb } from '../src/db/connection.js';
import { createAccount } from '../src/services/accounts.js';
import { createJournalEntry } from '../src/services/journal.js';
import { getLedger } from '../src/services/reports.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Ledger runningBalance branch', () => {
    test('with and without runningBalance', async () => {
        const p = setTmpDb('tmp-ledger');
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        const cash = await createAccount(db, { code: '1300', name: 'Cash', type: 'Asset' });
        await createJournalEntry(db, {
            date: '2024-01-02',
            lines: [
                { accountId: cash.id, debit: 10 },
                { accountId: cash.id, credit: 10 },
            ],
        });
        const noRun = await getLedger(db, { accountId: cash.id });
        expect(noRun.lines[0].runningBalance).toBeUndefined();
        const withRun = await getLedger(db, { accountId: cash.id, includeRunningBalance: true });
        expect(withRun.lines[0].runningBalance).toBeDefined();
        cleanupDb(p);
    });
});


