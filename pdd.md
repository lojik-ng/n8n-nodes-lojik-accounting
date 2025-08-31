# Lojik Accounting

I want an n8n **Community Tool** (the kind that shows up under “AI Agent → Tools”, like *Code*, *Math*, *Browser*).
This must follow the **n8n Community Tool specification** (not the Node/Express node spec).

## n8n-nodes-lojik-accounting

Build a comprehensive accounting tool as an n8n Community Tool. The tool exposes actions the AI Agent can call to manage accounts, post journal entries, and generate reports.

Use SQLite3 as the datastore. The database file name is configured via n8n credentials and the database file resides inside the tool package. If the file does not exist, it must be created on first run.

## Core Requirements

- **Technology Stack:** Node.js, TypeScript, SQLite3.
- **Dependency Management:** Use `npm`.
- **Configuration:**
  - The database file path is resolved at runtime: base directory is the tool package root, and the file name comes from n8n credentials. Allow an optional `DATABASE_FILE` env override for development/testing (absolute path allowed), which takes precedence when set.
  - n8n credentials (suggested name: "Lojik Accounting") must include at least: `databaseFileName` (string). Optional fields: `displayDateFormat` (Luxon format string), `currencySymbol` (string), `timezone` (IANA TZ).
- **Database:** Use SQLite3 with the database file stored inside the tool package using the credential-provided file name. On first run, auto-initialize schema and enable foreign keys (`PRAGMA foreign_keys = ON`).
- - Use SQLite3 database with SQLite3 library.
- - Use a single connection to the SQLite3. Create a module and establish the connection there, then import the module anywhere you need sqlite3 and re-use the connection.
- - use WAL mode
- - use parameterized queries (or prepared statements) for all database operations that involve user input.
- - Enforce foreign key constraints (SQLite3 requires PRAGMA foreign_keys = ON).
- - Use raw SQL (no ORM) with prepared statements for all user inputs. Use transactions for multi-write operations (e.g., creating a journal entry with multiple lines).
- **Date & Time:** Use the `luxon` library for all date/time operations and ISO-8601 formatting.
- **Input Validation:** Use robust validation for all action inputs (e.g., zod or custom). Ensure debits/credits are positive numbers and required fields (name, code, type, date) are not empty.

## Build & Module System

- The entire project should be built using **ECMAScript Modules (ESM)**. Use the `type: "module"` entry in the `package.json` file. This ensures the project uses the modern, official standard for JavaScript modules, supporting features like top-level `await` and providing better interoperability with modern build tools.
- compile TS to dist/ with tsc and publish as an npm package named n8n-nodes-lojik-accounting

