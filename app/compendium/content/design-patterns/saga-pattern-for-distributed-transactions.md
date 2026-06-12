---
title: "Saga Pattern for Distributed Transactions"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Saga Pattern for Distributed Transactions.md"
order: 22
---
Distributed systems are allergic to “one big transaction.”

If your workflow spans multiple services *or multiple database shards*, you don’t get the luxury of a single ACID transaction covering everything. The **Saga pattern** is a practical, battle-tested way to coordinate work across boundaries while staying **highly available** and **failure-tolerant**.

A saga gives you a disciplined structure for:
- Splitting a distributed transaction into **local transactions**.
- Advancing progress using **events/commands**.
- Recovering from failure with **compensating actions**.
- Achieving correctness via **eventual consistency** (instead of global atomicity).
## 1) What Problem Sagas Solve

### 1.1 Why “regular transactions” break in distributed systems
A classic database transaction works because:
- All writes happen in one place.
- The DB can lock, validate, and commit atomically.

In microservices and sharded databases:
- Each service/shard owns its data.
- Network calls can fail mid-flight.
- A global lock or two-phase commit (2PC) is slow, brittle, and often avoided.

So the real question becomes:
&gt; How do we build multi-step operations that are correct even when components fail, retry, and run in partial states?

### 1.2 The Saga answer
A **Saga** is a **sequence of local transactions**, one per service/shard.  
Each step **commits locally**. If a later step fails, earlier steps are “undone” via **compensating transactions**.

This replaces “roll back everything atomically” with:
- “Make progress step-by-step”
- “If needed, compensate explicitly”
- “Always be able to resume/retry safely”
## 2) Core Concepts

### 2.1 Local transaction
A transaction that only touches **one** service’s database (or **one** shard).

Example: “Debit User A balance on Shard 3.”

### 2.2 Saga step
A saga step typically includes:
- A local transaction (write to DB)
- Emission of a message/event/command to trigger the next step

### 2.3 Compensating transaction
A compensating transaction is the “undo” action for a completed step.

Important nuance:
- Compensation is often **not a perfect rollback**.
- It’s a domain-level correction (“refund”, “release reservation”, “cancel order”).

### 2.4 Eventual consistency
During a saga, the system may temporarily be inconsistent:
- Money debited but not credited (yet)
- Inventory reserved but order not confirmed (yet)

But the saga guarantees:
- It **eventually completes** successfully, or
- It **eventually compensates** to a valid state
## 3) Two Saga Styles

### 3.1 Choreography (event-driven, decentralized)
There is **no central coordinator**.
Each participant reacts to events and emits new events.

**Pros**
- No single orchestrator to maintain
- Naturally fits event-driven systems

**Cons**
- Harder to trace/understand end-to-end
- Complex when many steps exist
- Business logic becomes “emergent” across services

**Flow sketch**
1. Service A emits `ACompleted`
2. Service B listens and does work, emits `BCompleted`
3. Service C listens and does work, emits `CCompleted`
4. Failures emit `BFailed` etc. which trigger compensations

### 3.2 Orchestration (command-driven, centralized)
A central **Saga Orchestrator** coordinates steps by sending commands.

**Pros**
- Clear flow control in one place
- Easier to reason about and debug
- Explicit state machine

**Cons**
- Orchestrator becomes a critical component
- Still must design for retries/failures

**Flow sketch**
1. Orchestrator -&gt; `DebitAccount`
2. Shard/Service replies -&gt; `DebitSucceeded` or `DebitFailed`
3. Orchestrator -&gt; `CreditAccount`
4. On failure, orchestrator triggers compensations
## 4) Where to Use the Saga Pattern

### Use sagas when
- A business process spans multiple services/shards
- You can define compensations
- Eventual consistency is acceptable
- You need high availability and resilience

**Common domains**
- Payments / Transfers
- Orders (order -&gt; inventory -&gt; payment -&gt; shipping)
- Booking systems (reserve -&gt; confirm)
- Cross-shard operations (transfer between users on different shards)

### Avoid sagas when
- You require strict global atomicity at all times
- Compensations are impossible or unacceptable
- A single DB transaction would suffice (keep it simple)
## 5) Applying Sagas to Sharded Databases

### 5.1 The cross-shard transaction problem
Example: Transfer 10 coins from:
- User A on **Shard 3**
- to User B on **Shard 9**

A single DB transaction cannot span shards (in most shard designs).
So you need a distributed approach.

### 5.2 A typical saga approach (transfer example)
Steps:
1. **Debit A** (Shard 3) – local commit
2. **Credit B** (Shard 9) – local commit
3. Mark transfer as **Completed**

If credit fails:
- **Compensate** by refunding A

