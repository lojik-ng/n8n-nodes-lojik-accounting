import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: searchJournalEntries single filters', () => {
    test('startDate only', async () => {
        const p = setTmpDb('tmp-search-one');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({ startDate: '2024-01-01' });
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
    test('endDate only', async () => {
        const p = setTmpDb('tmp-search-two');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({ endDate: '2024-01-31' });
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
    test('reference only', async () => {
        const p = setTmpDb('tmp-search-three');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({ reference: 'INV' });
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
    test('description only', async () => {
        const p = setTmpDb('tmp-search-four');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.searchJournalEntries({ description: 'text' });
        expect(res.success).toBe(true);
        cleanupDb(p);
    });
});


