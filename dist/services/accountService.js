"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = createAccount;
exports.updateAccount = updateAccount;
exports.getAccountById = getAccountById;
exports.listAccounts = listAccounts;
exports.deleteAccount = deleteAccount;
const connection_1 = require("../db/connection");
/**
 * Map database row to Account interface
 */
function mapRowToAccount(row) {
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        parentId: row.parent_id,
        createdAt: row.created_at,
    };
}
/**
 * Create a new account
 */
async function createAccount(input) {
    try {
        // Check if account code already exists
        const existingAccount = await (0, connection_1.getQuery)('SELECT id FROM accounts WHERE code = ?', [input.code]);
        if (existingAccount) {
            return {
                success: false,
                message: 'Account code already exists',
                details: { code: input.code },
            };
        }
        // Check if parent exists (if specified)
        if (input.parentId) {
            const parentAccount = await (0, connection_1.getQuery)('SELECT id FROM accounts WHERE id = ?', [input.parentId]);
            if (!parentAccount) {
                return {
                    success: false,
                    message: 'Parent account not found',
                    details: { parentId: input.parentId },
                };
            }
        }
        // Create the account
        const result = await (0, connection_1.runQuery)('INSERT INTO accounts (code, name, type, parent_id) VALUES (?, ?, ?, ?)', [input.code, input.name, input.type, input.parentId || null]);
        // Fetch the created account
        const createdAccount = await (0, connection_1.getQuery)('SELECT * FROM accounts WHERE id = ?', [result.lastInsertRowid]);
        if (!createdAccount) {
            return {
                success: false,
                message: 'Failed to retrieve created account',
            };
        }
        return {
            success: true,
            data: mapRowToAccount(createdAccount),
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to create account',
            details: error instanceof Error ? error.message : error,
        };
    }
}
/**
 * Update an existing account
 */
async function updateAccount(input) {
    try {
        // Check if account exists
        const existingAccount = await (0, connection_1.getQuery)('SELECT * FROM accounts WHERE id = ?', [input.id]);
        if (!existingAccount) {
            return {
                success: false,
                message: 'Account not found',
                details: { id: input.id },
            };
        }
        // Check if new code conflicts (if code is being updated)
        if (input.code && input.code !== existingAccount.code) {
            const codeExists = await (0, connection_1.getQuery)('SELECT id FROM accounts WHERE code = ? AND id != ?', [input.code, input.id]);
            if (codeExists) {
                return {
                    success: false,
                    message: 'Account code already exists',
                    details: { code: input.code },
                };
            }
        }
        // Check if parent exists (if being updated)
        if (input.parentId !== undefined && input.parentId !== null) {
            const parentAccount = await (0, connection_1.getQuery)('SELECT id FROM accounts WHERE id = ?', [input.parentId]);
            if (!parentAccount) {
                return {
                    success: false,
                    message: 'Parent account not found',
                    details: { parentId: input.parentId },
                };
            }
            // Prevent circular references
            if (input.parentId === input.id) {
                return {
                    success: false,
                    message: 'Account cannot be its own parent',
                };
            }
        }
        // Build update query dynamically
        const updates = [];
        const params = [];
        if (input.code !== undefined) {
            updates.push('code = ?');
            params.push(input.code);
        }
        if (input.name !== undefined) {
            updates.push('name = ?');
            params.push(input.name);
        }
        if (input.type !== undefined) {
            updates.push('type = ?');
            params.push(input.type);
        }
        if (input.parentId !== undefined) {
            updates.push('parent_id = ?');
            params.push(input.parentId);
        }
        if (updates.length === 0) {
            // No updates to make, return current account
            return {
                success: true,
                data: mapRowToAccount(existingAccount),
            };
        }
        params.push(input.id);
        await (0, connection_1.runQuery)(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`, params);
        // Fetch the updated account
        const updatedAccount = await (0, connection_1.getQuery)('SELECT * FROM accounts WHERE id = ?', [input.id]);
        return {
            success: true,
            data: mapRowToAccount(updatedAccount),
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to update account',
            details: error instanceof Error ? error.message : error,
        };
    }
}
/**
 * Get account by ID
 */
async function getAccountById(input) {
    try {
        const account = await (0, connection_1.getQuery)('SELECT * FROM accounts WHERE id = ?', [input.id]);
        if (!account) {
            return {
                success: false,
                message: 'Account not found',
                details: { id: input.id },
            };
        }
        return {
            success: true,
            data: mapRowToAccount(account),
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve account',
            details: error instanceof Error ? error.message : error,
        };
    }
}
/**
 * List accounts with optional filtering
 */
async function listAccounts(input) {
    try {
        let sql = 'SELECT * FROM accounts';
        const params = [];
        const conditions = [];
        if (input.code) {
            conditions.push('code LIKE ?');
            params.push(`%${input.code}%`);
        }
        if (input.name) {
            conditions.push('name LIKE ?');
            params.push(`%${input.name}%`);
        }
        if (input.type) {
            conditions.push('type = ?');
            params.push(input.type);
        }
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY code';
        const accounts = await (0, connection_1.getAllQuery)(sql, params);
        return {
            success: true,
            data: accounts.map(mapRowToAccount),
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to list accounts',
            details: error instanceof Error ? error.message : error,
        };
    }
}
/**
 * Get all descendant account IDs (including the account itself)
 */
async function getDescendantAccountIds(accountId) {
    const descendants = [accountId];
    const queue = [accountId];
    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = await (0, connection_1.getAllQuery)('SELECT id FROM accounts WHERE parent_id = ?', [currentId]);
        for (const child of children) {
            descendants.push(child.id);
            queue.push(child.id);
        }
    }
    return descendants;
}
/**
 * Delete an account and all its descendants
 */
async function deleteAccount(input) {
    try {
        // Check if account exists
        const existingAccount = await (0, connection_1.getQuery)('SELECT id FROM accounts WHERE id = ?', [input.id]);
        if (!existingAccount) {
            return {
                success: false,
                message: 'Account not found',
                details: { id: input.id },
            };
        }
        // Get all descendant accounts
        const descendantIds = await getDescendantAccountIds(input.id);
        // Check if any of the descendants have journal lines
        const hasJournalLines = await (0, connection_1.getQuery)(`SELECT COUNT(*) as count FROM journal_lines WHERE account_id IN (${descendantIds.map(() => '?').join(',')})`, descendantIds);
        if (hasJournalLines && hasJournalLines.count > 0) {
            return {
                success: false,
                message: 'Cannot delete account with associated journal entries',
                details: { accountId: input.id, journalLinesCount: hasJournalLines.count },
            };
        }
        // Delete all descendant accounts (parent will cascade)
        await (0, connection_1.runTransaction)([
            async () => {
                await (0, connection_1.runQuery)('DELETE FROM accounts WHERE id = ?', [input.id]);
            }
        ]);
        return {
            success: true,
            data: { deletedAccountIds: descendantIds },
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to delete account',
            details: error instanceof Error ? error.message : error,
        };
    }
}
//# sourceMappingURL=accountService.js.map