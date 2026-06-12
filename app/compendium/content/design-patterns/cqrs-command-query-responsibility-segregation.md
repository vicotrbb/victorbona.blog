---
title: "CQRS (Command Query Responsibility Segregation)"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/CQRS (Command Query Responsibility Segregation).md"
order: 7
---
**CQRS** is an architectural pattern that separates read operations from write operations of a data store into different models, commands and queries. The term comes from **Command Query Responsibility Segregation**. In a traditional CRUD model, the same data model is used for both updating and querying data. CQRS says: split this into two **separate models** – one for **commands** (writes/updates) and one for **queries** (reads). This allows each side to be optimized and evolved independently (for example, the write side can focus on business logic and ensure consistency, while the read side can be denormalized for fast queries or scaling).

* **Intent:** Divide the responsibilities of reading and writing into separate models or components, to optimize each and avoid one model serving conflicting needs. Writes (commands) mutate state, and reads (queries) fetch state, and by segregating them, you can tackle complex performance and scaling issues more easily.
* **How it works:** The write side handles commands (Create/Update/Delete actions). These commands might result in state changes, often producing events. The read side handles queries and may have a read-optimized schema (possibly a separate database or read replica) that is kept up-to-date (often via the events from the write side). The read model is *often* eventually consistent with the write model, meaning there’s a slight delay as changes propagate.

Key points of CQRS:

* Commands **do not return data** (other than maybe an acknowledgment) – they just change state.
* Queries **do not change state** – they only retrieve data.
* There can be a **synchronization mechanism** (like events or messages) to update the read model when the write model changes.

**Benefits:** Scalability (read load and write load can be scaled independently), optimization (each side uses appropriate data schemas; e.g., normalized for writes vs. denormalized views for reads), and clearer separation of concerns. It also fits well with event-driven designs (often, implementing CQRS involves **Event Sourcing**, discussed next).

**Diagram – CQRS Overview:**

```
        Write Commands          +-----------------+        Query
 UI +-------------------------> | Write Model     | -------------------+
    (e.g., "PlaceOrder")        | (Domain logic & |                     |
                                |  Write DB)      |                     v
                                +-----------------+                +---------+
                                        | (events)                 | Read    |
                                        v                         | Model   |
                                +-----------------+                | (Read   |
                                | Event Stream    |                |  DB)    |
                                +-----------------+                +---------+
                                        |                             ^
                                        | (update/notify read model)   |
                                        v                             |
                                +-----------------+        Query    --+
                                | Read Model      | <------------------+
                                | (optimized for  |   (e.g., "GetOrderDetails")
                                |  queries, Read DB)|
                                +-----------------+
```

*In the ASCII diagram:* The UI sends a **Command** (write request) to the Write Model. The Write side (domain model and DB) processes it and may emit an **event** (or otherwise propagate changes) to update the Read Model’s database. The UI (or another consumer) sends a **Query** to the Read Model (which may be a simpler representation tailored for queries) and gets the result. The segregation is clear: write flow on the left, read flow on the right.

**Practical example:** Consider an online ordering system:

* The **write model** might consist of domain entities like `Order`, and logic to place orders, validate them, etc., writing to an `Orders` table (normalized).
* The **read model** might have a pre-joined or denormalized view of orders with product details and customer info for quick display on a dashboard, stored perhaps in a separate read database or even a different type of storage (like a cache or NoSQL store).
* When a new order is placed (Command), the write model writes to the Orders table and publishes an “OrderPlaced” event. A handler receives that event and updates a read-model view (e.g., inserts a record into an `OrderView` table or updates a cache).
* A UI dashboard query goes to the read model (fast, since it’s precomputed for reads) rather than hitting the complex normalized schema.

CQRS is especially useful in **high-performance, scalable systems** or when the read side and write side have very different requirements (which is often the case in complex domains or high-traffic systems). It does introduce complexity (multiple models and eventual consistency to manage), so it’s often used together with domain-driven design in complex domains, rather than for simple CRUD apps.
