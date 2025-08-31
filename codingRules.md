# Coding Rules — Lojik Accounting (n8n Community Tool)

This document is normative for the implementation described in `solution.md`. All contributors must follow these rules. When in doubt, prefer clarity, safety, and testability.

## 1) Technology and Scope

- Node.js LTS (>= 18)
- TypeScript (strict)
- SQLite3 database using the `sqlite3` library (no ORM)
- n8n Community Tool (actions invoked by the AI Agent)

## 2) Project Structure (required)

```text
/src
├── tool/                 # Tool definition and action registration for n8n
├── services/             # Business logic and database operations
├── db/                   # SQLite3 connection and setup (creates credential-named DB file)
├── types/                # TypeScript interfaces and types
├── validation/           # Input schemas (zod)
└── index.ts              # Export the tool
```

## 3) TypeScript Standards

- Enable strict mode and strong typing:
  - "strict": true, "noImplicitAny": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true
- Exported/public APIs must have explicit types.
- Avoid `any` and unsafe casts. Prefer discriminated unions and literal string unions.
- Use meaningful names: verbs for functions, nouns for variables. Avoid abbreviations.
- Prefer early returns and shallow control flow over deep nesting.

## 4) Dates and Time (Luxon only)

- Use Luxon for ALL date/time parsing, validation, and formatting.
- Store `journal_entries.date` as `YYYY-MM-DD` (ISO-8601 date without time).
- Timestamps like `created_at` must use Luxon ISO strings (UTC).
- Validate inputs with Luxon:
  - Parse with `DateTime.fromISO(input, { zone: 'utc' })` for ISO values.
  - Reject invalid dates (`.isValid === false`).
- Never use native `Date` for business logic; only use Luxon.

## 5) Database Rules (sqlite3)

- Single shared connection managed in a dedicated module under `src/db/connection.ts`. Reuse this connection everywhere.
- Database file location:
  - Resolve base directory to the tool package root.
  - The file name must be supplied by n8n credentials as `databaseFileName`.
  - Allow override with env `DATABASE_FILE` for dev/test (absolute path allowed), which takes precedence when set.
- Connection initialization (on first import):
  - `PRAGMA foreign_keys = ON;`
  - `PRAGMA journal_mode = WAL;`
  - `PRAGMA busy_timeout = 10000;`
- Schema creation must be idempotent (`CREATE TABLE IF NOT EXISTS ...`). Use the schema defined in `solution.md` exactly.
- Use raw SQL only. No ORM. Use prepared statements or parameterized queries for ALL inputs.
- Transactions:
  - Wrap multi-write operations (e.g., creating a journal entry and its lines) in a single transaction.
  - On error: rollback. On success: commit.
- Foreign keys must be enforced at connection time (see pragma above).
- Do not interpolate user inputs into SQL strings. Always bind parameters.

- Foreign key delete behavior (must match schema):
  - `accounts.parent_id` → `ON DELETE CASCADE` (deletes child accounts when a parent is deleted)
  - `journal_lines.journal_entry_id` → `ON DELETE CASCADE` (deletes lines when an entry is deleted)
  - `journal_lines.account_id` → `ON DELETE RESTRICT` (blocks account deletion if any lines reference it)
  - Do not cascade `journal_lines` on account deletion; delete referencing journal entries first or reject the deletion.

## 6) Validation Rules (zod)

- Each action must have a zod schema for input and output.
- Enforce the following where applicable:
  - Required fields (`code`, `name`, `type`, `date`, etc.).
  - Account `type` is one of: `Asset | Liability | Equity | Income | Expense`.
  - Monetary values are positive numbers (no negatives). Use zero only if logically allowed.
  - For journal entries: at least two lines; `sum(debit) === sum(credit) > 0`.
  - Dates must be valid Luxon ISO dates with the required format.
  - For account deletion: reject when any `journal_lines` exist for the account or any descendant account.

## 7) Money and Numeric Handling

- Accept numeric inputs as numbers. Internally, prefer precise handling:
  - When doing arithmetic, round to two decimal places only at defined boundaries.
  - Store values in SQLite3 `NUMERIC`. Bind as numbers or decimal strings; never build SQL with string concatenation.
- Never use floating-point string concatenation for SQL. Always use bound parameters.

## 8) Error Handling and Result Envelope

