import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import { getDb } from '../db/connection';
import {
    createAccountInput,
    updateAccountInput,
    getAccountByIdInput,
    listAccountsInput,
    deleteAccountInput,
    createJournalEntryInput,
    deleteJournalEntryInput,
    getJournalEntryByIdInput,
    searchJournalEntriesInput,
    getLedgerInput,
    closePeriodInput,
} from '../validation/schemas';
import * as Accounts from '../services/accounts';
import * as Journal from '../services/journal';
import * as Reports from '../services/reports';
import { assertNotLocked, setPeriodLock } from '../services/periodLock';
import type { ActionResult } from '../types/index';
import type {
    CreateAccountInput,
    UpdateAccountInput,
    ListAccountsInput,
    CreateJournalEntryInput,
    SearchJournalEntriesInput,
    GetLedgerInput,
} from '../validation/schemas';

export interface LojikCredentials {
    databaseFileName: string;
    displayDateFormat?: string; // Luxon format
    currencySymbol?: string;
    timezone?: string; // IANA TZ
}

async function useDb(creds: LojikCredentials): Promise<Database> {
    return getDb({ databaseFileName: creds.databaseFileName });
}

function ok<T>(data: T): ActionResult<T> {
    return { success: true, data } as const;
}
function err(message: string, details?: unknown): ActionResult<never> {
    return { success: false, message, details } as const;
}

function errorMessage(e: unknown, fallback: string): string {
    if (e && typeof e === 'object' && 'message' in e) {
        const m = (e as { message?: unknown }).message;
        if (typeof m === 'string') return m;
    }
    try {
        return String(e);
    } catch {
        return fallback;
    }
}

export class LojikAccountingTool {
    private creds: LojikCredentials;
    constructor(creds: LojikCredentials) {
        this.creds = {
            displayDateFormat: 'yyyy-LL-dd',
            currencySymbol: '₦',
            timezone: 'UTC+1',
            ...creds,
        };
    }

    // helper intentionally kept minimal; we will prefer conditional spreads at callsites to keep types precise

    // Accounts
    async createAccount(input: unknown) {
        try {
            const parsed = createAccountInput.parse(input);
            const db = await useDb(this.creds);
            const payload: CreateAccountInput = {
                code: parsed.code,
                name: parsed.name,
                type: parsed.type,
                ...(parsed.parentId !== undefined ? { parentId: parsed.parentId } : {}),
            };
            const account = await Accounts.createAccount(db, payload);
            return ok(account);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to create account'), e);
        }
    }

