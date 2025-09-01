import {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';

import { DateTime } from 'luxon';

import * as accountService from '../services/accountService.js';
import * as journalService from '../services/journalService.js';
import * as reportingService from '../services/reportingService.js';
import * as utilityService from '../services/utilityService.js';

import {
  createAccountInputSchema,
  updateAccountInputSchema,
  getAccountByIdInputSchema,
  listAccountsInputSchema,
  deleteAccountInputSchema,
  createJournalEntryInputSchema,
  deleteJournalEntryInputSchema,
  getJournalEntryByIdInputSchema,
  searchJournalEntriesInputSchema,
  getLedgerInputSchema,
  getBalanceSheetInputSchema,
  getProfitLossInputSchema,
  closePeriodInputSchema
} from '../validation/schemas.js';

// Initialize database schema
import { getDb } from '../db/connection.js';

// Initialize the database schema
async function initializeSchema() {
  const db = await getDb();
  
  // Create accounts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
      parent_id INTEGER NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `);
  
  // Create journal_entries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT,
      reference TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create journal_lines table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      debit NUMERIC DEFAULT 0,
      credit NUMERIC DEFAULT 0,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
    )
  `);
  
  // Create period_locks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS period_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locked_through_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Helper function to format response
function formatResponse(success: boolean, data?: any, message?: string, details?: any) {
  if (success) {
    return {
      success: true,
      data
    };
  } else {
    return {
      success: false,
      message,
      details
    };
  }
}

export class LojikAccounting implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lojik Accounting',
    name: 'lojikAccounting',
    icon: 'file:lojik.png',
    group: ['transform'],
    version: 1,
    description: 'Manage accounts, journal entries, and generate financial reports',
    defaults: {
      name: 'Lojik Accounting',
    },
    credentials: [
      {
        name: 'lojikAccountingApi',
        required: true,
      },
    ],
    inputs: [],
    outputs: [],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
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
            name: 'Get Account By ID',
            value: 'getAccountById',
            description: 'Fetch one account by ID',
            action: 'Get an account by ID',
          },
          {
            name: 'List Accounts',
            value: 'listAccounts',
            description: 'Get all accounts',
            action: 'List accounts',
          },
          {
            name: 'Delete Account',
            value: 'deleteAccount',
            description: 'Delete an account and all its descendants',
            action: 'Delete an account',
          },
          
          // Journal Entries
          {
            name: 'Create Journal Entry',
            value: 'createJournalEntry',
            description: 'Create a journal entry with its lines',
            action: 'Create a journal entry',
          },
          {
            name: 'Delete Journal Entry',
            value: 'deleteJournalEntry',
            description: 'Delete a journal entry and all associated lines',
            action: 'Delete a journal entry',
          },
          {
            name: 'Get Journal Entry By ID',
            value: 'getJournalEntryById',
            description: 'Retrieve a single journal entry with its lines',
            action: 'Get a journal entry by ID',
          },
          {
            name: 'Search Journal Entries',
            value: 'searchJournalEntries',
            description: 'Search journal entries by date range, reference, or description',
            action: 'Search journal entries',
          },
          
          // Reporting
          {
            name: 'Get Trial Balance',
            value: 'getTrialBalance',
            description: 'Summarize debits and credits by account',
            action: 'Get trial balance',
          },
          {
            name: 'Get Ledger',
            value: 'getLedger',
            description: 'All transactions for a single account',
            action: 'Get ledger',
          },
          {
            name: 'Get Balance Sheet',
            value: 'getBalanceSheet',
            description: 'Assets, Liabilities, Equity',
            action: 'Get balance sheet',
          },
          {
            name: 'Get Profit & Loss',
            value: 'getProfitLoss',
            description: 'Income and Expenses',
            action: 'Get profit and loss',
          },
          
          // Utility
          {
            name: 'Close Period',
            value: 'closePeriod',
            description: 'Lock entries up to a date',
            action: 'Close period',
          },
        ],
        default: 'createAccount',
      },
      
      // Account Management Parameters
      {
        displayName: 'Account Code',
        name: 'accountCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createAccount'],
          },
        },
        default: '',
        description: 'Unique code for the account',
        required: true,
      },
      {
        displayName: 'Account Name',
        name: 'accountName',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createAccount'],
          },
        },
        default: '',
        description: 'Name of the account',
        required: true,
      },
      {
        displayName: 'Account Type',
        name: 'accountType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['createAccount'],
          },
        },
        options: [
          {
            name: 'Asset',
            value: 'Asset',
          },
          {
            name: 'Liability',
            value: 'Liability',
          },
          {
            name: 'Equity',
            value: 'Equity',
          },
          {
            name: 'Income',
            value: 'Income',
          },
          {
            name: 'Expense',
            value: 'Expense',
          },
        ],
        default: 'Asset',
        description: 'Type of the account',
        required: true,
      },
      {
        displayName: 'Parent Account ID',
        name: 'accountParentId',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['createAccount'],
          },
        },
        default: null,
        description: 'ID of the parent account (if any)',
      },
      
      // Update Account Parameters
      {
        displayName: 'Account ID',
        name: 'accountId',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['updateAccount', 'deleteAccount', 'getAccountById', 'getLedger'],
          },
        },
        default: 0,
        description: 'ID of the account',
        required: true,
      },
      {
        displayName: 'Account Code',
        name: 'accountCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['updateAccount'],
          },
        },
        default: '',
        description: 'New code for the account',
      },
      {
        displayName: 'Account Name',
        name: 'accountName',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['updateAccount'],
          },
        },
        default: '',
        description: 'New name for the account',
      },
      {
        displayName: 'Account Type',
        name: 'accountType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['updateAccount'],
          },
        },
        options: [
          {
            name: 'Asset',
            value: 'Asset',
          },
          {
            name: 'Liability',
            value: 'Liability',
          },
          {
            name: 'Equity',
            value: 'Equity',
          },
          {
            name: 'Income',
            value: 'Income',
          },
          {
            name: 'Expense',
            value: 'Expense',
          },
        ],
        default: 'Asset',
        description: 'New type for the account',
      },
      {
        displayName: 'Parent Account ID',
        name: 'accountParentId',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['updateAccount'],
          },
        },
        default: null,
        description: 'New parent account ID (null to remove parent)',
      },
      
      // List Accounts Parameters
      {
        displayName: 'Account Code Filter',
        name: 'accountCodeFilter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['listAccounts'],
          },
        },
        default: '',
        description: 'Filter accounts by code (partial match)',
      },
      {
        displayName: 'Account Name Filter',
        name: 'accountNameFilter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['listAccounts'],
          },
        },
        default: '',
        description: 'Filter accounts by name (partial match)',
      },
      {
        displayName: 'Account Type Filter',
        name: 'accountTypeFilter',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['listAccounts'],
          },
        },
        options: [
          {
            name: 'Asset',
            value: 'Asset',
          },
          {
            name: 'Liability',
            value: 'Liability',
          },
          {
            name: 'Equity',
            value: 'Equity',
          },
          {
            name: 'Income',
            value: 'Income',
          },
          {
            name: 'Expense',
            value: 'Expense',
          },
        ],
        default: '',
        description: 'Filter accounts by type',
      },
      
      // Journal Entry Parameters
      {
        displayName: 'Journal Date',
        name: 'journalDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['createJournalEntry'],
          },
        },
        default: '',
        description: 'Date of the journal entry (YYYY-MM-DD)',
        required: true,
      },
      {
        displayName: 'Journal Description',
        name: 'journalDescription',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createJournalEntry'],
          },
        },
        default: '',
        description: 'Description of the journal entry',
      },
      {
        displayName: 'Journal Reference',
        name: 'journalReference',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createJournalEntry'],
          },
        },
        default: '',
        description: 'Reference for the journal entry',
      },
      {
        displayName: 'Journal Lines',
        name: 'journalLines',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            operation: ['createJournalEntry'],
          },
        },
        default: {},
        description: 'Lines for the journal entry',
        required: true,
        placeholder: 'Add Line',
        options: [
          {
            name: 'line',
            displayName: 'Line',
            values: [
              {
                displayName: 'Account ID',
                name: 'accountId',
                type: 'number',
                default: 0,
                description: 'ID of the account',
                required: true,
              },
              {
                displayName: 'Debit Amount',
                name: 'debit',
                type: 'number',
                default: 0,
                description: 'Debit amount (leave empty if credit)',
              },
              {
                displayName: 'Credit Amount',
                name: 'credit',
                type: 'number',
                default: 0,
                description: 'Credit amount (leave empty if debit)',
              },
            ],
          },
        ],
      },
      
      // Delete Journal Entry Parameters
      {
        displayName: 'Journal Entry ID',
        name: 'journalEntryId',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['deleteJournalEntry', 'getJournalEntryById'],
          },
        },
        default: 0,
        description: 'ID of the journal entry',
        required: true,
      },
      
      // Search Journal Entries Parameters
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['searchJournalEntries', 'getProfitLoss'],
          },
        },
        default: '',
        description: 'Start date for search (YYYY-MM-DD)',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['searchJournalEntries', 'getProfitLoss', 'getBalanceSheet'],
          },
        },
        default: '',
        description: 'End date for search (YYYY-MM-DD)',
      },
      {
        displayName: 'Reference Filter',
        name: 'referenceFilter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchJournalEntries'],
          },
        },
        default: '',
        description: 'Filter by reference (partial match)',
      },
      {
        displayName: 'Description Filter',
        name: 'descriptionFilter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchJournalEntries'],
          },
        },
        default: '',
        description: 'Filter by description (partial match)',
      },
      
      // Get Ledger Parameters
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['getLedger'],
          },
        },
        default: '',
        description: 'Start date for ledger (YYYY-MM-DD)',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['getLedger'],
          },
        },
        default: '',
        description: 'End date for ledger (YYYY-MM-DD)',
      },
      {
        displayName: 'Include Running Balance',
        name: 'includeRunningBalance',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['getLedger'],
          },
        },
        default: false,
        description: 'Whether to include running balance in results',
      },
      
      // Close Period Parameters
      {
        displayName: 'Through Date',
        name: 'throughDate',
        type: 'dateTime',
        displayOptions: {
          show: {
            operation: ['closePeriod'],
          },
        },
        default: '',
        description: 'Lock all entries up to this date (YYYY-MM-DD)',
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Initialize database schema on first run
    await initializeSchema();
    
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0);
    const returnItems: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        let result: any;
        
        switch (operation) {
          // Account Management
          case 'createAccount':
            {
              const code = this.getNodeParameter('accountCode', i) as string;
              const name = this.getNodeParameter('accountName', i) as string;
              const type = this.getNodeParameter('accountType', i) as any;
              const parentId = this.getNodeParameter('accountParentId', i, null) as number | null;
              
              // Validate input
              const validatedInput = createAccountInputSchema.parse({
                code,
                name,
                type,
                parentId
              });
              
              result = await accountService.createAccount(
                validatedInput.code,
                validatedInput.name,
                validatedInput.type,
                validatedInput.parentId
              );
            }
            break;
            
          case 'updateAccount':
            {
              const id = this.getNodeParameter('accountId', i) as number;
              const code = this.getNodeParameter('accountCode', i, undefined) as string | undefined;
              const name = this.getNodeParameter('accountName', i, undefined) as string | undefined;
              const type = this.getNodeParameter('accountType', i, undefined) as any;
              const parentId = this.getNodeParameter('accountParentId', i, undefined) as number | null | undefined;
              
              // Build updates object
              const updates: any = {};
              if (code !== undefined) updates.code = code;
              if (name !== undefined) updates.name = name;
              if (type !== undefined) updates.type = type;
              if (parentId !== undefined) updates.parentId = parentId;
              
              // Validate input
              const validatedInput = updateAccountInputSchema.parse({
                id,
                ...updates
              });
              
              result = await accountService.updateAccount(
                validatedInput.id,
                updates
              );
            }
            break;
            
          case 'getAccountById':
            {
              const id = this.getNodeParameter('accountId', i) as number;
              
              // Validate input
              const validatedInput = getAccountByIdInputSchema.parse({ id });
              
              result = await accountService.getAccountById(validatedInput.id);
              if (!result) {
                throw new Error(`Account with id ${validatedInput.id} not found`);
              }
            }
            break;
            
          case 'listAccounts':
            {
              const code = this.getNodeParameter('accountCodeFilter', i, undefined) as string | undefined;
              const name = this.getNodeParameter('accountNameFilter', i, undefined) as string | undefined;
              const type = this.getNodeParameter('accountTypeFilter', i, undefined) as any;
              
              // Build filter object
              const filter: { code?: string; name?: string; type?: any } = {};
              if (code !== undefined) filter.code = code;
              if (name !== undefined) filter.name = name;
              if (type !== undefined) filter.type = type;
              
              // Remove undefined properties for validation
              const cleanFilter: { code?: string; name?: string; type?: any } = {};
              if (filter.code) cleanFilter.code = filter.code;
              if (filter.name) cleanFilter.name = filter.name;
              if (filter.type) cleanFilter.type = filter.type;
              
              // Validate input
              const validatedInput = listAccountsInputSchema.parse(cleanFilter);
              
              result = await accountService.listAccounts(validatedInput);
            }
            break;
            
          case 'deleteAccount':
            {
              const id = this.getNodeParameter('accountId', i) as number;
              
              // Validate input
              const validatedInput = deleteAccountInputSchema.parse({ id });
              
              const deletedIds = await accountService.deleteAccount(validatedInput.id);
              result = { deletedAccountIds: deletedIds };
            }
            break;
            
          // Journal Entries
          case 'createJournalEntry':
            {
              const date = this.getNodeParameter('journalDate', i) as string;
              const description = this.getNodeParameter('journalDescription', i, undefined) as string | undefined;
              const reference = this.getNodeParameter('journalReference', i, undefined) as string | undefined;
              const lines = this.getNodeParameter('journalLines.line', i, []) as Array<{ accountId: number; debit?: number; credit?: number }>;
              // Ensure lines have proper types
              const typedLines = lines.map(line => ({
                accountId: line.accountId,
                ...(line.debit !== undefined && { debit: line.debit }),
                ...(line.credit !== undefined && { credit: line.credit })
              }));
              
              // Format date to YYYY-MM-DD
              const formattedDate = DateTime.fromISO(date).toFormat('yyyy-MM-dd');
              
              // Validate input
              const validatedInput = createJournalEntryInputSchema.parse({
                date: formattedDate,
                description,
                reference,
                lines
              });
              
              result = await journalService.createJournalEntry(
                validatedInput.date,
                typedLines,
                validatedInput.description || null,
                validatedInput.reference || null
              );
            }
            break;
            
          case 'deleteJournalEntry':
            {
              const id = this.getNodeParameter('journalEntryId', i) as number;
              
              // Validate input
              const validatedInput = deleteJournalEntryInputSchema.parse({ id });
              
              await journalService.deleteJournalEntry(validatedInput.id);
              result = { deleted: true };
            }
            break;
            
          case 'getJournalEntryById':
            {
              const id = this.getNodeParameter('journalEntryId', i) as number;
              
              // Validate input
              const validatedInput = getJournalEntryByIdInputSchema.parse({ id });
              
              result = await journalService.getJournalEntryById(validatedInput.id);
              if (!result) {
                throw new Error(`Journal entry with id ${validatedInput.id} not found`);
              }
            }
            break;
            
          case 'searchJournalEntries':
            {
              const startDate = this.getNodeParameter('startDate', i, undefined) as string | undefined;
              const endDate = this.getNodeParameter('endDate', i, undefined) as string | undefined;
              const reference = this.getNodeParameter('referenceFilter', i, undefined) as string | undefined;
              const description = this.getNodeParameter('descriptionFilter', i, undefined) as string | undefined;
              
              // Format dates to YYYY-MM-DD
              const formattedStartDate = startDate ? DateTime.fromISO(startDate).toFormat('yyyy-MM-dd') : undefined;
              const formattedEndDate = endDate ? DateTime.fromISO(endDate).toFormat('yyyy-MM-dd') : undefined;
              
              // Build filter object
              const filter: { startDate?: string; endDate?: string; reference?: string; description?: string } = {};
              if (formattedStartDate !== undefined) filter.startDate = formattedStartDate;
              if (formattedEndDate !== undefined) filter.endDate = formattedEndDate;
              if (reference !== undefined) filter.reference = reference;
              if (description !== undefined) filter.description = description;
              
              // Remove undefined properties for validation
              const cleanFilter: { startDate?: string; endDate?: string; reference?: string; description?: string } = {};
              if (filter.startDate) cleanFilter.startDate = filter.startDate;
              if (filter.endDate) cleanFilter.endDate = filter.endDate;
              if (filter.reference) cleanFilter.reference = filter.reference;
              if (filter.description) cleanFilter.description = filter.description;
              
              // Validate input
              const validatedInput = searchJournalEntriesInputSchema.parse(cleanFilter);
              
              result = await journalService.searchJournalEntries(validatedInput);
            }
            break;
            
          // Reporting
          case 'getTrialBalance':
            result = await reportingService.getTrialBalance();
            break;
            
          case 'getLedger':
            {
              const accountId = this.getNodeParameter('accountId', i) as number;
              const startDate = this.getNodeParameter('startDate', i, undefined) as string | undefined;
              const endDate = this.getNodeParameter('endDate', i, undefined) as string | undefined;
              const includeRunningBalance = this.getNodeParameter('includeRunningBalance', i, false) as boolean;
              
              // Format dates to YYYY-MM-DD
              const formattedStartDate = startDate ? DateTime.fromISO(startDate).toFormat('yyyy-MM-dd') : undefined;
              const formattedEndDate = endDate ? DateTime.fromISO(endDate).toFormat('yyyy-MM-dd') : undefined;
              
              // Validate input
              const validatedInput = getLedgerInputSchema.parse({
                accountId,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                includeRunningBalance
              });
              
              result = await reportingService.getLedger(
                validatedInput.accountId,
                validatedInput.startDate,
                validatedInput.endDate,
                validatedInput.includeRunningBalance
              );
            }
            break;
            
          case 'getBalanceSheet':
            {
              const date = this.getNodeParameter('endDate', i, undefined) as string | undefined;
              
              // Format date to YYYY-MM-DD
              const formattedDate = date ? DateTime.fromISO(date).toFormat('yyyy-MM-dd') : undefined;
              
              // Validate input
              const validatedInput = getBalanceSheetInputSchema.parse({
                date: formattedDate
              });
              
              result = await reportingService.getBalanceSheet(validatedInput.date);
            }
            break;
            
          case 'getProfitLoss':
            {
              const startDate = this.getNodeParameter('startDate', i, undefined) as string | undefined;
              const endDate = this.getNodeParameter('endDate', i, undefined) as string | undefined;
              
              // Format dates to YYYY-MM-DD
              const formattedStartDate = startDate ? DateTime.fromISO(startDate).toFormat('yyyy-MM-dd') : undefined;
              const formattedEndDate = endDate ? DateTime.fromISO(endDate).toFormat('yyyy-MM-dd') : undefined;
              
              // Validate input
              const validatedInput = getProfitLossInputSchema.parse({
                startDate: formattedStartDate,
                endDate: formattedEndDate
              });
              
              result = await reportingService.getProfitLoss(
                validatedInput.startDate,
                validatedInput.endDate
              );
            }
            break;
            
          // Utility
          case 'closePeriod':
            {
              const throughDate = this.getNodeParameter('throughDate', i) as string;
              
              // Format date to YYYY-MM-DD
              const formattedThroughDate = DateTime.fromISO(throughDate).toFormat('yyyy-MM-dd');
              
              // Validate input
              const validatedInput = closePeriodInputSchema.parse({
                throughDate: formattedThroughDate
              });
              
              await utilityService.closePeriod(validatedInput.throughDate);
              result = { closed: true };
            }
            break;
            
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        
        // Format successful response
        returnItems.push({
          json: formatResponse(true, result),
        });
      } catch (error: any) {
        // Format error response
        returnItems.push({
          json: formatResponse(false, undefined, error.message, {
            operation,
            error: error.stack,
          }),
        });
      }
    }
    
    return [returnItems];
  }
}