import { getDb } from '../src/db/connection.js';
import { setPeriodLock } from '../src/services/periodLock.js';
import { createAccount } from '../src/services/accounts.js';
import { createTool } from '../src/tool/tool.js';
import path from 'node:path';
import { unlinkSync } from 'node:fs';

describe('Period locking', () => {
    test('blocks journal on/before locked date', async () => {
        const tmp = path.join(process.cwd(), `tmp-lock-${Date.now()}-${Math.random()}.sqlite`);
        process.env.DATABASE_FILE = tmp;
        const db = await getDb({ databaseFileName: 'ignore.sqlite' });
        await setPeriodLock(db, '2024-01-15');
        const acc = await createAccount(db, { code: '2000', name: 'Bank', type: 'Asset' });
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.createJournalEntry({
            date: '2024-01-10',
            lines: [
                { accountId: acc.id, debit: 1 },
                { accountId: acc.id, credit: 1 },
            ],
        });
        expect(res.success).toBe(false);
        try { unlinkSync(tmp); } catch { }
    });
});


