import { getDb } from '../db/connection.js';
import { createAccountInput, updateAccountInput, getAccountByIdInput, listAccountsInput, deleteAccountInput, createJournalEntryInput, deleteJournalEntryInput, getJournalEntryByIdInput, searchJournalEntriesInput, getLedgerInput, closePeriodInput, } from '../validation/schemas.js';
import * as Accounts from '../services/accounts.js';
import * as Journal from '../services/journal.js';
import * as Reports from '../services/reports.js';
import { assertNotLocked, setPeriodLock } from '../services/periodLock.js';
async function useDb(creds) {
    return getDb({ databaseFileName: creds.databaseFileName });
}
function ok(data) {
    return { success: true, data };
}
function err(message, details) {
    return { success: false, message, details };
}
function errorMessage(e, fallback) {
    if (e && typeof e === 'object' && 'message' in e) {
        const m = e.message;
        if (typeof m === 'string')
            return m;
    }
    try {
        return String(e);
    }
    catch {
        return fallback;
    }
}
export class LojikAccountingTool {
    creds;
    constructor(creds) {
        this.creds = {
            displayDateFormat: 'yyyy-LL-dd',
            currencySymbol: '₦',
            timezone: 'UTC+1',
            ...creds,
        };
    }
    // helper intentionally kept minimal; we will prefer conditional spreads at callsites to keep types precise
    // Accounts
    async createAccount(input) {
        try {
            const parsed = createAccountInput.parse(input);
            const db = await useDb(this.creds);
            const payload = {
                code: parsed.code,
                name: parsed.name,
                type: parsed.type,
                ...(parsed.parentId !== undefined ? { parentId: parsed.parentId } : {}),
            };
            const account = await Accounts.createAccount(db, payload);
            return ok(account);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to create account'), e);
        }
    }
    async updateAccount(input) {
        try {
            const parsed = updateAccountInput.parse(input);
            const db = await useDb(this.creds);
            const payload = {
                id: parsed.id,
                ...(parsed.code !== undefined ? { code: parsed.code } : {}),
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.type !== undefined ? { type: parsed.type } : {}),
                ...(parsed.parentId !== undefined ? { parentId: parsed.parentId } : {}),
            };
            const account = await Accounts.updateAccount(db, payload);
            return ok(account);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to update account'), e);
        }
    }
    async getAccountById(input) {
        try {
            const parsed = getAccountByIdInput.parse(input);
            const db = await useDb(this.creds);
            const account = await Accounts.getAccountById(db, parsed.id);
            return ok(account ?? null);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get account'), e);
        }
    }
    async listAccounts(input) {
        try {
            const parsed = listAccountsInput.parse(input ?? {});
            const db = await useDb(this.creds);
            const filters = {
                ...(parsed.code !== undefined ? { code: parsed.code } : {}),
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.type !== undefined ? { type: parsed.type } : {}),
            };
            const accounts = await Accounts.listAccounts(db, filters);
            return ok(accounts);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to list accounts'), e);
        }
    }
    async deleteAccount(input) {
        try {
            const parsed = deleteAccountInput.parse(input);
            const db = await useDb(this.creds);
            const deletedAccountIds = await Accounts.deleteAccount(db, parsed.id);
            return ok({ deletedAccountIds });
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to delete account'), e);
        }
    }
    // Journal
    async createJournalEntry(input) {
        try {
            const parsed = createJournalEntryInput.parse(input);
            const db = await useDb(this.creds);
            await assertNotLocked(db, parsed.date);
            const payload = {
                date: parsed.date,
                ...(parsed.description !== undefined ? { description: parsed.description } : {}),
                ...(parsed.reference !== undefined ? { reference: parsed.reference } : {}),
                lines: parsed.lines.map((l) => ({
                    accountId: l.accountId,
                    ...(l.debit !== undefined ? { debit: l.debit } : {}),
                    ...(l.credit !== undefined ? { credit: l.credit } : {}),
                })),
            };
            const result = await Journal.createJournalEntry(db, payload);
            return ok(result);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to create journal entry'), e);
        }
    }
    async deleteJournalEntry(input) {
        try {
            const parsed = deleteJournalEntryInput.parse(input);
            const db = await useDb(this.creds);
            const existing = await Journal.getJournalEntryById(db, parsed.id);
            if (existing) {
                await assertNotLocked(db, existing.entry.date);
            }
            const result = await Journal.deleteJournalEntry(db, parsed.id);
            return ok(result);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to delete journal entry'), e);
        }
    }
    async getJournalEntryById(input) {
        try {
            const parsed = getJournalEntryByIdInput.parse(input);
            const db = await useDb(this.creds);
            const result = await Journal.getJournalEntryById(db, parsed.id);
            return ok(result ?? null);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get journal entry'), e);
        }
    }
    async searchJournalEntries(input) {
        try {
            const parsed = searchJournalEntriesInput.parse(input ?? {});
            const db = await useDb(this.creds);
            const filters = {
                ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
                ...(parsed.endDate !== undefined ? { endDate: parsed.endDate } : {}),
                ...(parsed.reference !== undefined ? { reference: parsed.reference } : {}),
                ...(parsed.description !== undefined ? { description: parsed.description } : {}),
            };
            const entries = await Journal.searchJournalEntries(db, filters);
            return ok(entries);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to search journal entries'), e);
        }
    }
    // Reports
    async getTrialBalance() {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getTrialBalance(db);
            return ok(report);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get trial balance'), e);
        }
    }
    async getLedger(input) {
        try {
            const parsed = getLedgerInput.parse(input);
            const db = await useDb(this.creds);
            const args = {
                accountId: parsed.accountId,
                ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
                ...(parsed.endDate !== undefined ? { endDate: parsed.endDate } : {}),
                ...(parsed.includeRunningBalance !== undefined
                    ? { includeRunningBalance: parsed.includeRunningBalance }
                    : {}),
            };
            const report = await Reports.getLedger(db, args);
            return ok(report);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get ledger'), e);
        }
    }
    async getBalanceSheet() {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getBalanceSheet(db);
            return ok(report);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get balance sheet'), e);
        }
    }
    async getProfitLoss(input) {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getProfitLoss(db, input ?? {});
            return ok(report);
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get profit/loss'), e);
        }
    }
    // Utility
    async getJournalEntryDetails(input) {
        return this.getJournalEntryById(input);
    }
    async closePeriod(input) {
        try {
            const parsed = closePeriodInput.parse(input);
            const db = await useDb(this.creds);
            await setPeriodLock(db, parsed.throughDate);
            return ok({ lockedThrough: parsed.throughDate });
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to close period'), e);
        }
    }
    async getSettings() {
        try {
            const { displayDateFormat = 'yyyy-LL-dd', currencySymbol = '₦', timezone = 'UTC+1' } = this.creds;
            return ok({ displayDateFormat, currencySymbol, timezone });
        }
        catch (e) {
            return err(errorMessage(e, 'Failed to get settings'), e);
        }
    }
}
export function createTool(credentials) {
    return new LojikAccountingTool(credentials);
}
//# sourceMappingURL=tool.js.map