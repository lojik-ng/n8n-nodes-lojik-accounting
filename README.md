# Lojik Accounting - n8n Community Tool

A comprehensive accounting tool for n8n that provides double-entry bookkeeping functionality through an AI Agent-accessible Community Tool. Built with TypeScript, SQLite3, and designed for seamless integration with n8n workflows.

## Features

### 🧾 Account Management
- Create, update, and delete accounts
- Chart of accounts with hierarchical structure (parent-child relationships)
- Five account types: Asset, Liability, Equity, Income, Expense
- Account code uniqueness enforcement

### 💰 Journal Entry Management
- Create balanced journal entries with multiple lines
- Automatic debit/credit validation (must balance)
- Journal entry deletion with cascade to lines
- Search entries by date range, reference, or description

### 📊 Financial Reporting
- **Trial Balance**: Summary of all account balances
- **Ledger**: Detailed transaction history for specific accounts
- **Balance Sheet**: Assets, Liabilities, and Equity snapshot
- **Profit & Loss**: Income and Expense analysis for date ranges

### ⚙️ Period Management
- Close accounting periods to prevent modifications
- Lock entries up to a specific date
- Period-based controls for data integrity

## Installation

```bash
npm install n8n-nodes-lojik-accounting
```

## n8n Setup

### 1. Install the Package
Add the package to your n8n installation or use it as a community node.

### 2. Configure Credentials
Create a new credential in n8n with the following settings:

**Credential Type**: Lojik Accounting

**Required Fields**:
- **Database File Name**: `accounting.db` (filename for SQLite database)

**Optional Fields**:
- **Display Date Format**: `yyyy-LL-dd` (Luxon format string)
- **Currency Symbol**: `₦` (symbol for currency display)
- **Timezone**: `UTC+1` (IANA timezone identifier)

### 3. Database Location
The SQLite database file will be created in the tool package directory using the configured filename. For development/testing, you can override the location by setting the `DATABASE_FILE` environment variable to an absolute path.

## Available Actions

### Account Management

#### Create Account
Add a new account to the chart of accounts.

**Input**:
```json
{
  "code": "CASH001",
  "name": "Cash in Hand",
  "type": "Asset",
  "parentId": 1
}
```

**Output**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "CASH001",
    "name": "Cash in Hand",
    "type": "Asset",
    "parentId": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Update Account
Modify an existing account's properties.

#### Get Account by ID
Retrieve a specific account by its ID.

#### List Accounts
Get all accounts with optional filtering by code, name, or type.

#### Delete Account
Remove an account and all its descendants (if no journal entries exist).

### Journal Entry Management

#### Create Journal Entry
Create a new journal entry with balanced debit/credit lines.

**Input**:
```json
{
  "date": "2024-01-15",
  "description": "Cash sale to customer",
  "reference": "INV001",
  "lines": [
    {
      "accountId": 1,
      "debit": 1000
    },
    {
      "accountId": 2,
      "credit": 1000
    }
  ]
}
```

**Validation Rules**:
- At least 2 lines required
- Sum of debits must equal sum of credits
- Each line must have either debit OR credit (not both, not neither)
- All amounts must be non-negative
- All referenced accounts must exist

#### Delete Journal Entry
Remove a journal entry and all its lines.

#### Get Journal Entry by ID
Retrieve a journal entry with all its lines.

#### Search Journal Entries
Find entries by date range, reference, or description.

### Financial Reporting

#### Get Trial Balance
Generate a trial balance showing total debits, credits, and net balance for each account.

**Output**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "accountId": 1,
        "accountCode": "CASH001",
        "accountName": "Cash in Hand",
        "accountType": "Asset",
        "totalDebit": 1000,
        "totalCredit": 0,
        "net": 1000
      }
    ],
    "totalDebits": 1000,
    "totalCredits": 1000,
    "difference": 0
  }
}
```

#### Get Ledger
Generate a detailed transaction history for a specific account.

#### Get Balance Sheet
Generate a balance sheet showing Assets, Liabilities, and Equity.

#### Get Profit & Loss
Generate an income statement for a specified date range.

### Utility Functions

#### Close Period
Lock all entries through a specific date to prevent further modifications.

## Date Handling

All dates use **Luxon** for parsing and formatting:
- Journal entry dates: `YYYY-MM-DD` format (ISO date)
- Timestamps: ISO-8601 format with timezone
- Validation rejects invalid dates

## Error Handling

All actions return a consistent result envelope:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "details": { ... }
}
```

## Database Schema

The tool uses SQLite3 with the following core tables:

```sql
-- Chart of accounts
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
    parent_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries (header)
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,  -- YYYY-MM-DD format
    description TEXT,
    reference TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Journal lines (details)
CREATE TABLE journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0
);

-- Period locks
CREATE TABLE period_locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    through_date TEXT NOT NULL,  -- YYYY-MM-DD format
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Prerequisites
- Node.js 18+ 
- TypeScript
- SQLite3

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd n8n-nodes-lojik-accounting

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Testing
The project includes comprehensive unit and integration tests:

- **Unit Tests**: Service layer functions and validation schemas
- **Integration Tests**: Full action workflows with in-memory SQLite
- **Coverage**: 80%+ target for lines, functions, branches, and statements

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Environment Variables

**For Development/Testing**:
- `DATABASE_FILE`: Override database location (absolute path allowed)

## Architecture

```
src/
├── tool/                 # n8n Community Tool implementation
│   ├── LojikAccountingTool.ts
│   └── LojikAccountingApi.credentials.ts
├── services/             # Business logic
│   ├── accountService.ts
│   ├── journalService.ts
│   └── reportingService.ts
├── db/                   # Database connection and setup
│   └── connection.ts
├── types/                # TypeScript interfaces
│   └── index.ts
├── validation/           # Zod schemas
│   └── schemas.ts
└── index.ts              # Package exports
```

## Technology Stack

- **Runtime**: Node.js 18+ with ECMAScript Modules (ESM)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite3 with better-sqlite3, WAL mode and foreign key constraints
- **Validation**: Zod for input/output validation
- **Date/Time**: Luxon for all date operations
- **Testing**: Jest with ts-jest
- **Build**: TypeScript compiler (tsc)

## Best Practices

### Database Operations
- All SQL uses prepared statements for security
- Transactions wrap multi-write operations
- Foreign key constraints enforced
- WAL mode for better concurrency

### Type Safety
- Strict TypeScript configuration
- Explicit types for all public APIs
- Zod validation for runtime type checking
- No `any` types in production code

### Error Handling
- Consistent error envelope format
- Validation errors include helpful messages
- Database errors are caught and mapped
- No sensitive information in error details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass and coverage remains high
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/lojik/n8n-nodes-lojik-accounting).