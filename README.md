# Split & Budget Tracker

Backend-only mini app that helps **two friends** split bills, keep budgets accurate for **actual spending**, and track the **IOU** between them — cleanly separating **cash flow**, **budgeted spend**, and **settlements**.

---

## Tech Stack

- **Node.js** with **Express** — backend framework for handling HTTP requests and routing  
- **TypeScript** — type safety and cleaner, more maintainable code  
- **Zod** — schema validation for request payloads and input safety
## How to run the app

**Requirements**
- Node.js 18+ (20+ recommended)
- npm (or pnpm)

**Setup & Dev**
```bash
git clone <your-repo-url>
cd split-budget-tracker
npm install
npm run dev
# API runs at http://localhost:3000 by default
````

**Demo script**

* A `demo.sh` is included **in the repo root**: `split-budget-tracker/demo.sh`.
* Make it executable and run:

```bash
chmod +x ./demo.sh
./demo.sh
```

> The server runs on port **3000 by default**.
>
> If you have `jq` installed, the script pretty-prints JSON and auto-detects the settlement direction/amount.

---

## Example API requests/responses

> Base URL: `http://localhost:3000`
> Fixed users: `"A"` and `"B"`. Currency: **SGD**.

### 0) `POST /reset` — clear all data (dev convenience)

Clears the in-memory journal **and** overwrites `data.json` (file persistence) to an empty state.

```bash
curl -s -X POST http://localhost:3000/reset -H "Content-Type: application/json" -d '{}'
```

**Response**

```json
{ "ok": true }
```

### 1) `GET /users` — both users’ derived state

```bash
curl -s http://localhost:3000/users
```

**Response**

```json
{
  "users": [
    {
      "id": "A",
      "name": "User A",
      "walletBalance": 500,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 0, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 0,
      "payableToOther": 0,
      "netBetweenUsers": 0
    },
    {
      "id": "B",
      "name": "User B",
      "walletBalance": 500,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 0, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 0,
      "payableToOther": 0,
      "netBetweenUsers": 0
    }
  ]
}
```

### 2) `POST /transactions` — record an equal-split bill

```bash
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"paidBy":"A","total":120,"category":"food","note":"Dinner"}'
```

**Response**

```json
{
  "transaction": {
    "id": "tx_abc123",
    "kind": "GROUP_EXPENSE",
    "paidBy": "A",
    "total": 120,
    "category": "food",
    "note": "Dinner",
    "splitEach": 60,
    "timestamp": "2025-09-09T12:34:56.000Z"
  }
}
```

**Then `GET /users`:**

```bash
curl -s http://localhost:3000/users
```

```json
{
  "users": [
    {
      "id": "A",
      "walletBalance": 380,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 60, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 60,
      "payableToOther": 0,
      "netBetweenUsers": 60
    },
    {
      "id": "B",
      "walletBalance": 500,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 60, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 0,
      "payableToOther": 60,
      "netBetweenUsers": -60
    }
  ]
}
```

### 3) `GET /transactions` — list all journal entries

```bash
curl -s http://localhost:3000/transactions
```

**Response**

```json
{
  "transactions": [
    {
      "id": "tx_abc123",
      "kind": "GROUP_EXPENSE",
      "paidBy": "A",
      "total": 120,
      "category": "food",
      "note": "Dinner",
      "splitEach": 60,
      "timestamp": "2025-09-09T12:34:56.000Z"
    }
  ]
}
```

### 4) `POST /settle` — settle outstanding (full or partial)

```bash
curl -s -X POST http://localhost:3000/settle \
  -H "Content-Type: application/json" \
  -d '{"from":"B","to":"A","amount":60}'
```

**Response**

```json
{
  "settlement": {
    "id": "tx_xyz789",
    "from": "B",
    "to": "A",
    "amount": 60,
    "timestamp": "2025-09-09T12:40:00.000Z"
  },
  "capped": false
}
```

**Then `GET /users`:**

```bash
curl -s http://localhost:3000/users
```

```json
{
  "users": [
    {
      "id": "A",
      "walletBalance": 440,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 60, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 0,
      "payableToOther": 0,
      "netBetweenUsers": 0
    },
    {
      "id": "B",
      "walletBalance": 440,
      "monthlyBudget": 500,
      "spentByCategory": { "food": 60, "transport": 0, "groceries": 0, "general": 0 },
      "receivableFromOther": 0,
      "payableToOther": 0,
      "netBetweenUsers": 0
    }
  ]
}
```

**Typical errors**

```json
{ "error": "Direction invalid. Currently B owes A." }
```

```json
{ "error": "Nothing to settle. Net is zero." }
```

```json
{ "error": "Invalid input" }
```

---

## Summary of Approach

### Design decisions

The application is built around the principle that the **journal is the single source of truth**. Every action, whether it is a group expense or a settlement, is appended to this journal. User state is never stored directly; instead, it is always **derived from the journal when needed**. This ensures consistency and avoids drift between transactions and balances.

A key design choice was to maintain a **clear separation of concerns**. The system distinguishes between:
- **Cash flow**: the actual wallet movements (e.g., if A pays $120, their wallet decreases by 120; if B later reimburses A $60, then A’s wallet increases by 60 while B’s decreases by 60).  
- **Budgeted spend**: only the user’s share of the expense counts toward their budget (e.g., a $120 dinner becomes +60 food spend for A and +60 for B).  
- **IOU tracking**: the net amount one user owes the other (e.g., after the dinner, B owes A 60; after settlement, the balance returns to 0).

All money is stored in **cents (integers)** to avoid floating-point rounding issues. Conversion to decimal values only happens at the API response level.  

The app enforces an **equal split only**. In cases where totals are odd (e.g., 101 cents), the extra cent is given to the non-payer so that the payer’s budgeted share remains exactly half of the total.

The API was intentionally kept **small and focused**:  
- `GET /users` to view derived state,  
- `POST /transactions` to add group expenses,  
- `GET /transactions` to list the journal,  
- `POST /settle` to record settlements, and  
- `POST /reset` for development convenience.

Finally, the repository layer provides **file-backed persistence**. The journal is written to `data.json` whenever it changes and loaded again on startup, so data survives server restarts without requiring a database.

---

### Features considered but not implemented

There were two additional features that were considered but not implemented within the scope of this challenge.  

The first is **per-user budget configuration**. This would allow each user to set their own monthly budget via an endpoint such as `POST /users/:id/budget { amount }`. The budget would be stored in cents alongside the journal and displayed in the `GET /users` response. Input validation could be handled with Zod.

The second is a **quick “who owes whom” endpoint**. This could be added as `GET /owe`, returning a simple object like `{ from, to, amount }`. The implementation would reuse the same net calculation already used in `GET /users`, but provide a more streamlined way to query just the IOU state.

---

### Persistence note (for reviewers)

The current `MemoryRepo` **persists to disk by default** and **survives restarts** via `data.json`.
Use `/reset` to clear both the in-memory journal and the file for a clean slate.
