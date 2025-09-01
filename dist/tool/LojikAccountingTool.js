"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LojikAccountingTool = void 0;
const connection_1 = require("../db/connection");
const schemas_1 = require("../validation/schemas");
const index_1 = require("../services/index");
// Handler functions
async function handleCreateAccount(context, itemIndex) {
    const input = schemas_1.createAccountInputSchema.parse({
        code: context.getNodeParameter('accountCode', itemIndex),
        name: context.getNodeParameter('accountName', itemIndex),
        type: context.getNodeParameter('accountType', itemIndex),
        parentId: context.getNodeParameter('parentAccountId', itemIndex) || undefined,
    });
    return await (0, index_1.createAccount)(input);
}
async function handleUpdateAccount(context, itemIndex) {
    const input = schemas_1.updateAccountInputSchema.parse({
        id: context.getNodeParameter('accountId', itemIndex),
        code: context.getNodeParameter('newAccountCode', itemIndex) || undefined,
        name: context.getNodeParameter('newAccountName', itemIndex) || undefined,
        type: context.getNodeParameter('newAccountType', itemIndex) || undefined,
    });
    return await (0, index_1.updateAccount)(input);
}
async function handleGetAccountById(context, itemIndex) {
    const input = schemas_1.getAccountByIdInputSchema.parse({
        id: context.getNodeParameter('accountId', itemIndex),
    });
    return await (0, index_1.getAccountById)(input);
}
async function handleListAccounts(context, itemIndex) {
    const input = schemas_1.listAccountsInputSchema.parse({
        code: context.getNodeParameter('filterCode', itemIndex) || undefined,
        name: context.getNodeParameter('filterName', itemIndex) || undefined,
        type: context.getNodeParameter('filterType', itemIndex) || undefined,
    });
    return await (0, index_1.listAccounts)(input);
}
async function handleDeleteAccount(context, itemIndex) {
    const input = schemas_1.deleteAccountInputSchema.parse({
        id: context.getNodeParameter('accountId', itemIndex),
    });
    return await (0, index_1.deleteAccount)(input);
}
async function handleCreateJournalEntry(context, itemIndex) {
    const linesParam = context.getNodeParameter('journalLines', itemIndex);
    const lines = typeof linesParam === 'string' ? JSON.parse(linesParam) : linesParam;
    const input = schemas_1.createJournalEntryInputSchema.parse({
        date: context.getNodeParameter('entryDate', itemIndex),
        description: context.getNodeParameter('description', itemIndex) || undefined,
        reference: context.getNodeParameter('reference', itemIndex) || undefined,
        lines,
    });
    return await (0, index_1.createJournalEntry)(input);
}
async function handleDeleteJournalEntry(context, itemIndex) {
    const input = schemas_1.deleteJournalEntryInputSchema.parse({
        id: context.getNodeParameter('journalEntryId', itemIndex),
    });
    return await (0, index_1.deleteJournalEntry)(input);
}
async function handleGetJournalEntryById(context, itemIndex) {
    const input = schemas_1.getJournalEntryByIdInputSchema.parse({
        id: context.getNodeParameter('journalEntryId', itemIndex),
    });
    return await (0, index_1.getJournalEntryById)(input);
}
async function handleSearchJournalEntries(context, itemIndex) {
    const input = schemas_1.searchJournalEntriesInputSchema.parse({
        startDate: context.getNodeParameter('startDate', itemIndex) || undefined,
        endDate: context.getNodeParameter('endDate', itemIndex) || undefined,
        reference: context.getNodeParameter('reference', itemIndex) || undefined,
        description: context.getNodeParameter('description', itemIndex) || undefined,
    });
    return await (0, index_1.searchJournalEntries)(input);
}
async function handleGetTrialBalance(context, itemIndex) {
    const input = schemas_1.getTrialBalanceInputSchema.parse({
        asOfDate: context.getNodeParameter('asOfDate', itemIndex) || undefined,
    });
    return await (0, index_1.getTrialBalance)(input);
}
async function handleGetLedger(context, itemIndex) {
    const input = schemas_1.getLedgerInputSchema.parse({
        accountId: context.getNodeParameter('ledgerAccountId', itemIndex),
        startDate: context.getNodeParameter('startDate', itemIndex) || undefined,
        endDate: context.getNodeParameter('endDate', itemIndex) || undefined,
        includeRunningBalance: context.getNodeParameter('includeRunningBalance', itemIndex),
    });
    return await (0, index_1.getLedger)(input);
}
async function handleGetBalanceSheet(context, itemIndex) {
    const input = schemas_1.getBalanceSheetInputSchema.parse({
        asOfDate: context.getNodeParameter('asOfDate', itemIndex) || undefined,
    });
    return await (0, index_1.getBalanceSheet)(input);
}
async function handleGetProfitLoss(context, itemIndex) {
    const input = schemas_1.getProfitLossInputSchema.parse({
        startDate: context.getNodeParameter('plStartDate', itemIndex),
        endDate: context.getNodeParameter('plEndDate', itemIndex),
    });
    return await (0, index_1.getProfitLoss)(input);
}
async function handleClosePeriod(context, itemIndex) {
    const input = schemas_1.closePeriodInputSchema.parse({
        throughDate: context.getNodeParameter('throughDate', itemIndex),
    });
    return await (0, index_1.closePeriod)(input.throughDate);
}
class LojikAccountingTool {
    description = {
        displayName: 'Lojik Accounting',
        name: 'lojikAccounting',
        icon: 'file:lojik-accounting.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["action"]}}',
        description: 'Comprehensive accounting tool for managing accounts, journal entries, and reports',
        defaults: {
            name: 'Lojik Accounting',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'lojikAccountingApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                noDataExpression: true,
                options: [
                    // Account Management
                    {
                        name: 'Create Account',
                        value: 'createAccount',
                        description: 'Add a new account to the chart of accounts',
                        action: 'Create an account',
                    },
                    {
                        name: 'Update Account',
                        value: 'updateAccount',
                        description: 'Rename or reclassify an account',
                        action: 'Update an account',
                    },
                    {
                        name: 'Get Account by ID',
                        value: 'getAccountById',
                        description: 'Fetch one account by ID',
                        action: 'Get an account by ID',
                    },
                    {
                        name: 'List Accounts',
                        value: 'listAccounts',
                        description: 'Get all accounts with optional filtering',
                        action: 'List accounts',
                    },
                    {
                        name: 'Delete Account',
                        value: 'deleteAccount',
                        description: 'Delete an account and its descendants',
                        action: 'Delete an account',
                    },
                    // Journal Management
                    {
                        name: 'Create Journal Entry',
                        value: 'createJournalEntry',
                        description: 'Create a journal entry with lines',
                        action: 'Create a journal entry',
                    },
                    {
                        name: 'Delete Journal Entry',
                        value: 'deleteJournalEntry',
                        description: 'Delete a journal entry and all lines',
                        action: 'Delete a journal entry',
                    },
                    {
                        name: 'Get Journal Entry by ID',
                        value: 'getJournalEntryById',
                        description: 'Retrieve a journal entry with its lines',
                        action: 'Get a journal entry by ID',
                    },
                    {
                        name: 'Search Journal Entries',
                        value: 'searchJournalEntries',
                        description: 'Search journal entries by criteria',
                        action: 'Search journal entries',
                    },
                    // Reporting
                    {
                        name: 'Get Trial Balance',
                        value: 'getTrialBalance',
                        description: 'Generate trial balance report',
                        action: 'Get trial balance',
                    },
                    {
                        name: 'Get Ledger',
                        value: 'getLedger',
                        description: 'Get account ledger with transactions',
                        action: 'Get account ledger',
                    },
                    {
                        name: 'Get Balance Sheet',
                        value: 'getBalanceSheet',
                        description: 'Generate balance sheet report',
                        action: 'Get balance sheet',
                    },
                    {
                        name: 'Get Profit Loss',
                        value: 'getProfitLoss',
                        description: 'Generate profit and loss report',
                        action: 'Get profit and loss',
                    },
                    // Utility
                    {
                        name: 'Close Period',
                        value: 'closePeriod',
                        description: 'Lock entries up to a specific date',
                        action: 'Close accounting period',
                    },
                ],
                default: 'listAccounts',
            },
            // Account Management Fields
            {
                displayName: 'Account Code',
                name: 'accountCode',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['createAccount'],
                    },
                },
                default: '',
                description: 'Unique code for the account',
            },
            {
                displayName: 'Account Name',
                name: 'accountName',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['createAccount'],
                    },
                },
                default: '',
                description: 'Name of the account',
            },
            {
                displayName: 'Account Type',
                name: 'accountType',
                type: 'options',
                required: true,
                options: [
                    { name: 'Asset', value: 'Asset' },
                    { name: 'Liability', value: 'Liability' },
                    { name: 'Equity', value: 'Equity' },
                    { name: 'Income', value: 'Income' },
                    { name: 'Expense', value: 'Expense' },
                ],
                displayOptions: {
                    show: {
                        action: ['createAccount'],
                    },
                },
                default: 'Asset',
                description: 'Type of the account',
            },
            {
                displayName: 'Parent Account ID',
                name: 'parentAccountId',
                type: 'number',
                displayOptions: {
                    show: {
                        action: ['createAccount'],
                    },
                },
                default: '',
                description: 'ID of the parent account (optional)',
            },
            // Update Account Fields
            {
                displayName: 'Account ID',
                name: 'accountId',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        action: ['updateAccount', 'getAccountById', 'deleteAccount'],
                    },
                },
                default: '',
                description: 'ID of the account',
            },
            {
                displayName: 'New Account Code',
                name: 'newAccountCode',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['updateAccount'],
                    },
                },
                default: '',
                description: 'New code for the account (optional)',
            },
            {
                displayName: 'New Account Name',
                name: 'newAccountName',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['updateAccount'],
                    },
                },
                default: '',
                description: 'New name for the account (optional)',
            },
            {
                displayName: 'New Account Type',
                name: 'newAccountType',
                type: 'options',
                options: [
                    { name: 'Asset', value: 'Asset' },
                    { name: 'Liability', value: 'Liability' },
                    { name: 'Equity', value: 'Equity' },
                    { name: 'Income', value: 'Income' },
                    { name: 'Expense', value: 'Expense' },
                ],
                displayOptions: {
                    show: {
                        action: ['updateAccount'],
                    },
                },
                default: '',
                description: 'New type for the account (optional)',
            },
            // List Accounts Fields
            {
                displayName: 'Filter by Code',
                name: 'filterCode',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['listAccounts'],
                    },
                },
                default: '',
                description: 'Filter accounts by code (partial match)',
            },
            {
                displayName: 'Filter by Name',
                name: 'filterName',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['listAccounts'],
                    },
                },
                default: '',
                description: 'Filter accounts by name (partial match)',
            },
            {
                displayName: 'Filter by Type',
                name: 'filterType',
                type: 'options',
                options: [
                    { name: 'All Types', value: '' },
                    { name: 'Asset', value: 'Asset' },
                    { name: 'Liability', value: 'Liability' },
                    { name: 'Equity', value: 'Equity' },
                    { name: 'Income', value: 'Income' },
                    { name: 'Expense', value: 'Expense' },
                ],
                displayOptions: {
                    show: {
                        action: ['listAccounts'],
                    },
                },
                default: '',
                description: 'Filter accounts by type',
            },
            // Journal Entry Fields
            {
                displayName: 'Entry Date',
                name: 'entryDate',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['createJournalEntry'],
                    },
                },
                default: '',
                description: 'Date of the journal entry (YYYY-MM-DD format)',
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['createJournalEntry', 'searchJournalEntries'],
                    },
                },
                default: '',
                description: 'Description of the journal entry',
            },
            {
                displayName: 'Reference',
                name: 'reference',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['createJournalEntry', 'searchJournalEntries'],
                    },
                },
                default: '',
                description: 'Reference number or code',
            },
            {
                displayName: 'Journal Lines',
                name: 'journalLines',
                type: 'json',
                required: true,
                displayOptions: {
                    show: {
                        action: ['createJournalEntry'],
                    },
                },
                default: '[{"accountId": 1, "debit": 100}, {"accountId": 2, "credit": 100}]',
                description: 'Array of journal lines with accountId and debit/credit amounts',
            },
            // Journal Entry ID Field
            {
                displayName: 'Journal Entry ID',
                name: 'journalEntryId',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        action: ['deleteJournalEntry', 'getJournalEntryById'],
                    },
                },
                default: '',
                description: 'ID of the journal entry',
            },
            // Search Fields
            {
                displayName: 'Start Date',
                name: 'startDate',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['searchJournalEntries', 'getLedger', 'getProfitLoss'],
                    },
                },
                default: '',
                description: 'Start date for filtering (YYYY-MM-DD format)',
            },
            {
                displayName: 'End Date',
                name: 'endDate',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['searchJournalEntries', 'getLedger', 'getProfitLoss'],
                    },
                },
                default: '',
                description: 'End date for filtering (YYYY-MM-DD format)',
            },
            // Reporting Fields
            {
                displayName: 'As Of Date',
                name: 'asOfDate',
                type: 'string',
                displayOptions: {
                    show: {
                        action: ['getTrialBalance', 'getBalanceSheet'],
                    },
                },
                default: '',
                description: 'Date for the report (YYYY-MM-DD format, optional)',
            },
            {
                displayName: 'Account ID for Ledger',
                name: 'ledgerAccountId',
                type: 'number',
                required: true,
                displayOptions: {
                    show: {
                        action: ['getLedger'],
                    },
                },
                default: '',
                description: 'Account ID for the ledger report',
            },
            {
                displayName: 'Include Running Balance',
                name: 'includeRunningBalance',
                type: 'boolean',
                displayOptions: {
                    show: {
                        action: ['getLedger'],
                    },
                },
                default: false,
                description: 'Include running balance in ledger report',
            },
            // Profit Loss requires both dates
            {
                displayName: 'Start Date',
                name: 'plStartDate',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['getProfitLoss'],
                    },
                },
                default: '',
                description: 'Start date for profit and loss report (YYYY-MM-DD format)',
            },
            {
                displayName: 'End Date',
                name: 'plEndDate',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['getProfitLoss'],
                    },
                },
                default: '',
                description: 'End date for profit and loss report (YYYY-MM-DD format)',
            },
            // Close Period Field
            {
                displayName: 'Through Date',
                name: 'throughDate',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        action: ['closePeriod'],
                    },
                },
                default: '',
                description: 'Lock entries through this date (YYYY-MM-DD format)',
            },
        ],
    };
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Get credentials
        const credentials = await this.getCredentials('lojikAccountingApi');
        // Validate credentials
        const validatedCredentials = schemas_1.lojikAccountingCredentialsSchema.parse(credentials);
        // Initialize database connection
        const config = {
            filePath: '', // Will be resolved in connection module
            credentials: validatedCredentials,
        };
        await (0, connection_1.initializeDatabaseConnection)(config);
        for (let i = 0; i < items.length; i++) {
            const action = this.getNodeParameter('action', i);
            let result;
            try {
                switch (action) {
                    case 'createAccount':
                        result = await handleCreateAccount(this, i);
                        break;
                    case 'updateAccount':
                        result = await handleUpdateAccount(this, i);
                        break;
                    case 'getAccountById':
                        result = await handleGetAccountById(this, i);
                        break;
                    case 'listAccounts':
                        result = await handleListAccounts(this, i);
                        break;
                    case 'deleteAccount':
                        result = await handleDeleteAccount(this, i);
                        break;
                    case 'createJournalEntry':
                        result = await handleCreateJournalEntry(this, i);
                        break;
                    case 'deleteJournalEntry':
                        result = await handleDeleteJournalEntry(this, i);
                        break;
                    case 'getJournalEntryById':
                        result = await handleGetJournalEntryById(this, i);
                        break;
                    case 'searchJournalEntries':
                        result = await handleSearchJournalEntries(this, i);
                        break;
                    case 'getTrialBalance':
                        result = await handleGetTrialBalance(this, i);
                        break;
                    case 'getLedger':
                        result = await handleGetLedger(this, i);
                        break;
                    case 'getBalanceSheet':
                        result = await handleGetBalanceSheet(this, i);
                        break;
                    case 'getProfitLoss':
                        result = await handleGetProfitLoss(this, i);
                        break;
                    case 'closePeriod':
                        result = await handleClosePeriod(this, i);
                        break;
                    default:
                        result = {
                            success: false,
                            message: `Unknown action: ${action}`,
                        };
                }
                returnData.push(result);
            }
            catch (error) {
                const errorResult = {
                    success: false,
                    message: 'Action execution failed',
                    details: error instanceof Error ? error.message : error,
                };
                returnData.push(errorResult);
            }
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.LojikAccountingTool = LojikAccountingTool;
module.exports = { LojikAccountingTool };
//# sourceMappingURL=LojikAccountingTool.js.map