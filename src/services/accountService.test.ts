import { createAccount, getAccountById, listAccounts, updateAccount, deleteAccount } from './accountService';
import { createJournalEntry, getJournalEntryById, deleteJournalEntry } from './journalService';
import { getDb } from '../db/connection';

describe('Accounting Services', () => {
  beforeAll(async () => {
    // Set up in-memory database for testing
    process.env.DATABASE_FILE = ':memory:';
  });

  beforeEach(async () => {
    const db = await getDb();
    
    // Create tables
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
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        description TEXT,
        reference TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
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
  });

  afterEach(async () => {
    // Clean up tables
    const db = await getDb();
    await db.exec('DROP TABLE IF EXISTS journal_lines');
    await db.exec('DROP TABLE IF EXISTS journal_entries');
    await db.exec('DROP TABLE IF EXISTS accounts');
  });

  afterAll(async () => {
    // Clean up
    delete process.env.DATABASE_FILE;
  });

  describe('Account Service', () => {
    it('should create an account', async () => {
      const account = await createAccount('1000', 'Cash', 'Asset');
      expect(account).toBeDefined();
      expect(account.code).toBe('1000');
      expect(account.name).toBe('Cash');
      expect(account.type).toBe('Asset');
    });

    it('should get an account by ID', async () => {
      const createdAccount = await createAccount('1001', 'Bank', 'Asset');
      const fetchedAccount = await getAccountById(createdAccount.id);
      expect(fetchedAccount).toBeDefined();
      expect(fetchedAccount?.id).toBe(createdAccount.id);
    });

    it('should list accounts', async () => {
      await createAccount('1002', 'Accounts Receivable', 'Asset');
      await createAccount('2000', 'Accounts Payable', 'Liability');
      
      const accounts = await listAccounts();
      expect(accounts.length).toBeGreaterThanOrEqual(2);
    });

    it('should update an account', async () => {
      const account = await createAccount('1003', 'Inventory', 'Asset');
      const updatedAccount = await updateAccount(account.id, {
        name: 'Updated Inventory',
        type: 'Asset'
      });
      expect(updatedAccount.name).toBe('Updated Inventory');
    });

    it('should delete an account', async () => {
      const account = await createAccount('1004', 'Prepaid Expenses', 'Asset');
      const deletedIds = await deleteAccount(account.id);
      expect(deletedIds).toContain(account.id);
      
      const fetchedAccount = await getAccountById(account.id);
      expect(fetchedAccount).toBeNull();
    });
  });

  describe('Journal Service', () => {
    let accountId1: number;
    let accountId2: number;

    beforeEach(async () => {
      const account1 = await createAccount('1005', 'Test Asset', 'Asset');
      const account2 = await createAccount('2001', 'Test Liability', 'Liability');
      accountId1 = account1.id;
      accountId2 = account2.id;
    });

    it('should create a journal entry', async () => {
      const result = await createJournalEntry(
        '2023-01-01',
        [
          { accountId: accountId1, debit: 100 },
          { accountId: accountId2, credit: 100 }
        ],
        'Test entry',
        'TEST-001'
      );
      
      expect(result.entry).toBeDefined();
      expect(result.lines).toHaveLength(2);
      expect(result.entry.date).toBe('2023-01-01');
      expect(result.entry.description).toBe('Test entry');
      expect(result.entry.reference).toBe('TEST-001');
    });

    it('should get a journal entry by ID', async () => {
      const created = await createJournalEntry(
        '2023-01-02',
        [
          { accountId: accountId1, debit: 50 },
          { accountId: accountId2, credit: 50 }
        ]
      );
      
      const fetched = await getJournalEntryById(created.entry.id);
      expect(fetched).toBeDefined();
      expect(fetched?.entry.id).toBe(created.entry.id);
    });

    it('should delete a journal entry', async () => {
      const created = await createJournalEntry(
        '2023-01-03',
        [
          { accountId: accountId1, debit: 75 },
          { accountId: accountId2, credit: 75 }
        ]
      );
      
      await deleteJournalEntry(created.entry.id);
      const fetched = await getJournalEntryById(created.entry.id);
      expect(fetched).toBeNull();
    });
  });
});