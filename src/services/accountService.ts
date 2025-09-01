import { Account, AccountType } from '../types/index.js';
import { getDb } from '../db/connection.js';

/**
 * Create a new account
 */
export async function createAccount(
  code: string,
  name: string,
  type: AccountType,
  parentId: number | null = null
): Promise<Account> {
  const db = await getDb();
  
  // Check if parent account exists (if provided)
  if (parentId !== null) {
    const parentExists = await db.get('SELECT id FROM accounts WHERE id = ?', parentId);
    if (!parentExists) {
      throw new Error(`Parent account with id ${parentId} does not exist`);
    }
  }
  
  // Check if account code is unique
  const existingAccount = await db.get('SELECT id FROM accounts WHERE code = ?', code);
  if (existingAccount) {
    throw new Error(`Account with code ${code} already exists`);
  }
  
  const result = await db.run(
    `INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)`,
    [code, name, type, parentId]
  );
  
  const accountId = result.lastID;
  
  if (!accountId) {
    throw new Error('Failed to create account');
  }
  
  const account = await db.get('SELECT * FROM accounts WHERE id = ?', accountId);
  return account as Account;
}

/**
 * Update an existing account
 */
export async function updateAccount(
  id: number,
  updates: {
    code?: string;
    name?: string;
    type?: AccountType;
    parentId?: number | null;
  }
): Promise<Account> {
  const db = await getDb();
  
  // Check if account exists
  const existingAccount = await db.get('SELECT id FROM accounts WHERE id = ?', id);
  if (!existingAccount) {
    throw new Error(`Account with id ${id} does not exist`);
  }
  
  // Check if parent account exists (if provided)
  if (updates.parentId !== undefined && updates.parentId !== null) {
    const parentExists = await db.get('SELECT id FROM accounts WHERE id = ?', updates.parentId);
    if (!parentExists) {
      throw new Error(`Parent account with id ${updates.parentId} does not exist`);
    }
  }
  
  // Check if new code is unique (if provided)
  if (updates.code) {
    const existingAccountWithCode = await db.get(
      'SELECT id FROM accounts WHERE code = ? AND id != ?',
      [updates.code, id]
    );
    if (existingAccountWithCode) {
      throw new Error(`Account with code ${updates.code} already exists`);
    }
  }
  
  // Build update query
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.code !== undefined) {
    fields.push('code = ?');
    values.push(updates.code);
  }
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  
  if (updates.parentId !== undefined) {
    fields.push('parent_id = ?');
    values.push(updates.parentId);
  }
  
  if (fields.length === 0) {
    throw new Error('No updates provided');
  }
  
  values.push(id);
  
  await db.run(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
  
  const account = await db.get('SELECT * FROM accounts WHERE id = ?', id);
  return account as Account;
}

/**
 * Get account by ID
 */
export async function getAccountById(id: number): Promise<Account | null> {
  const db = await getDb();
  const account = await db.get('SELECT * FROM accounts WHERE id = ?', id);
  return account as Account || null;
}

/**
 * List accounts with optional filtering
 */
export async function listAccounts(
  filter: {
    code?: string;
    name?: string;
    type?: AccountType;
  } = {}
): Promise<Account[]> {
  const db = await getDb();
  
  let query = 'SELECT * FROM accounts WHERE 1=1';
  const params: any[] = [];
  
  if (filter.code) {
    query += ' AND code LIKE ?';
    params.push(`%${filter.code}%`);
  }
  
  if (filter.name) {
    query += ' AND name LIKE ?';
    params.push(`%${filter.name}%`);
  }
  
  if (filter.type) {
    query += ' AND type = ?';
    params.push(filter.type);
  }
  
  query += ' ORDER BY code';
  
  const accounts = await db.all(query, params);
  return accounts as Account[];
}

/**
 * Get all descendant account IDs for an account
 */
export async function getDescendantAccountIds(accountId: number): Promise<number[]> {
  const db = await getDb();
  
  // Recursive CTE to get all descendants
  const query = `
    WITH RECURSIVE descendants AS (
      SELECT id FROM accounts WHERE parent_id = ?
      UNION ALL
      SELECT a.id FROM accounts a JOIN descendants d ON a.parent_id = d.id
    )
    SELECT id FROM descendants
  `;
  
  const rows = await db.all(query, accountId);
  return rows.map((row: any) => row.id);
}

/**
 * Check if an account or any of its descendants has journal lines
 */
export async function hasJournalLines(accountId: number): Promise<boolean> {
  const db = await getDb();
  
  // Get all descendant account IDs
  const descendantIds = await getDescendantAccountIds(accountId);
  const allAccountIds = [accountId, ...descendantIds];
  
  // Check if any journal lines exist for these accounts
  const placeholders = allAccountIds.map(() => '?').join(',');
  const query = `SELECT COUNT(*) as count FROM journal_lines WHERE account_id IN (${placeholders})`;
  
  const result = await db.get(query, allAccountIds);
  return (result as any).count > 0;
}

/**
 * Delete an account and all its descendants
 */
export async function deleteAccount(id: number): Promise<number[]> {
  const db = await getDb();
  
  // Check if account exists
  const existingAccount = await getAccountById(id);
  if (!existingAccount) {
    throw new Error(`Account with id ${id} does not exist`);
  }
  
  // Check if account or any descendants have journal lines
  const hasLines = await hasJournalLines(id);
  if (hasLines) {
    throw new Error('Cannot delete account with journal entries or its descendants');
  }
  
  // Get all descendant account IDs
  const descendantIds = await getDescendantAccountIds(id);
  const allAccountIds = [id, ...descendantIds];
  
  // Delete all accounts in a transaction
  const deletedIds: number[] = [];
  
  for (const accountId of allAccountIds) {
    await db.run('DELETE FROM accounts WHERE id = ?', accountId);
    deletedIds.push(accountId);
  }
  
  return deletedIds;
}