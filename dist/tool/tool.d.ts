export interface LojikCredentials {
    databaseFileName: string;
    displayDateFormat?: string;
    currencySymbol?: string;
    timezone?: string;
}
export declare class LojikAccountingTool {
    private creds;
    constructor(creds: LojikCredentials);
    createAccount(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account>>;
    updateAccount(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account>>;
    getAccountById(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account | null>>;
    listAccounts(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account[]>>;
    deleteAccount(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        deletedAccountIds: number[];
    }>>;
    createJournalEntry(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        entry: import("../types/index.js").JournalEntry;
        lines: import("../types/index.js").JournalLine[];
    }>>;
    deleteJournalEntry(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        deleted: boolean;
    }>>;
    getJournalEntryById(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        entry: import("../types/index.js").JournalEntry;
        lines: import("../types/index.js").JournalLine[];
    } | null>>;
    searchJournalEntries(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").JournalEntry[]>>;
    getTrialBalance(): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").TrialBalanceReport>>;
    getLedger(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").LedgerReport>>;
    getBalanceSheet(): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").BalanceSheetReport>>;
    getProfitLoss(input?: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").ProfitLossReport>>;
    getJournalEntryDetails(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        entry: import("../types/index.js").JournalEntry;
        lines: import("../types/index.js").JournalLine[];
    } | null>>;
    closePeriod(input: unknown): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        lockedThrough: string;
    }>>;
    getSettings(): Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
        displayDateFormat: string;
        currencySymbol: string;
        timezone: string;
    }>>;
}
export declare function createTool(credentials: LojikCredentials): LojikAccountingTool;
