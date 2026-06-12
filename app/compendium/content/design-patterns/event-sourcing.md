---
title: "Event Sourcing"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Event Sourcing.md"
order: 11
---
**Event Sourcing** is an architectural pattern in which state changes are stored as a sequence of events, rather than storing just the current state. Whenever something changes, an event is recorded (typically in an append-only log or event store). The current state can always be reconstructed by replaying these events in order.

* **Intent:** Treat every state change as an immutable event and persist those events. The application state is derived by replaying the events rather than overwriting state in place.
* **How it works:** Instead of having, say, a “users” table that is updated in-place, you have an event log like “UserCreated, UserEmailUpdated, UserDeleted, ...” etc. To get a user’s current state, you start from an initial state (perhaps empty or a base snapshot) and apply each event in sequence. Often, systems will store periodic **snapshots** of state for efficiency, so you don’t always replay from the very start.

**Benefits:**

* **Audit Trail:** Every change is logged, making it possible to know exactly how and when a state arrived at its current form (useful for debugging or auditing).
* **Temporal Querying:** You can reconstruct state at any point in time (time travel debugging, or retroactive calculations).
* **Event Replay:** If a bug is found in how events were handled, you can fix the code and replay events to rebuild correct state.
* **Integration:** The event log can serve as a source of truth to publish events to other systems or services (since events are stored, other subscribers can consume them to keep their own data in sync).
* Pairs naturally with CQRS: The write model is just storing events, and the read model builds projections from those events.

**Example:** Imagine a bank account in an event-sourced system. Instead of storing a balance that gets updated, you store events like “Deposited \$100”, “Withdrew \$30”, “Deposited \$50”. The current balance isn’t stored directly – you calculate it by summing those transactions. If needed, you might store a snapshot like “Balance was \$120 at time T” to avoid replaying years of events every time (then apply recent events after T).

In code pseudo-form:

```typescript
// Event definitions
interface AccountEvent { }
class Deposited implements AccountEvent {
  constructor(public amount: number) {}
}
class Withdrew implements AccountEvent {
  constructor(public amount: number) {}
}

// Event Store (append-only log of events per account)
const eventStore: Record<string, AccountEvent[]> = {};

// Apply events to get state
function getBalance(events: AccountEvent[]): number {
  let balance = 0;
  for (const event of events) {
    if (event instanceof Deposited) balance += event.amount;
    if (event instanceof Withdrew) balance -= event.amount;
  }
  return balance;
}

// Usage
const acctId = "A123";
eventStore[acctId] = [];  // new account event list

// Instead of updating balance, record events:
eventStore[acctId].push(new Deposited(100));
eventStore[acctId].push(new Withdrew(30));
eventStore[acctId].push(new Deposited(50));

// Compute current balance by replaying:
const currentBalance = getBalance(eventStore[acctId]);  // 100 - 30 + 50 = 120
```

This simple example shows how events can represent the source of truth. In a real system, events would be persisted to an event store (which could be a database table or an event streaming platform). Reading the current state might involve replaying events or, in practice, updating a cached state whenever a new event arrives (to avoid full replays).

**Event sourcing vs traditional storage:** In a traditional system, if a user’s email changes, you might execute `UPDATE User SET email = ...`. In an event-sourced system, you would instead append a “UserEmailChanged” event to the log. The current user record is derived by starting from a “UserCreated” event and applying subsequent changes.

**Challenges:** Event sourcing requires thinking in terms of immutable events. It can complicate queries (hence often used with CQRS, where query side has projected views). Also, once events are stored, changing their schema or meaning is tricky (you typically version your events or write migration/compensation events for changes). Debugging might require replays and understanding of many events. Despite these, it is powerful in systems needing an audit log or complex derived state.

Event sourcing is often used in conjunction with CQRS: the write side stores events, and those events are used to update read models (projections). Together, they enable highly scalable and reactive systems, as exemplified in event-driven microservices or domain-driven designs with rich domain events.
