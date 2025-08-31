# n8n-nodes-lojik-accounting

Lojik Accounting is an n8n Community Tool that provides accounting actions backed by SQLite3. It exposes actions the AI Agent can call to manage accounts, post balanced journal entries, and generate core accounting reports.

- Datastore: SQLite3 file inside the tool package (overridable via env `DATABASE_FILE`).
- Dates: Luxon only. Journal `date` stored as `YYYY-MM-DD`; timestamps are ISO strings (UTC).
- Safety: Prepared statements for all inputs; transactions for multi-write operations.
- Result envelope: `{ success: true, data }` or `{ success: false, message, details? }`.

## Install

```bash
npm i n8n-nodes-lojik-accounting
```

## n8n Credentials ("Lojik Accounting")
- `databaseFileName` (required): SQLite file name stored at the tool root (unless overridden).
- `displayDateFormat` (optional): Luxon format string. Default: `yyyy-LL-dd`.
- `currencySymbol` (optional): Default: `₦`.
- `timezone` (optional, IANA): Default: `UTC+1`.

Env override for local dev/tests:
- `DATABASE_FILE`: Absolute or relative path to a database file. Takes precedence when set.

## Actions

### Accounts
- `createAccount` → `{ code, name, type, parentId? }`
- `updateAccount` → `{ id, code?, name?, type?, parentId? }`
- `getAccountById` → `{ id }`
- `listAccounts` → `{ code?, name?, type? }`
- `deleteAccount` → `{ id }` (rejects when any descendant has journal lines)

### Journal
- `createJournalEntry` → `{ date, description?, reference?, lines: [{ accountId, debit? , credit? }] }`
  - Validations: at least two lines; sum(debit) == sum(credit) > 0; debit/credit positive; per-line either debit or credit (not both/neither)
- `deleteJournalEntry` → `{ id }`
- `getJournalEntryById` → `{ id }`
- `searchJournalEntries` → `{ startDate?, endDate?, reference?, description? }`

### Reporting
- `getTrialBalance` → totals per account: `{ totalDebit, totalCredit, net }`
- `getLedger` → account lines with optional running balance, date range filters
- `getBalanceSheet` → Assets, Liabilities, Equity; includes per-parent-account subtotals
- `getProfitLoss` → Income and Expenses with optional date filters

### Utility
- `getJournalEntryDetails` → alias of `getJournalEntryById`
- `closePeriod` → `{ throughDate }` (rejects future writes on or before this date)
- `getSettings` → returns resolved display settings (date format, currency symbol, timezone)

## Date & Currency Notes
- Luxon is used for all parsing/formatting. Journal dates are plain `YYYY-MM-DD` strings.
- Currency is treated as numbers with two-decimal rounding only at journal entry boundary.
- Display preferences are read from credentials; defaults applied when omitted.

## Database Location
- Default: database file lives at the tool package root using `databaseFileName` from credentials.
- Override: set `DATABASE_FILE` (absolute path allowed). The override takes precedence.

## Development
- ESM (package `type: module`), strict TypeScript, raw SQL with prepared statements.
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm test` (coverage thresholds ≥ 80%)

## Schema (SQLite3)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')),
  parent_id INTEGER NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  description TEXT,
  reference TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  account_id INTEGER NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS period_locks (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  through_date TEXT NOT NULL
);
```

## Error Envelope

```json
{ "success": true, "data": any }
```

```json
{ "success": false, "message": "string", "details": any }
```
