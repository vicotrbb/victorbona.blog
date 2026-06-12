---
title: "Outbox Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Outbox Pattern.md"
order: 18
---
The **Outbox Pattern** is an architectural pattern used to guarantee **reliable, atomic, and consistent publication of events** in distributed systems. Instead of attempting to send external messages within the same transaction that mutates the application's data, the pattern records those messages in a dedicated **outbox table**. A separate process then reads from this outbox and publishes events to message brokers or other services. This avoids the classic dual-write problem and ensures messages are delivered **exactly once or at-least once**, depending on the implementation.

The pattern is especially common in microservice architectures where systems must update a local database and emit events—both of which must succeed without drifting out of sync. By turning the message emission into part of the same local transaction, the outbox pattern brings determinism to an otherwise fragile operation.

* **Intent:** “Provide a reliable mechanism to publish events to external systems by writing them into an outbox table inside the same database transaction as the state change, and then asynchronously dispatch those events to message brokers or other services.”
* **Use Cases:** When a service must update its database and also publish an event (e.g., “OrderCreated”, “InvoicePaid”, “UserRegistered”) reliably. The pattern prevents lost messages, duplicates, and cross-system inconsistencies. It is widely applied in event sourcing, CQRS architectures, microservices, or whenever transactional boundaries do not naturally extend across system boundaries.

---

## **Rationale and the Dual-Write Problem**

A classic distributed failure arises when you:

1. Update your local database
2. Publish a message to Kafka/RabbitMQ/SQS/etc.

These two actions cannot share a single distributed transaction reliably in most architectures. If the database commit succeeds but the event publish fails, the system's state becomes inconsistent. If the publish succeeds but the database commit fails, consumers may process an event about data that doesn’t exist.

The outbox pattern sidesteps coordination entirely:
**Write both the data change and the event to the same database in one atomic transaction.**
External publication happens later and independently.

This transforms the problem from “two writes in two systems” to “one write inside one system,” which databases are built to guarantee.

---

## **How It Works**

When an application performs some business action—say, creating an order—it writes:

1. The **order** itself into `orders`
2. A corresponding **event** into `outbox` (e.g., `{ type: "OrderCreated", payload: {...} }`)

Both writes happen inside a **single ACID transaction**.

A background process (dispatcher) later reads the outbox, publishes the events, and marks them as sent.

Here is a simplified example of an outbox table:

```sql
CREATE TABLE outbox_events (
  id            UUID PRIMARY KEY,
  aggregate_id  UUID NOT NULL,
  type          VARCHAR(255) NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMP NOT NULL,
  sent_at       TIMESTAMP NULL
);
```

---

## **Example Flow (Conceptual)**

Imagine a service responsible for user signup.

### In the HTTP handler (synchronously):

```typescript
await db.transaction(async tx => {
  await tx.insert("users", newUser);

  await tx.insert("outbox_events", {
    id: uuid(),
    type: "UserRegistered",
    payload: { userId: newUser.id, email: newUser.email },
    created_at: new Date()
  });
});
```

### In the dispatcher worker (asynchronously):

```typescript
async function dispatchOutboxEvents() {
  const events = await db.select("outbox_events").where({ sent_at: null }).limit(100);

  for (const event of events) {
    await messageBus.publish(event.type, event.payload);

    await db.update("outbox_events", { sent_at: new Date() })
            .where({ id: event.id });
  }
}
```

The user creation and event writing are atomic.
Event delivery is decoupled but reliable.

---

## **Transactional Guarantees**

The outbox pattern typically provides the following safety properties:

* **Atomicity:** Data change and outbox write happen in one transaction.
* **No Lost Messages:** If the transaction commits, the event is guaranteed to exist.
* **Durability:** Events persist even if the system crashes before dispatch.
* **Retry safety:** Workers can repeatedly try dispatching until it succeeds.
* **Idempotence:** Consumers or bus publishers usually must be idempotent, especially when using at-least-once delivery.

The pattern does *not* guarantee exactly-once delivery by itself. Instead, it ensures the system will never lose an event.

---

## **Implementation Variants**

Different architectural environments implement the outbox in slightly different ways:

### **1. Polling Publisher (Classic)**

A background job polls the outbox table periodically.
Pros: simple, robust
Cons: polling introduces latency (often tens or hundreds of milliseconds)

### **2. Transaction Log-Driven (CDC / Debezium Style)**

Tools like **Debezium**, **Maxwell**, or **Kafka Connect** tail the database log and pick up row inserts automatically.
Pros: minimal app code, near-real-time
Cons: requires CDC infrastructure

### **3. Event Relay via DB Triggers**

A trigger writes directly into a queue or auxiliary table.
Pros: eliminates some app logic
Cons: couples DB logic with message semantics

Each variant retains the core idea: events are recorded transactionally with business data.

---

## **Common Use Cases**

The outbox pattern thrives in distributed systems requiring high reliability:

* Order → Payment → Invoice microservices
* Propagating state changes to search indexes (e.g., Elasticsearch)
* Synchronizing write models and read models in CQRS
* Sending email/SMS notifications after a successful mutation
* Integrating with Webhooks
* Replicating changes across boundaries (e.g., ERP → Billing)

Any domain with side effects benefits from this pattern.

---

## **At-Least-Once vs Exactly-Once Semantics**

Outbox typically leads to **at-least-once** delivery:

* Events will never be lost.
* They may be sent twice.

Clients must therefore be **idempotent**.
For example: attempting to charge the same invoice twice should detect duplication.

More complex setups (e.g., Kafka transactional producers) can approximate **exactly-once**, but this requires engineering beyond the basic pattern.

---

## **Performance Considerations**

Large systems must handle outbox at scale:

* **Batch reads** (e.g., fetch 500 events per sweep)
* **Pagination via primary keys** to avoid skipping rows
* **Indexing**

```sql
CREATE INDEX idx_outbox_not_sent ON outbox_events (sent_at) WHERE sent_at IS NULL;
```

* **Cleanup strategies**: delete rows older than N days or archive them
* **Concurrency:** multiple workers can consume outbox events if partitioned by ID ranges

Outbox tables can grow quickly without pruning, so maintenance strategies are important.

---

## **Schema Evolution Concerns**

Because event payloads live as **immutable historical records**, schema changes must be handled gracefully:

* Use JSON instead of rigid columns
* Version events (`type = "OrderCreated:v2"`)
* Keep backward compatibility in consumers

The outbox becomes a de facto timeline of facts—treat it like a ledger.

---

## **Example End-to-End Scenario**

A new order is submitted:

1. The `orders` table inserts the new order.
2. The same transaction records an `OrderCreated` event in `outbox_events`.
3. The transaction commits.
4. A dispatcher sees unsent events and publishes the event to Kafka.
5. Consumers process the order event and update their systems.
6. Dispatcher marks event as sent.

If the dispatcher crashes or Kafka becomes unavailable?
No problem—the event is still in the outbox.

If the publish succeeds but marking `sent_at` fails?
On retry, the dispatcher might republish the event.
Consumers must be idempotent—but the event is never lost.

---

## **Summary**

The **Outbox Pattern** provides a dependable way to synchronize local state changes and event publication without relying on fragile distributed transactions. By turning event recording into part of a single local transaction, services avoid the dual-write problem and gain robust, replayable, crash-resistant messaging semantics. Whether implemented through polling, CDC, or triggers, the pattern stands as one of the backbone strategies for resilient microservice communication and distributed consistency.

It enables systems to evolve gracefully, integrate cleanly, and recover from failure modes that are otherwise inevitable in distributed architectures.

