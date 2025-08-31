import { LojikAccountingTool } from './tool.js';
// Minimal n8n Community Tool registration object
// This mirrors the pattern used by n8n AI Agent tools: expose name, description,
// credential definition, and a method to create the runtime with bound actions.
export const toolDefinition = {
    name: 'lojik-accounting',
    description: 'Accounting tool (SQLite3) for managing accounts, journal, and reports',
    credentials: {
        name: 'Lojik Accounting',
        properties: {
            databaseFileName: { type: 'string', required: true },
            displayDateFormat: { type: 'string', required: false },
            currencySymbol: { type: 'string', required: false },
            timezone: { type: 'string', required: false },
        },
    },
    create: (credentials) => {
        const tool = new LojikAccountingTool(credentials);
        return {
            // Accounts
            createAccount: tool.createAccount.bind(tool),
            updateAccount: tool.updateAccount.bind(tool),
            getAccountById: tool.getAccountById.bind(tool),
            listAccounts: tool.listAccounts.bind(tool),
            deleteAccount: tool.deleteAccount.bind(tool),
            // Journal
            createJournalEntry: tool.createJournalEntry.bind(tool),
            deleteJournalEntry: tool.deleteJournalEntry.bind(tool),
            getJournalEntryById: tool.getJournalEntryById.bind(tool),
            searchJournalEntries: tool.searchJournalEntries.bind(tool),
            // Reports
            getTrialBalance: tool.getTrialBalance.bind(tool),
            getLedger: tool.getLedger.bind(tool),
            getBalanceSheet: tool.getBalanceSheet.bind(tool),
            getProfitLoss: tool.getProfitLoss.bind(tool),
            // Utility
            getJournalEntryDetails: tool.getJournalEntryDetails.bind(tool),
            closePeriod: tool.closePeriod.bind(tool),
            getSettings: tool.getSettings.bind(tool),
        };
    },
};
export default toolDefinition;
//# sourceMappingURL=registration.js.map