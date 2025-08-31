import { LojikAccountingTool } from './tool/LojikAccountingTool.js';
import { LojikAccountingApi } from './tool/LojikAccountingApi.credentials.js';

export {
    LojikAccountingTool,
    LojikAccountingApi,
};

// Export types for external use
export type {
    Account,
    JournalEntry,
    JournalLine,
    JournalEntryWithLines,
    TrialBalanceReport,
    LedgerReport,
    BalanceSheetReport,
    ProfitLossReport,
    ActionResult,
    LojikAccountingCredentials,
} from './types/index.js';

// Export validation schemas for external use
export {
    createAccountInputSchema,
    updateAccountInputSchema,
    createJournalEntryInputSchema,
    lojikAccountingCredentialsSchema,
} from './validation/schemas.js';

// Export services for advanced use cases
export {
    createAccount,
    updateAccount,
    getAccountById,
    listAccounts,
    deleteAccount,
    createJournalEntry,
    deleteJournalEntry,
    getJournalEntryById,
    searchJournalEntries,
    closePeriod,
    getTrialBalance,
    getLedger,
    getBalanceSheet,
    getProfitLoss,
} from './services/index.js';

// Export database utilities
export {
    initializeDatabaseConnection,
    closeDatabaseConnection,
} from './db/connection.js';
