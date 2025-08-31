import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

import { LojikAccountingTool } from '../../tool/tool.js';
import type { LojikCredentials } from '../../tool/tool.js';

export class LojikAccounting implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Lojik Accounting',
        name: 'lojikAccounting',
        icon: 'file:lojikAccounting.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Accounting tool (SQLite3) for managing accounts, journal, and reports',
        defaults: {
            name: 'Lojik Accounting',
        },
        inputs: ['main'] as any,
        outputs: ['main'] as any,
        credentials: [
            {
                name: 'lojikAccountingApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Account',
                        value: 'account',
                    },
                    {
                        name: 'Journal',
                        value: 'journal',
                    },
                    {
                        name: 'Report',
                        value: 'report',
                    },
                    {
                        name: 'Utility',
                        value: 'utility',
                    },
                ],
                default: 'account',
            },
            // Account operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['account'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a new account',
                        action: 'Create an account',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update an existing account',
                        action: 'Update an account',
                    },
                    {
                        name: 'Get',
                        value: 'get',
                        description: 'Get an account by ID',
                        action: 'Get an account',
                    },
                    {
                        name: 'List',
                        value: 'list',
                        description: 'List accounts',
                        action: 'List accounts',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete an account',
                        action: 'Delete an account',
                    },
                ],
                default: 'create',
            },
            // Journal operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['journal'],
                    },
                },
                options: [
                    {
                        name: 'Create Entry',
                        value: 'createEntry',
                        description: 'Create a new journal entry',
                        action: 'Create a journal entry',
                    },
                    {
                        name: 'Delete Entry',
                        value: 'deleteEntry',
                        description: 'Delete a journal entry',
                        action: 'Delete a journal entry',
                    },
                    {
                        name: 'Get Entry',
                        value: 'getEntry',
                        description: 'Get a journal entry by ID',
                        action: 'Get a journal entry',
                    },
                    {
                        name: 'Search Entries',
                        value: 'searchEntries',
                        description: 'Search journal entries',
                        action: 'Search journal entries',
                    },
                    {
                        name: 'Get Entry Details',
                        value: 'getEntryDetails',
                        description: 'Get detailed journal entry information',
                        action: 'Get journal entry details',
                    },
                ],
                default: 'createEntry',
            },
            // Report operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['report'],
                    },
                },
                options: [
                    {
                        name: 'Trial Balance',
                        value: 'trialBalance',
                        description: 'Get trial balance report',
                        action: 'Get trial balance',
                    },
                    {
                        name: 'Ledger',
                        value: 'ledger',
                        description: 'Get ledger report',
                        action: 'Get ledger',
                    },
                    {
                        name: 'Balance Sheet',
                        value: 'balanceSheet',
                        description: 'Get balance sheet report',
                        action: 'Get balance sheet',
                    },
                    {
                        name: 'Profit & Loss',
                        value: 'profitLoss',
                        description: 'Get profit & loss report',
                        action: 'Get profit & loss',
                    },
                ],
                default: 'trialBalance',
            },
            // Utility operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['utility'],
                    },
                },
                options: [
                    {
                        name: 'Close Period',
                        value: 'closePeriod',
                        description: 'Close an accounting period',
                        action: 'Close period',
                    },
                    {
                        name: 'Get Settings',
                        value: 'getSettings',
                        description: 'Get current settings',
                        action: 'Get settings',
                    },
                ],
                default: 'getSettings',
            },
            // Account parameters
            {
                displayName: 'Account Code',
                name: 'code',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Unique account code',
            },
            {
                displayName: 'Account Name',
                name: 'name',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['create'],
                    },
                },
                default: '',
                required: true,
                description: 'Account name',
            },
            {
                displayName: 'Account Type',
                name: 'type',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['create'],
                    },
                },
                options: [
                    { name: 'Asset', value: 'Asset' },
                    { name: 'Liability', value: 'Liability' },
                    { name: 'Equity', value: 'Equity' },
                    { name: 'Revenue', value: 'Revenue' },
                    { name: 'Expense', value: 'Expense' },
                ],
                default: 'Asset',
                required: true,
                description: 'Type of account',
            },
            {
                displayName: 'Parent Account ID',
                name: 'parentId',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['create'],
                    },
                },
                default: 0,
                description: 'ID of parent account (optional)',
            },
            {
                displayName: 'Account ID',
                name: 'id',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['get', 'update', 'delete'],
                    },
                },
                default: 0,
                required: true,
                description: 'Account ID',
            },
            // Journal parameters
            {
                displayName: 'Entry ID',
                name: 'id',
                type: 'number',
                displayOptions: {
                    show: {
                        resource: ['journal'],
                        operation: ['deleteEntry', 'getEntry', 'getEntryDetails'],
                    },
                },
                default: 0,
                required: true,
                description: 'Journal entry ID',
            },
            {
                displayName: 'Date',
                name: 'date',
                type: 'dateTime',
                displayOptions: {
                    show: {
                        resource: ['journal'],
                        operation: ['createEntry'],
                    },
                },
                default: '',
                required: true,
                description: 'Entry date (YYYY-MM-DD format)',
            },
            {
                displayName: 'Description',
                name: 'description',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['journal'],
                        operation: ['createEntry'],
                    },
                },
                default: '',
                description: 'Entry description',
            },
            {
                displayName: 'Reference',
                name: 'reference',
                type: 'string',
                displayOptions: {
                    show: {
                        resource: ['journal'],
                        operation: ['createEntry'],
                    },
                },
                default: '',
                description: 'Entry reference',
            },
            {
                displayName: 'Journal Lines',
                name: 'lines',
                type: 'collection',
                placeholder: 'Add Line',
                displayOptions: {
                    show: {
                        resource: ['journal'],
                        operation: ['createEntry'],
                    },
                },
                default: {},
                options: [
                    {
                        displayName: 'Account ID',
                        name: 'accountId',
                        type: 'number',
                        default: 0,
                        required: true,
                        description: 'Account ID for this line',
                    },
                    {
                        displayName: 'Debit Amount',
                        name: 'debit',
                        type: 'number',
                        default: 0,
                        description: 'Debit amount (use either debit or credit, not both)',
                    },
                    {
                        displayName: 'Credit Amount',
                        name: 'credit',
                        type: 'number',
                        default: 0,
                        description: 'Credit amount (use either debit or credit, not both)',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('lojikAccountingApi') as LojikCredentials;
        const tool = new LojikAccountingTool(credentials);

        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i) as string;
                const operation = this.getNodeParameter('operation', i) as string;

                let result: any;

                if (resource === 'account') {
                    switch (operation) {
                        case 'create':
                            const createData = {
                                code: this.getNodeParameter('code', i) as string,
                                name: this.getNodeParameter('name', i) as string,
                                type: this.getNodeParameter('type', i) as string,
                                parentId: this.getNodeParameter('parentId', i) as number || undefined,
                            };
                            result = await tool.createAccount(createData);
                            break;
                        case 'update':
                            const updateData = {
                                id: this.getNodeParameter('id', i) as number,
                                code: this.getNodeParameter('code', i, undefined) as string,
                                name: this.getNodeParameter('name', i, undefined) as string,
                                type: this.getNodeParameter('type', i, undefined) as string,
                                parentId: this.getNodeParameter('parentId', i, undefined) as number,
                            };
                            result = await tool.updateAccount(updateData);
                            break;
                        case 'get':
                            result = await tool.getAccountById({ id: this.getNodeParameter('id', i) as number });
                            break;
                        case 'list':
                            result = await tool.listAccounts({});
                            break;
                        case 'delete':
                            result = await tool.deleteAccount({ id: this.getNodeParameter('id', i) as number });
                            break;
                    }
                } else if (resource === 'journal') {
                    switch (operation) {
                        case 'createEntry':
                            const entryData = {
                                date: this.getNodeParameter('date', i) as string,
                                description: this.getNodeParameter('description', i, undefined) as string,
                                reference: this.getNodeParameter('reference', i, undefined) as string,
                                lines: this.getNodeParameter('lines', i) as any[],
                            };
                            result = await tool.createJournalEntry(entryData);
                            break;
                        case 'deleteEntry':
                            result = await tool.deleteJournalEntry({ id: this.getNodeParameter('id', i) as number });
                            break;
                        case 'getEntry':
                            result = await tool.getJournalEntryById({ id: this.getNodeParameter('id', i) as number });
                            break;
                        case 'searchEntries':
                            result = await tool.searchJournalEntries({});
                            break;
                        case 'getEntryDetails':
                            result = await tool.getJournalEntryDetails({ id: this.getNodeParameter('id', i) as number });
                            break;
                    }
                } else if (resource === 'report') {
                    switch (operation) {
                        case 'trialBalance':
                            result = await tool.getTrialBalance();
                            break;
                        case 'ledger':
                            result = await tool.getLedger({});
                            break;
                        case 'balanceSheet':
                            result = await tool.getBalanceSheet();
                            break;
                        case 'profitLoss':
                            result = await tool.getProfitLoss({});
                            break;
                    }
                } else if (resource === 'utility') {
                    switch (operation) {
                        case 'closePeriod':
                            result = await tool.closePeriod({});
                            break;
                        case 'getSettings':
                            result = await tool.getSettings();
                            break;
                    }
                }

                if (result) {
                    returnData.push({ json: result });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message } });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
            }
        }

        return [returnData];
    }
}
