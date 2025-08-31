import { type LojikCredentials } from './tool.js';
export declare const toolDefinition: {
    name: string;
    description: string;
    credentials: {
        name: string;
        properties: {
            databaseFileName: {
                type: string;
                required: boolean;
            };
            displayDateFormat: {
                type: string;
                required: boolean;
            };
            currencySymbol: {
                type: string;
                required: boolean;
            };
            timezone: {
                type: string;
                required: boolean;
            };
        };
    };
    create: (credentials: LojikCredentials) => {
        readonly createAccount: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account>>;
        readonly updateAccount: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account>>;
        readonly getAccountById: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account | null>>;
        readonly listAccounts: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").Account[]>>;
        readonly deleteAccount: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            deletedAccountIds: number[];
        }>>;
        readonly createJournalEntry: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            entry: import("../types/index.js").JournalEntry;
            lines: import("../types/index.js").JournalLine[];
        }>>;
        readonly deleteJournalEntry: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            deleted: boolean;
        }>>;
        readonly getJournalEntryById: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            entry: import("../types/index.js").JournalEntry;
            lines: import("../types/index.js").JournalLine[];
        } | null>>;
        readonly searchJournalEntries: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").JournalEntry[]>>;
        readonly getTrialBalance: () => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").TrialBalanceReport>>;
        readonly getLedger: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").LedgerReport>>;
        readonly getBalanceSheet: () => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").BalanceSheetReport>>;
        readonly getProfitLoss: (input?: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<import("../types/index.js").ProfitLossReport>>;
        readonly getJournalEntryDetails: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            entry: import("../types/index.js").JournalEntry;
            lines: import("../types/index.js").JournalLine[];
        } | null>>;
        readonly closePeriod: (input: unknown) => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            lockedThrough: string;
        }>>;
        readonly getSettings: () => Promise<import("../types/index.js").ErrorEnvelope | import("../types/index.js").ResultEnvelope<{
            displayDateFormat: string;
            currencySymbol: string;
            timezone: string;
        }>>;
    };
};
export type LojikAccountingActions = ReturnType<typeof toolDefinition.create>;
