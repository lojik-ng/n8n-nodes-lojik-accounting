import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import type { Account } from '../types/index.js';
export declare function createAccount(db: Database, input: {
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
    parentId?: number | undefined;
}): Promise<Account>;
export declare function updateAccount(db: Database, input: {
    id: number;
    code?: string | undefined;
    name?: string | undefined;
    type?: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense' | undefined;
    parentId?: number | null | undefined;
}): Promise<Account>;
export declare function getAccountById(db: Database, id: number): Promise<Account | undefined>;
export declare function listAccounts(db: Database, filters: {
    code?: string | undefined;
    name?: string | undefined;
    type?: Account['type'] | undefined;
}): Promise<Account[]>;
export declare function deleteAccount(db: Database, id: number): Promise<number[]>;
export {};
