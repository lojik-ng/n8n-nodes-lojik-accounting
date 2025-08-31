import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper: updateAccount not found', () => {
    test('returns error envelope when id does not exist', async () => {
        const p = setTmpDb('tmp-upd-nf');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });
        const res = await tool.updateAccount({ id: 999999, name: 'X' });
        expect(res.success).toBe(false);
        cleanupDb(p);
    });
});


