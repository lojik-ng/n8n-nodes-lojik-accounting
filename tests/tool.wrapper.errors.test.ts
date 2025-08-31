import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper error envelopes', () => {
    test('createAccount validation error', async () => {
        const p = setTmpDb('tmp-wrap');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.createAccount({ code: '', name: '', type: 'Asset' } as any);
        expect(res.success).toBe(false);
        cleanupDb(p);
    });

    test('searchJournalEntries accepts empty input', async () => {
        const p = setTmpDb('tmp-wrap');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({});
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
});


