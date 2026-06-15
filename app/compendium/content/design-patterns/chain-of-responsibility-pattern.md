---
title: "Chain of Responsibility Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Chain of Responsibility Pattern.md"
order: 4
---
**Chain of Responsibility** passes a request along a chain of handler objects until one of them handles it. Each handler in the chain either handles the request or passes it to the next handler. This pattern decouples senders of a request from receivers, giving more than one object a chance to handle the request without the sender knowing which one will handle it.

* **Intent:** “Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.”
* **Use Cases:**

  * **UI event handling:** e.g., an event bubbles up a chain of GUI components until one handles it.
  * **Logging or processing pipelines:** multiple loggers with different levels (debug, info, error) might form a chain where each either logs or passes it on.
  * **Approval workflows:** an expense report might go through managers in increasing rank order until approved.
  * **Middleware in web servers:** e.g., a chain of HTTP request handlers (authenticator, logger, router) that each get a chance to process/short-circuit or pass the request along. (In fact, many web frameworks implement middleware as a chain-of-responsibility.)

**Example:** Customer support system with escalating tiers of support representatives:

```typescript
// Abstract handler
abstract class SupportHandler {
  protected next?: SupportHandler;
  setNext(handler: SupportHandler): SupportHandler {
    this.next = handler;
    return handler;
  }
  handleIssue(issueLevel: number): void {
    if (this.next) this.next.handleIssue(issueLevel);
    // default behavior: pass along if not handled
  }
}

// Concrete handlers
class Tier1Support extends SupportHandler {
  handleIssue(issueLevel: number): void {
    if (issueLevel <= 1) {
      console.log("Tier1 handled the issue.");
    } else {
      console.log("Tier1 escalates issue.");
      super.handleIssue(issueLevel);
    }
  }
}
class Tier2Support extends SupportHandler {
  handleIssue(issueLevel: number): void {
    if (issueLevel <= 2) {
      console.log("Tier2 resolved the issue.");
    } else {
      console.log("Tier2 escalates issue.");
      super.handleIssue(issueLevel);
    }
  }
}
class Tier3Support extends SupportHandler {
  handleIssue(issueLevel: number): void {
    if (issueLevel <= 3) {
      console.log("Tier3 resolved the issue.");
    } else {
      console.log("Tier3: Issue is too difficult to resolve!");
      super.handleIssue(issueLevel);
    }
  }
}

// Setup chain:
const tier1 = new Tier1Support();
const tier2 = new Tier2Support();
const tier3 = new Tier3Support();
tier1.setNext(tier2).setNext(tier3);

// Example scenarios:
tier1.handleIssue(2);
// Output:
// Tier1 escalates issue.
// Tier2 resolved the issue.

tier1.handleIssue(3);
// Output:
// Tier1 escalates issue.
// Tier2 escalates issue.
// Tier3 resolved the issue.
```

In this code, we set up a chain: Tier1 -&gt; Tier2 -&gt; Tier3. The `handleIssue` method in each tier decides if it can handle the issue based on `issueLevel`. If not, it calls `super.handleIssue(issueLevel)` which forwards to the next in chain. The client simply calls `tier1.handleIssue(...)` and doesn’t need to know the details of escalation. The request travels through the chain until someone handles it (or the chain ends).

The Chain of Responsibility pattern reduces coupling by **avoiding explicit if/switch logic mapping requests to handlers**; new handlers can be added easily without modifying senders. It also allows multiple handlers to attempt processing, which can add flexibility (e.g., multiple logging handlers all get a shot). One thing to watch out for is that if no handler handles the request, it might fall off the end of the chain silently  -  so sometimes a default handler at the end is added.