### 5.3 Why this works (in practice)
Because you design the workflow so:
- Every step is **idempotent**
- Every message can be **retried**
- Progress is tracked via a **saga state machine**
- Side effects are controlled via **outbox/inbox** patterns
## 6) Design Principles You Must Follow

### 6.1 Idempotency (non-negotiable)
Messages will be redelivered.
Consumers will restart.
You must make each step safe to run multiple times.

**Rule**
- Every command/event handler must be idempotent based on a unique key like `transferId` / `sagaId`.

### 6.2 State machine (explicitly track progress)
Track states like:
- `INIT`
- `DEBITED`
- `CREDITED`
- `COMPLETED`
- `COMPENSATING`
- `COMPENSATED`
- `FAILED`

This state machine belongs either in:
- the orchestrator (orchestration), or
- the participating services (choreography)

### 6.3 Outbox pattern (don’t lose events)
The #1 failure mode in event-driven workflows:
&gt; DB commit succeeds, but publishing the event fails

**Outbox pattern** fixes this:
- Within the same local transaction:
  - write business data
  - write an outbox record
- A publisher reliably reads outbox rows and publishes events

This guarantees: **if the DB commit happened, the event will eventually be published.**

### 6.4 Inbox / de-duplication (avoid double handling)
Store processed message IDs (`transferId`, `eventId`) so duplicates don’t apply twice.

### 6.5 Observability
Without tracing and logs:
- sagas become “distributed ghost stories”

Track:
- sagaId / transferId in every log line
- span tracing across services
- metrics: retries, compensations, time-to-complete
## 7) Implementation Example: Cross-Shard Transfer (Orchestration)

### 7.1 Data model (simplified)

**Transfers table** (central or dedicated “transfer” service DB)
- `transfer_id` (PK)
- `from_user_id`
- `to_user_id`
- `amount`
- `status` (INIT, DEBITED, CREDITED, COMPLETED, COMPENSATING, COMPENSATED, FAILED)
- `created_at`, `updated_at`

**Ledger entries** (per shard)
- `entry_id` (PK)
- `transfer_id` (unique constraint per (transfer_id, type))
- `user_id`
- `type` (DEBIT, CREDIT, REFUND, REVERSAL, etc.)
- `amount`
- `created_at`

**Outbox** (per DB that publishes events)
- `outbox_id` (PK)
- `event_type`
- `payload_json`
- `created_at`
- `published_at` nullable

### 7.2 Orchestrator state machine (pseudo-code)

```ts
// TypeScript-like pseudo-code

enum TransferStatus {
  INIT = "INIT",
  DEBITED = "DEBITED",
  CREDITED = "CREDITED",
  COMPLETED = "COMPLETED",
  COMPENSATING = "COMPENSATING",
  COMPENSATED = "COMPENSATED",
  FAILED = "FAILED",
}

async function startTransfer(transferId: string) {
  // Load transfer
  const t = await transfers.get(transferId);

  if (t.status !== TransferStatus.INIT) return; // idempotent

  // Step 1: Debit A
  await sendCommand("DebitUser", { transferId, userId: t.fromUserId, amount: t.amount });

  // Orchestrator will continue upon receiving DebitSucceeded / DebitFailed
}

async function onDebitSucceeded(evt: { transferId: string }) {
  const t = await transfers.get(evt.transferId);
  if (t.status !== TransferStatus.INIT) return; // idempotent guard

  await transfers.updateStatus(evt.transferId, TransferStatus.DEBITED);

  // Step 2: Credit B
  await sendCommand("CreditUser", { transferId: evt.transferId, userId: t.toUserId, amount: t.amount });
}

async function onCreditSucceeded(evt: { transferId: string }) {
  const t = await transfers.get(evt.transferId);
  if (t.status !== TransferStatus.DEBITED) return;

  await transfers.updateStatus(evt.transferId, TransferStatus.CREDITED);

  // Step 3: Complete
  await transfers.updateStatus(evt.transferId, TransferStatus.COMPLETED);
}

async function onCreditFailed(evt: { transferId: string; reason: string }) {
  const t = await transfers.get(evt.transferId);
  if (t.status !== TransferStatus.DEBITED) return;

  await transfers.updateStatus(evt.transferId, TransferStatus.COMPENSATING);

  // Compensation: refund A
  await sendCommand("RefundUser", { transferId: evt.transferId, userId: t.fromUserId, amount: t.amount });
}

async function onRefundSucceeded(evt: { transferId: string }) {
  const t = await transfers.get(evt.transferId);
  if (t.status !== TransferStatus.COMPENSATING) return;

  await transfers.updateStatus(evt.transferId, TransferStatus.COMPENSATED);
}
```

Key points:

