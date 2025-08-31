import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: searchJournalEntries with empty filters', () => {
    test('returns success and an array', async () => {
        const p = setTmpDb('tmp-search-empty');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({});
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
});