    async updateAccount(input: unknown) {
        try {
            const parsed = updateAccountInput.parse(input);
            const db = await useDb(this.creds);
            const payload: UpdateAccountInput = {
                id: parsed.id,
                ...(parsed.code !== undefined ? { code: parsed.code } : {}),
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.type !== undefined ? { type: parsed.type } : {}),
                ...(parsed.parentId !== undefined ? { parentId: parsed.parentId } : {}),
            };
            const account = await Accounts.updateAccount(db, payload);
            return ok(account);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to update account'), e);
        }
    }

    async getAccountById(input: unknown) {
        try {
            const parsed = getAccountByIdInput.parse(input);
            const db = await useDb(this.creds);
            const account = await Accounts.getAccountById(db, parsed.id);
            return ok(account ?? null);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get account'), e);
        }
    }

    async listAccounts(input: unknown) {
        try {
            const parsed = listAccountsInput.parse(input ?? {});
            const db = await useDb(this.creds);
            const filters: ListAccountsInput = {
                ...(parsed.code !== undefined ? { code: parsed.code } : {}),
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.type !== undefined ? { type: parsed.type } : {}),
            };
            const accounts = await Accounts.listAccounts(db, filters);
            return ok(accounts);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to list accounts'), e);
        }
    }

    async deleteAccount(input: unknown) {
        try {
            const parsed = deleteAccountInput.parse(input);
            const db = await useDb(this.creds);
            const deletedAccountIds = await Accounts.deleteAccount(db, parsed.id);
            return ok({ deletedAccountIds });
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to delete account'), e);
        }
    }

    // Journal
    async createJournalEntry(input: unknown) {
        try {
            const parsed = createJournalEntryInput.parse(input);
            const db = await useDb(this.creds);
            await assertNotLocked(db, parsed.date);
            const payload: CreateJournalEntryInput = {
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
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to create journal entry'), e);
        }
    }

    async deleteJournalEntry(input: unknown) {
        try {
            const parsed = deleteJournalEntryInput.parse(input);
            const db = await useDb(this.creds);
            const existing = await Journal.getJournalEntryById(db, parsed.id);
            if (existing) {
                await assertNotLocked(db, existing.entry.date);
            }
            const result = await Journal.deleteJournalEntry(db, parsed.id);
            return ok(result);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to delete journal entry'), e);
        }
    }

    async getJournalEntryById(input: unknown) {
        try {
            const parsed = getJournalEntryByIdInput.parse(input);
            const db = await useDb(this.creds);
            const result = await Journal.getJournalEntryById(db, parsed.id);
            return ok(result ?? null);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get journal entry'), e);
        }
    }

    async searchJournalEntries(input: unknown) {
        try {
            const parsed = searchJournalEntriesInput.parse(input ?? {});
            const db = await useDb(this.creds);
            const filters: SearchJournalEntriesInput = {
                ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
                ...(parsed.endDate !== undefined ? { endDate: parsed.endDate } : {}),
                ...(parsed.reference !== undefined ? { reference: parsed.reference } : {}),
                ...(parsed.description !== undefined ? { description: parsed.description } : {}),
            };
            const entries = await Journal.searchJournalEntries(db, filters);
            return ok(entries);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to search journal entries'), e);
        }
    }

    // Reports
    async getTrialBalance() {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getTrialBalance(db);
            return ok(report);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get trial balance'), e);
        }
    }

    async getLedger(input: unknown) {
        try {
            const parsed = getLedgerInput.parse(input);
            const db = await useDb(this.creds);
            const args: GetLedgerInput = {
                accountId: parsed.accountId,
                ...(parsed.startDate !== undefined ? { startDate: parsed.startDate } : {}),
                ...(parsed.endDate !== undefined ? { endDate: parsed.endDate } : {}),
                ...(parsed.includeRunningBalance !== undefined
                    ? { includeRunningBalance: parsed.includeRunningBalance }
                    : {}),
            };
            const report = await Reports.getLedger(db, args);
            return ok(report);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get ledger'), e);
        }
    }

    async getBalanceSheet() {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getBalanceSheet(db);
            return ok(report);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get balance sheet'), e);
        }
    }

    async getProfitLoss(input?: unknown) {
        try {
            const db = await useDb(this.creds);
            const report = await Reports.getProfitLoss(db, (input as { startDate?: string; endDate?: string }) ?? {});
            return ok(report);
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get profit/loss'), e);
        }
    }

    // Utility
    async getJournalEntryDetails(input: unknown) {
        return this.getJournalEntryById(input);
    }

    async closePeriod(input: unknown) {
        try {
            const parsed = closePeriodInput.parse(input);
            const db = await useDb(this.creds);
            await setPeriodLock(db, parsed.throughDate);
            return ok({ lockedThrough: parsed.throughDate });
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to close period'), e);
        }
    }

    async getSettings() {
        try {
            const { displayDateFormat = 'yyyy-LL-dd', currencySymbol = '₦', timezone = 'UTC+1' } = this.creds;
            return ok({ displayDateFormat, currencySymbol, timezone });
        } catch (e: unknown) {
            return err(errorMessage(e, 'Failed to get settings'), e);
        }
    }
}

export function createTool(credentials: LojikCredentials) {
    return new LojikAccountingTool(credentials);
}


