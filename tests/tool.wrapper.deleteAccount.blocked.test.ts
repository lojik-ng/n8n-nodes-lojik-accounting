import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: deleteAccount blocked by journal lines', () => {
    test('returns error envelope when account referenced by lines', async () => {
        const p = setTmpDb('tmp-delacc-blocked');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const a1 = await tool.createAccount({ code: '5100', name: 'Cash', type: 'Asset' });
        const a2 = await tool.createAccount({ code: '5200', name: 'Offset', type: 'Asset' });
        expect(a1.success && a2.success).toBe(true);
        if (!(a1.success && a2.success)) return cleanupDb(p);
        const je = await tool.createJournalEntry({
            date: '2024-02-01',
            lines: [
                { accountId: a1.data.id, debit: 10 },
                { accountId: a2.data.id, credit: 10 },
            ],
        });
        expect(je.success).toBe(true);
        const del = await tool.deleteAccount({ id: a1.data.id });
        expect(del.success).toBe(false);
        cleanupDb(p);
    });
});


