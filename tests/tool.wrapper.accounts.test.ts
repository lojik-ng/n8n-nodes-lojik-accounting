import { createTool } from '../src/tool/tool.js';
import { setTmpDb, cleanupDb } from './helpers';

describe('Tool wrapper - accounts', () => {
    test('create/update/list/get/delete and duplicate error path', async () => {
        const p = setTmpDb('tmp-acc');
        const tool = createTool({ databaseFileName: 'ignored.sqlite' });

        // create
        const a1 = await tool.createAccount({ code: '100', name: 'Cash', type: 'Asset' });
        expect(a1.success).toBe(true);
        if (!a1.success) return cleanupDb(p);

        // duplicate code error
        const dup = await tool.createAccount({ code: '100', name: 'DupCash', type: 'Asset' });
        expect(dup.success).toBe(false);

        // update only name
        const upd = await tool.updateAccount({ id: a1.data.id, name: 'Cash on Hand' });
        expect(upd.success).toBe(true);
        if (upd.success) expect(upd.data.name).toBe('Cash on Hand');

        // list filter by code
        const list = await tool.listAccounts({ code: '10' });
        expect(list.success).toBe(true);
        if (list.success) expect(list.data.length).toBeGreaterThan(0);

        // get by id
        const got = await tool.getAccountById({ id: a1.data.id });
        expect(got.success).toBe(true);
        if (got.success) expect(got.data?.id).toBe(a1.data.id);

        // get non-existing -> null
        const gotNone = await tool.getAccountById({ id: 999999 });
        expect(gotNone.success).toBe(true);
        if (gotNone.success) expect(gotNone.data).toBeNull();

        // delete nonexisting -> ok with []
        const delNone = await tool.deleteAccount({ id: 999999 });
        expect(delNone.success).toBe(true);
        if (delNone.success) expect(delNone.data.deletedAccountIds).toEqual([]);

        // delete existing -> ok
        const del = await tool.deleteAccount({ id: a1.data.id });
        expect(del.success).toBe(true);
        cleanupDb(p);
    });
});


