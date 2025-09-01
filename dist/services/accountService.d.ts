import type { Account, ActionResult } from '../types/index';
import type { CreateAccountInput, UpdateAccountInput, GetAccountByIdInput, ListAccountsInput, DeleteAccountInput } from '../validation/schemas';
/**
 * Create a new account
 */
export declare function createAccount(input: CreateAccountInput): Promise<ActionResult<Account>>;
/**
 * Update an existing account
 */
export declare function updateAccount(input: UpdateAccountInput): Promise<ActionResult<Account>>;
/**
 * Get account by ID
 */
export declare function getAccountById(input: GetAccountByIdInput): Promise<ActionResult<Account>>;
/**
 * List accounts with optional filtering
 */
export declare function listAccounts(input: ListAccountsInput): Promise<ActionResult<Account[]>>;
/**
 * Delete an account and all its descendants
 */
export declare function deleteAccount(input: DeleteAccountInput): Promise<ActionResult<{
    deletedAccountIds: number[];
}>>;
//# sourceMappingURL=accountService.d.ts.map