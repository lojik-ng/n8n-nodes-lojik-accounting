# Lojik Accounting

An n8n Community Tool for managing accounts, journal entries, and generating financial reports.

## Features

- **Account Management**: Create, update, delete, and list accounts
- **Journal Entries**: Post double-entry journal entries with validation
- **Financial Reporting**: Generate trial balance, ledger, balance sheet, and profit & loss reports
- **Period Management**: Close accounting periods to prevent modifications

## Setup

### Installation

```bash
npm install n8n-nodes-lojik-accounting
```

### Configuration in n8n

1. In n8n, go to **Settings > Community Nodes**
2. Install the `n8n-nodes-lojik-accounting` package
3. Create a new credential of type "Lojik Accounting"
4. Configure the credential with:
   - `databaseFileName`: Name of the SQLite database file (e.g., `accounting.db`)
   - `displayDateFormat`: Optional Luxon format string (default: `yyyy-LL-dd`)
   - `currencySymbol`: Optional currency symbol (default: `₦`)
   - `timezone`: Optional IANA timezone (default: `UTC`)

## Database

The tool uses SQLite3 as its datastore. The database file is stored inside the tool package directory with the name specified in the credentials.

For development/testing, you can override the database file location using the `DATABASE_FILE` environment variable with an absolute path.

## Actions

### Account Management

- **createAccount**: Add a new account to the chart of accounts
- **updateAccount**: Rename or reclassify an account
- **getAccountById**: Fetch one account by ID
- **listAccounts**: Get all accounts with optional filtering
- **deleteAccount**: Delete an account and all its descendants

### Journal Entries

- **createJournalEntry**: Create a journal entry with its lines
- **deleteJournalEntry**: Delete a journal entry and all associated lines
- **getJournalEntryById**: Retrieve a single journal entry with its lines
- **searchJournalEntries**: Search journal entries by date range, reference, or description

### Reporting

- **getTrialBalance**: Summarize debits and credits by account
- **getLedger**: All transactions for a single account
- **getBalanceSheet**: Assets, Liabilities, Equity report
- **getProfitLoss**: Income and Expenses report

### Utility

- **closePeriod**: Lock entries up to a date

## Date Handling

All dates are handled using the Luxon library and stored in ISO-8601 format:
- Journal entry dates: `YYYY-MM-DD`
- Timestamps: ISO strings in UTC

## Validation

The tool uses Zod for input validation:
- Account codes must be unique
- Journal entries must have at least 2 lines
- Total debits must equal total credits
- All amounts must be positive numbers

## Error Handling

All actions return a consistent response format:

```json
// Success
{
  "success": true,
  "data": { /* result data */ }
}

// Error
{
  "success": false,
  "message": "Error description",
  "details": { /* additional error details */ }
}
```