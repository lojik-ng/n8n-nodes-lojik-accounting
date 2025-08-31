import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper branches (zod error paths)', () => {
    test('invalid inputs return error envelopes', async () => {
        const p = setTmpDb('tmp-branches');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });

        expect((await tool.createAccount({} as any)).success).toBe(false);
        expect((await tool.updateAccount({} as any)).success).toBe(false);
        expect((await tool.getAccountById({ id: 'x' } as any)).success).toBe(false);
        expect((await tool.listAccounts({ type: 'Bad' } as any)).success).toBe(false);
        expect((await tool.deleteAccount({ id: -1 } as any)).success).toBe(false);

        expect(
            (
                await tool.createJournalEntry({
                    date: '2024-01-10',
                    lines: [{ accountId: 1, debit: 1, credit: 1 }], // both set -> invalid
                } as any)
            ).success,
        ).toBe(false);
        expect((await tool.deleteJournalEntry({ id: 'x' } as any)).success).toBe(false);
        expect((await tool.getJournalEntryById({ id: 'x' } as any)).success).toBe(false);
        expect((await tool.searchJournalEntries({ startDate: 'bad' } as any)).success).toBe(false);
        expect((await tool.getLedger({ accountId: 'x' } as any)).success).toBe(false);
        expect((await tool.closePeriod({ throughDate: 'bad' } as any)).success).toBe(false);

        cleanupDb(p);
    });
});


