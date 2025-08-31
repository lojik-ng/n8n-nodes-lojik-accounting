import type sqlite3 from 'sqlite3';
type Database = sqlite3.Database;
import type { JournalEntry, JournalLine } from '../types/index.js';
export declare function createJournalEntry(db: Database, input: {
    date: string;
    description?: string | undefined;
    reference?: string | undefined;
    lines: Array<{
        accountId: number;
        debit?: number | undefined;
        credit?: number | undefined;
    }>;
}): Promise<{
    entry: JournalEntry;
    lines: JournalLine[];
}>;
export declare function deleteJournalEntry(db: Database, id: number): Promise<{
    deleted: boolean;
}>;
export declare function getJournalEntryById(db: Database, id: number): Promise<{
    entry: JournalEntry;
    lines: JournalLine[];
} | undefined>;
export declare function searchJournalEntries(db: Database, input: {
    startDate?: string | undefined;
    endDate?: string | undefined;
    reference?: string | undefined;
    description?: string | undefined;
}): Promise<JournalEntry[]>;
export {};