* Each handler checks state and exits if already progressed.
* Retries won’t double-apply because of state guards + idempotency on shards.
### 7.3 Debit/Credit handlers on each shard (idempotent)

Each shard service does a local transaction:

* ensure we haven’t already processed this `transferId`
* write ledger entry
* update balance
* write outbox event

```sql
-- Pseudo SQL (inside a local DB transaction)

-- 1) Idempotency check via unique constraint
-- Ledger has a unique constraint on (transfer_id, type)

INSERT INTO ledger_entries (transfer_id, user_id, type, amount, created_at)
VALUES (:transfer_id, :user_id, 'DEBIT', :amount, now());

-- 2) Apply balance update
UPDATE accounts
SET balance = balance - :amount
WHERE user_id = :user_id
  AND balance >= :amount;

-- If no rows updated -> insufficient funds -> throw error, rollback transaction

-- 3) Write outbox event
INSERT INTO outbox (event_type, payload_json, created_at)
VALUES ('DebitSucceeded', json_build_object('transferId', :transfer_id), now());
```

If the same command is retried:

* the ledger insert fails (unique constraint), so you can treat it as “already done”
* or you check first and return success

### 7.4 Handling “insufficient funds”

Debit step can fail cleanly:

* Saga ends in FAILED (no compensation needed)
* Because nothing else happened
## 8) Implementation Example: Choreography (Event-Driven)

### 8.1 Event flow

1. TransferRequested
2. DebitSucceeded (or DebitFailed)
3. CreditSucceeded (or CreditFailed)
4. RefundSucceeded (if needed)

Each service subscribes to events and emits the next event.

### 8.2 Example (high-level)

* Transfer service emits `TransferRequested`
* Shard A listens:

  * debits
  * emits `DebitSucceeded`
* Shard B listens:

  * credits
  * emits `CreditSucceeded`
* Transfer service listens:

  * marks completed
* On credit failure:

  * Shard B emits `CreditFailed`
  * Shard A listens and refunds
  * emits `RefundSucceeded`

Choreography works well when:

* flows are short and stable
* you have strong observability
* teams agree on event contracts
## 9) Practical Patterns That Pair With Sagas

### 9.1 Saga log / durable state

Store saga progress durably so you can resume after crashes.

### 9.2 Timeouts and dead-letter queues

A saga step might stall:

* message lost
* consumer down
* external dependency degraded

You need:

* step timeouts (e.g., “if no CreditSucceeded within 5 minutes, compensate”)
* dead-letter queues for manual intervention

### 9.3 Reconciliation / repair jobs

Even with good design, weird things happen.
Periodic reconciliation is a superpower:

* find transfers stuck in DEBITED for too long
* re-drive credit
* or compensate

### 9.4 Ledger-based design (especially for money)

For transfers, a ledger is ideal:

* append-only, auditable
* balance derived or updated consistently
* makes recovery and debugging easier
## 10) Testing Strategy (Don’t Skip This)

### 10.1 Unit tests

* state machine transitions
* idempotency logic

### 10.2 Integration tests

Simulate failures:

* credit service down after debit
* duplicate events
* out-of-order delivery
* slow consumers

### 10.3 Chaos / resilience tests

* kill orchestrator mid-saga
* kill shard consumer mid-transaction
* inject network failures

Goal:

* saga still converges to a valid outcome
## 11) “Rules of Thumb” Cheat Sheet

* Prefer a saga when you need cross-service or cross-shard workflows.
* If you can show “PENDING” to users, you’re already 80% saga-compatible.
* Make every step idempotent.
* Use outbox/inbox patterns to avoid lost events and double-processing.
* Track saga state explicitly (state machine).
* Build observability early (trace IDs everywhere).
* Accept that compensation is domain logic, not a perfect rollback.

## 12) Minimal Reference Architecture (Cross-Shard Transfer)

**Components**

* Transfer Orchestrator (or event choreography)
* Shard A “Account Service”
* Shard B “Account Service”
* Message bus (Kafka/NATS/Rabbit/etc.)
* Outbox publisher on each DB
* Optional reconciliation worker

**Data**

* Transfers table (or saga log)
* Ledger entries per shard
* Outbox tables per DB

**Properties**

* No global locks
* No 2PC
* Safe retries
* Eventual correctness
## 13) Final Perspective

Sagas don’t give you global ACID.
They give you something more valuable in distributed systems:

&gt; A controlled, observable, recoverable path through failure.

For cross-shard “transactions” (like user-to-user transfers), the Saga pattern is one of the most practical ways to stay correct without sacrificing availability or building a fragile distributed locking system.

The key is to treat “pending” as a first-class state and build your system so retries and compensation are normal, not exceptional.