- All actions must return the standard envelope:
  - Success: `{ success: true, data: T }`
  - Error: `{ success: false, message: string, details?: any }`
- Catch and map validation errors, database errors, and unexpected exceptions into the error envelope.
- Include helpful `message` strings; add `details` only when it aids debugging and does not expose secrets.

## 9) Tool Action Conventions

- Action names (camelCase) and scope must match `solution.md`:
  - Accounts: `createAccount`, `updateAccount`, `deleteAccount`, `getAccountById`, `listAccounts`
  - Journal: `createJournalEntry`, `deleteJournalEntry`, `getJournalEntryById`, `searchJournalEntries`
  - Reporting: `getTrialBalance`, `getLedger`, `getBalanceSheet`, `getProfitLoss`
  - Utility: `getJournalEntryDetails`, `closePeriod` (optional)
- Each action flow:
  1) Validate input with zod
  2) Execute DB logic (transactional when needed, prepared statements always)
  3) Map to typed output and return the envelope
  
## 10) Services Layer Guidelines

- Keep SQL in `services/` close to the logic that uses it. Extract helpers where reuse is high.
- Prefer small, composable functions with clear names and explicit inputs/outputs.
- Do not leak raw database rows across service boundaries; map to typed interfaces in `src/types`.

## 11) Types and Interfaces (src/types)

- Define and export interfaces:
  - `Account`, `JournalEntry`, `JournalLine`
  - `TrialBalanceReport`, `LedgerReport`, `BalanceSheetReport`, `ProfitLossReport`
- Use exact string literal unions for account `type`.
- Keep report shapes minimal but sufficient for UI/consumers. Do not overfit to a single view.

## 12) SQL Style

- Uppercase SQL keywords; snake_case table and column names must match the schema in `solution.md`.
- Prefer multi-line SQL strings for readability.
- Use indexes only if proven necessary by queries (acceptable indexes to consider):
  - `journal_lines(journal_entry_id)`
  - `journal_lines(account_id)`
- Do not change core schema columns or constraints without updating `solution.md` first.

## 13) Reporting Rules

- `getTrialBalance`: group by account, return total debits and credits and net balance per account.
- `getLedger`: all lines for a single account within an optional date range.
- `getBalanceSheet`: group by `accounts.type` in Asset/Liability/Equity categories.
- `getProfitLoss`: include only Income and Expense, with optional date filtering.
- All date filtering uses Luxon-normalized `YYYY-MM-DD` boundaries.

## 14) Testing (Jest)

- Unit tests for `services/` and validations.
- Integration tests for tool actions (instantiate the tool, call actions directly).
- Use a temporary SQLite3 file or in-memory DB for tests (override via `DATABASE_FILE`).
- Cover transactions and prepared statements (happy and error paths).
- Aim for high coverage; prioritize correctness of financial logic.

## 15) Linting and Formatting

- ESLint with TypeScript plugin; Prettier for formatting.
- No unused variables, no implicit `any`, no floating promises (await or handle).
- No inline disable comments unless justified; prefer fixing the underlying issue.
- Keep line length reasonable; prefer multi-line constructs over complex one-liners.

## 16) Logging and Diagnostics

- Keep logs minimal in the library/tool; prefer returning useful error envelopes over logging.
- Never log secrets or full SQL statements with bound values.
- For local debugging, guard verbose logs behind an env flag.

## 17) Security and Configuration

- Read database file configuration primarily from n8n credentials (`databaseFileName`).
- Permit `DATABASE_FILE` environment override for local dev/tests; validate and prefer absolute path when provided.
- Do not execute arbitrary SQL or accept raw SQL from inputs.
- Validate all user-provided strings (length, allowed characters) as appropriate.
- Store Display date format and currency symbol in n8n credentials

## 18) Documentation

- Document each action with description and I/O schema.
- Note date formats (Luxon, ISO-8601) and currency handling.
- State database location: inside the tool package; the file name comes from n8n credentials (`databaseFileName`). Mention the `DATABASE_FILE` override for tests/dev.

## 19) Definition of Done

- Code compiles with TypeScript strict mode and passes ESLint/Prettier.
- All unit and integration tests pass locally.
- Actions adhere to validation, transactional guarantees, and error envelope contracts.
- Dates use Luxon exclusively and are stored/returned in the specified formats.
- All SQL uses prepared statements; foreign keys and WAL are enabled.
- All features in @pdd.md are completed.
