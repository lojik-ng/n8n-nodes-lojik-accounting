import { z } from 'zod';
export declare const nonEmptyString: z.ZodString;
export declare const isoDateYMD: z.ZodString;
export declare const createAccountInput: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
    }>;
    parentId: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateAccountInput: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
    }>>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export declare const getAccountByIdInput: z.ZodObject<{
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const listAccountsInput: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
    }>>;
}, z.core.$strip>;
export declare const deleteAccountInput: z.ZodObject<{
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const createJournalEntryInput: z.ZodObject<{
    date: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    lines: z.ZodArray<z.ZodObject<{
        accountId: z.ZodNumber;
        debit: z.ZodOptional<z.ZodNumber>;
        credit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const deleteJournalEntryInput: z.ZodObject<{
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const getJournalEntryByIdInput: z.ZodObject<{
    id: z.ZodNumber;
}, z.core.$strip>;
export declare const searchJournalEntriesInput: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getLedgerInput: z.ZodObject<{
    accountId: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    includeRunningBalance: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const closePeriodInput: z.ZodObject<{
    throughDate: z.ZodString;
}, z.core.$strip>;
export type CreateAccountInput = z.infer<typeof createAccountInput>;
export type UpdateAccountInput = z.infer<typeof updateAccountInput>;
export type GetAccountByIdInput = z.infer<typeof getAccountByIdInput>;
export type ListAccountsInput = z.infer<typeof listAccountsInput>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInput>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntryInput>;
export type DeleteJournalEntryInput = z.infer<typeof deleteJournalEntryInput>;
export type GetJournalEntryByIdInput = z.infer<typeof getJournalEntryByIdInput>;
export type SearchJournalEntriesInput = z.infer<typeof searchJournalEntriesInput>;
export type GetLedgerInput = z.infer<typeof getLedgerInput>;
export type ClosePeriodInput = z.infer<typeof closePeriodInput>;
export declare const accountSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
    }>;
    parent_id: z.ZodNullable<z.ZodNumber>;
    created_at: z.ZodString;
}, z.core.$strip>;
export declare const journalEntrySchema: z.ZodObject<{
    id: z.ZodNumber;
    date: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    reference: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, z.core.$strip>;
export declare const journalLineSchema: z.ZodObject<{
    id: z.ZodNumber;
    journal_entry_id: z.ZodNumber;
    account_id: z.ZodNumber;
    debit: z.ZodNumber;
    credit: z.ZodNumber;
}, z.core.$strip>;
export declare const trialBalanceRowSchema: z.ZodObject<{
    account: z.ZodObject<{
        id: z.ZodNumber;
        code: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<{
            Asset: "Asset";
            Liability: "Liability";
            Equity: "Equity";
            Income: "Income";
            Expense: "Expense";
        }>;
        parent_id: z.ZodNullable<z.ZodNumber>;
        created_at: z.ZodString;
    }, z.core.$strip>;
    totalDebit: z.ZodNumber;
    totalCredit: z.ZodNumber;
    net: z.ZodNumber;
}, z.core.$strip>;
export declare const trialBalanceReportSchema: z.ZodObject<{
    rows: z.ZodArray<z.ZodObject<{
        account: z.ZodObject<{
            id: z.ZodNumber;
            code: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<{
                Asset: "Asset";
                Liability: "Liability";
                Equity: "Equity";
                Income: "Income";
                Expense: "Expense";
            }>;
            parent_id: z.ZodNullable<z.ZodNumber>;
            created_at: z.ZodString;
        }, z.core.$strip>;
        totalDebit: z.ZodNumber;
        totalCredit: z.ZodNumber;
        net: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ledgerLineSchema: z.ZodObject<{
    line: z.ZodObject<{
        id: z.ZodNumber;
        journal_entry_id: z.ZodNumber;
        account_id: z.ZodNumber;
        debit: z.ZodNumber;
        credit: z.ZodNumber;
    }, z.core.$strip>;
    entry: z.ZodObject<{
        id: z.ZodNumber;
        date: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        reference: z.ZodNullable<z.ZodString>;
        created_at: z.ZodString;
    }, z.core.$strip>;
    runningBalance: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const ledgerReportSchema: z.ZodObject<{
    account: z.ZodObject<{
        id: z.ZodNumber;
        code: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<{
            Asset: "Asset";
            Liability: "Liability";
            Equity: "Equity";
            Income: "Income";
            Expense: "Expense";
        }>;
        parent_id: z.ZodNullable<z.ZodNumber>;
        created_at: z.ZodString;
    }, z.core.$strip>;
    lines: z.ZodArray<z.ZodObject<{
        line: z.ZodObject<{
            id: z.ZodNumber;
            journal_entry_id: z.ZodNumber;
            account_id: z.ZodNumber;
            debit: z.ZodNumber;
            credit: z.ZodNumber;
        }, z.core.$strip>;
        entry: z.ZodObject<{
            id: z.ZodNumber;
            date: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            reference: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
        }, z.core.$strip>;
        runningBalance: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const balanceGroupSchema: z.ZodObject<{
    type: z.ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
    }>;
    accounts: z.ZodArray<z.ZodObject<{
        account: z.ZodObject<{
            id: z.ZodNumber;
            code: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<{
                Asset: "Asset";
                Liability: "Liability";
                Equity: "Equity";
                Income: "Income";
                Expense: "Expense";
            }>;
            parent_id: z.ZodNullable<z.ZodNumber>;
            created_at: z.ZodString;
        }, z.core.$strip>;
        totalDebit: z.ZodNumber;
        totalCredit: z.ZodNumber;
        net: z.ZodNumber;
    }, z.core.$strip>>;
    parentSubtotals: z.ZodOptional<z.ZodArray<z.ZodObject<{
        parent: z.ZodObject<{
            id: z.ZodNumber;
            code: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<{
                Asset: "Asset";
                Liability: "Liability";
                Equity: "Equity";
                Income: "Income";
                Expense: "Expense";
            }>;
            parent_id: z.ZodNullable<z.ZodNumber>;
            created_at: z.ZodString;
        }, z.core.$strip>;
        totalDebit: z.ZodNumber;
        totalCredit: z.ZodNumber;
        net: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const balanceSheetReportSchema: z.ZodObject<{
    assets: z.ZodObject<{
        type: z.ZodEnum<{
            Asset: "Asset";
            Liability: "Liability";
            Equity: "Equity";
        }>;
        accounts: z.ZodArray<z.ZodObject<{
            account: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>;
        parentSubtotals: z.ZodOptional<z.ZodArray<z.ZodObject<{
            parent: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    liabilities: z.ZodObject<{
        type: z.ZodEnum<{
            Asset: "Asset";
            Liability: "Liability";
            Equity: "Equity";
        }>;
        accounts: z.ZodArray<z.ZodObject<{
            account: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>;
        parentSubtotals: z.ZodOptional<z.ZodArray<z.ZodObject<{
            parent: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    equity: z.ZodObject<{
        type: z.ZodEnum<{
            Asset: "Asset";
            Liability: "Liability";
            Equity: "Equity";
        }>;
        accounts: z.ZodArray<z.ZodObject<{
            account: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>;
        parentSubtotals: z.ZodOptional<z.ZodArray<z.ZodObject<{
            parent: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const profitLossGroupSchema: z.ZodObject<{
    type: z.ZodEnum<{
        Income: "Income";
        Expense: "Expense";
    }>;
    accounts: z.ZodArray<z.ZodObject<{
        account: z.ZodObject<{
            id: z.ZodNumber;
            code: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<{
                Asset: "Asset";
                Liability: "Liability";
                Equity: "Equity";
                Income: "Income";
                Expense: "Expense";
            }>;
            parent_id: z.ZodNullable<z.ZodNumber>;
            created_at: z.ZodString;
        }, z.core.$strip>;
        totalDebit: z.ZodNumber;
        totalCredit: z.ZodNumber;
        net: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const profitLossReportSchema: z.ZodObject<{
    income: z.ZodObject<{
        type: z.ZodEnum<{
            Income: "Income";
            Expense: "Expense";
        }>;
        accounts: z.ZodArray<z.ZodObject<{
            account: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    expenses: z.ZodObject<{
        type: z.ZodEnum<{
            Income: "Income";
            Expense: "Expense";
        }>;
        accounts: z.ZodArray<z.ZodObject<{
            account: z.ZodObject<{
                id: z.ZodNumber;
                code: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<{
                    Asset: "Asset";
                    Liability: "Liability";
                    Equity: "Equity";
                    Income: "Income";
                    Expense: "Expense";
                }>;
                parent_id: z.ZodNullable<z.ZodNumber>;
                created_at: z.ZodString;
            }, z.core.$strip>;
            totalDebit: z.ZodNumber;
            totalCredit: z.ZodNumber;
            net: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    netIncome: z.ZodNumber;
}, z.core.$strip>;
export declare const envelopeOk: <T extends z.ZodTypeAny>(inner: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
}, z.core.$strip>;
export declare const envelopeErr: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;
