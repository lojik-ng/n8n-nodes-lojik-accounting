import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper additional branches', () => {
    test('covers optional fields and combined filters', async () => {
        const p = setTmpDb('tmp-branches2');
        const tool = createTool({
            databaseFileName: 'ignored.sqlite',
            displayDateFormat: 'dd-LL-yyyy',
            currencySymbol: '$',
            timezone: 'UTC',
        });

        // accounts with parent
        const parent = await tool.createAccount({ code: '6100', name: 'Group', type: 'Asset' });
        expect(parent.success).toBe(true);
        if (!parent.success) return cleanupDb(p);
        const child = await tool.createAccount({ code: '6101', name: 'Child', type: 'Asset', parentId: parent.data.id });
        expect(child.success).toBe(true);

        // update with multiple optional fields, including parentId null
        const update = await tool.updateAccount({ id: child.success ? child.data.id : 0, code: '6101A', type: 'Asset', parentId: null });
        expect(update.success).toBe(true);

        // create journal with description/reference
        const je = await tool.createJournalEntry({
            date: '2024-03-10',
            description: 'desc',
            reference: 'REF-1',
            lines: [
                { accountId: parent.data.id, debit: 10 },
                { accountId: parent.data.id, credit: 10 },
            ],
        });
        expect(je.success).toBe(true);

        // combined search filters
        const search = await tool.searchJournalEntries({ startDate: '2024-03-01', endDate: '2024-03-31', reference: 'REF', description: 'desc' });
        expect(search.success).toBe(true);

        // filters for list
        const listByName = await tool.listAccounts({ name: 'Group' });
        expect(listByName.success).toBe(true);
        const listByType = await tool.listAccounts({ type: 'Asset' });
        expect(listByType.success).toBe(true);

        // profit/loss via tool with filters
        const pl = await tool.getProfitLoss({ startDate: '2024-03-01', endDate: '2024-03-31' });
        expect(pl.success).toBe(true);

        // settings with overrides
        const settings = await tool.getSettings();
        expect(settings.success).toBe(true);
        if (settings.success) {
            expect(settings.data.displayDateFormat).toBe('dd-LL-yyyy');
            expect(settings.data.currencySymbol).toBe('$');
            expect(settings.data.timezone).toBe('UTC');
        }

        cleanupDb(p);
    });
});


