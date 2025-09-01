import { createAccount, getAccountById, listAccounts } from './dist/services/accountService.js';
import { createJournalEntry, getJournalEntryById } from './dist/services/journalService.js';
import { getTrialBalance } from './dist/services/reportingService.js';
import { getDb } from './dist/db/connection.js';

async function runTest() {
  try {
    // Set up in-memory database for testing
    process.env.DATABASE_FILE = ':memory:';
    
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
    
    console.log('Database initialized successfully');
    
    // Test account creation
    const account1 = await createAccount('1000', 'Cash', 'Asset');
    console.log('Created account:', account1);
    
    const account2 = await createAccount('2000', 'Accounts Payable', 'Liability');
    console.log('Created account:', account2);
    
    // Test account retrieval
    const retrievedAccount = await getAccountById(account1.id);
    console.log('Retrieved account:', retrievedAccount);
    
    // Test account listing
    const accounts = await listAccounts();
    console.log('All accounts:', accounts);
    
    // Test journal entry creation
    const journalEntry = await createJournalEntry(
      '2023-01-01',
      [
        { accountId: account1.id, debit: 1000 },
        { accountId: account2.id, credit: 1000 }
      ],
      'Initial investment',
      'INV-001'
    );
    console.log('Created journal entry:', journalEntry);
    
    // Test journal entry retrieval
    const retrievedEntry = await getJournalEntryById(journalEntry.entry.id);
    console.log('Retrieved journal entry:', retrievedEntry);
    
    // Test trial balance
    const trialBalance = await getTrialBalance();
    console.log('Trial balance:', trialBalance);
    
    console.log('All tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    delete process.env.DATABASE_FILE;
  }
}

runTest();