## Database Schema (SQLite3)

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
    date TEXT NOT NULL, -- store as ISO-8601 (YYYY-MM-DD)
    description TEXT,
    reference TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    debit NUMERIC DEFAULT 0, -- currency as decimal string/number
    credit NUMERIC DEFAULT 0, -- currency as decimal string/number
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);
```

## Tool Actions (AI Agent callable)

The tool exposes actions. Each action performs the requested operation against the configured SQLite3 database file, and returns a standard result object.

### 🧾 Account Management

- **createAccount** → Add a new account to the chart of accounts.
- **updateAccount** → Rename or reclassify an account.
- **getAccountById** → Fetch one account by ID.
- **listAccounts** → Get all accounts (supports search by `code`, `name`, `type`).
- **deleteAccount** → Delete an account and all its descendant child accounts (cascades via `accounts.parent_id`). Deletion is blocked if any `journal_lines` exist for the account or any of its descendants.

### 💰 Transaction / Journal

- **createJournalEntry** → Create a journal entry (date, description, reference) and its lines in a single transaction.
- **deleteJournalEntry** → Reverse/delete a journal entry and all associated lines (transactional).
- **getJournalEntryById** → Retrieve a single journal entry with its lines.
- **searchJournalEntries** → Search by date range, reference, or description.

### 📊 Reporting

- **getTrialBalance** → Summarize debits and credits by account.
- **getLedger** → All transactions for a single account, filtered by date range (`startDate`, `endDate`).
- **getBalanceSheet** → Assets, Liabilities, Equity (by `accounts.type`).
- **getProfitLoss** → Income and Expenses, filtered by date range.

### ⚙️ Utility

- **getJournalEntryDetails** → Retrieve lines for a specific entry (alias of `getJournalEntryById`).
- **closePeriod** → Lock entries up to a date (enforced by validations on write actions).

## Error Handling

Implement a consistent strategy. All actions must return an object in the format:

```json
{ "success": true, "data": any }
```

or on error:

```json
{ "success": false, "message": "string", "details": any }
```

This includes validation errors, database errors, and any other exceptions.

## Tool Action I/O Contracts

Define input and output schemas (e.g., with zod) for each action. Examples:

- **createAccount(input)**
  - Input: `{ code: string, name: string, type: 'Asset'|'Liability'|'Equity'|'Income'|'Expense', parentId?: number }`
  - Output: `{ success: true, data: Account }`

- **createJournalEntry(input)**
  - Input: `{ date: string (YYYY-MM-DD), description?: string, reference?: string, lines: Array<{ accountId: number, debit?: number, credit?: number }> }`
  - Validation: at least two lines; sum(debit) == sum(credit) > 0; positive amounts only
  - Output: `{ success: true, data: { entry: JournalEntry, lines: JournalLine[] } }`

- **deleteAccount(input)**
  - Input: `{ id: number }`
  - Validation: reject if any `journal_lines` exist for the account or any descendant; otherwise delete the account and its descendants within a transaction
  - Output: `{ success: true, data: { deletedAccountIds: number[] } }`

- **deleteJournalEntry(input)**
  - Input: `{ id: number }`
  - Output: `{ success: true, data: { deleted: true } }`

- Similar explicit schemas for all actions listed above.

## Code Structure and Architecture

Organize the project as an n8n Community Tool:

/src
├── tool/                 # Tool definition and action registration for n8n
├── services/             # Business logic and database operations
├── db/                   # SQLite3 connection and setup (creates credential-named DB file)
├── types/                # TypeScript interfaces and types
├── validation/           # Input schemas (e.g., zod)
└── index.ts              # Export the tool

## TypeScript Interfaces

Define the following TypeScript interfaces and types in the src/types folder to ensure a type-safe codebase:

- Account
- JournalEntry
- JournalLine
- TrialBalanceReport
- LedgerReport
- BalanceSheetReport
- ProfitLossReport

## Tool Documentation

Provide comprehensive documentation for the tool actions. Include:

- Action names, descriptions, and input/output schemas
- How to configure it in n8n
- Notes about date formats (Luxon, ISO-8601) and currency handling
- Database location: inside the tool package; file name comes from n8n credentials (`databaseFileName`).

---

## Testing Requirements

**Implement a robust test suite using Jest.**

- **Unit Tests:** Write unit tests for functions in `src/services` (journal posting, reports, validations).
- **Integration Tests:** Exercise tool actions directly (instantiate the tool and call actions) using a temporary SQLite3 file or in-memory DB where appropriate. Validate success and error paths.
- **Code Coverage:** Strive for high coverage. Ensure transactions and prepared statements are covered.

---

### Implementation Notes

- Use `luxon` for all date parsing/formatting. Store journal entry `date` as `YYYY-MM-DD` in TEXT; store timestamps as ISO strings (`CURRENT_TIMESTAMP` default is acceptable for `created_at`).
- Use prepared statements for all inputs. For multi-line journal entries, wrap in a single transaction.
- Ensure `PRAGMA foreign_keys = ON;` at connection time.
- Resolve the database path relative to the tool root using the `databaseFileName` from n8n credentials. Allow `DATABASE_FILE` to override for tests/dev (absolute path allowed).
- Credential name: “Lojik Accounting”.
- Credential Fields and exact keys: databaseFileName (required), displayDateFormat?, currencySymbol?, timezone?.
- Default values if omitted: displayDateFormat = 'yyyy-LL-dd', currencySymbol = '₦', timezone = 'UTC+1'?
- The DB file should be created in the tool package root by default, with override via DATABASE_FILE (absolute path allowed, takes precedence).
- Set PRAGMA busy_timeout = 10000 in addition to WAL and foreign_keys
- For `closePeriod`, accept { throughDate: 'YYYY-MM-DD' }, store a single lock (global) in a small period_locks table, and reject write actions on or before that date
- Use 2 decimal rounding only at journal entry boundary (sum lines) and store as SQLite NUMERIC; return numbers (not formatted strings).
- No need for multi-currency
- Trial balance: return per-account totals totalDebit, totalCredit, and net (debit minus credit).
- Ledger: sort by date DESC, journal_entry_id DESC, line_id DESC and include running balance only when requested.
- Balance sheet: group strictly by accounts.type into Assets/Liabilities/Equity. Subtotals by parent accounts
- Profit/Loss: include only Income and Expense; filterable by date range.
- Journal lines require at least 2 lines, sum(debit) === sum(credit) > 0, each amount positive. Zero amounts are allowed on a line if the other side is positive but each line must have either debit or credit, not both, not neither
- Account code uniqueness is enforced;
- Testing: coverage thresholds of 80% lines/branches
- Include a README.md documenting actions, I/O schemas, setup in n8n, date/currency notes, and DB location/override.
