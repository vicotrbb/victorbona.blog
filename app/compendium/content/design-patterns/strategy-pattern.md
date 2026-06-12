---
title: "Strategy Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Strategy Pattern.md"
order: 24
---
**Strategy** defines a family of interchangeable algorithms, encapsulates each one, and makes them interchangeable at runtime. The core idea is to delegate a specific task (algorithm) to a subordinate object (the “strategy”), so that different strategies can be swapped in and out without changing the client code. This pattern promotes flexibility and adherence to the **Open/Closed Principle** (new algorithms can be introduced without modifying existing code) and **Single Responsibility Principle** (separating the algorithm from the context that uses it).

* **Intent:** “Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from the clients that use it.”
* **Use Cases:** Whenever you have multiple ways of doing something and want to choose among them dynamically. Examples: sorting with different comparators, different payment methods in a checkout system, routing strategies in a navigation app (shortest path vs fastest time), or apply different promotional discount strategies in an order system (like percentage off vs buy-one-get-one, etc.). Instead of hardcoding conditional logic for each variant, you use separate strategy classes.

**Example:** Applying different discount strategies on a purchase:

```typescript
// Strategy interface
interface DiscountStrategy {
  applyDiscount(amount: number): number;
}

// Concrete strategies
class NoDiscount implements DiscountStrategy {
  applyDiscount(amount: number): number { 
    return amount;  // no change 
  }
}
class PercentageDiscount implements DiscountStrategy {
  constructor(private percent: number) {}
  applyDiscount(amount: number): number {
    return amount * (1 - this.percent/100);
  }
}
class FixedAmountDiscount implements DiscountStrategy {
  constructor(private discountValue: number) {}
  applyDiscount(amount: number): number {
    return Math.max(0, amount - this.discountValue);
  }
}

// Context class that uses a strategy
class Checkout {
  constructor(private discountStrategy: DiscountStrategy) {}
  calculateTotal(baseAmount: number): number {
    // delegates discount calculation to the strategy
    return this.discountStrategy.applyDiscount(baseAmount);
  }
}

// Usage:
const basePrice = 100;
let order = new Checkout(new NoDiscount());
console.log("Total (no discount):", order.calculateTotal(basePrice));  // 100

order = new Checkout(new PercentageDiscount(10));
console.log("Total (10% off):", order.calculateTotal(basePrice));     // 90

order = new Checkout(new FixedAmountDiscount(15));
console.log("Total ($15 off):", order.calculateTotal(basePrice));     // 85
```

Here, `Checkout` is the context that uses a `DiscountStrategy`. We can easily change the strategy (at runtime or configuration) to alter how discount is applied, without changing `Checkout` or any other logic. The strategies (`NoDiscount`, `PercentageDiscount`, `FixedAmountDiscount`) each encapsulate a single algorithm. This pattern adheres to “program to an interface, not an implementation” by relying on the `DiscountStrategy` interface. It also allows adding new discount types by just creating new strategy classes (closing the context code for modification).

From a design principles standpoint, Strategy pattern usage often correlates with the **Dependency Injection** principle: the strategy is injected into the context (as seen in the `Checkout` constructor). It replaces what might otherwise be many `if/else` or switch statements with polymorphism, leading to cleaner, more maintainable code.

**In functional programming**, you might achieve the same flexibility by passing functions (e.g., pass a discount function as a parameter). This highlights how FP can simplify some patterns – more on that in the section on functional paradigms.

### State Pattern

The **State** pattern allows an object to alter its behavior when its internal state changes, as if the object changes its class at runtime. The pattern encapsulates state-specific logic into separate state classes, and the context object delegates to the current state object for behavior. As state changes, the context switches the state object it uses.

* **Intent:** “Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.”
* **Use Cases:** Modeling state-dependent behavior: e.g., a TCP connection with states `Closed`, `Listening`, `Established` where operations like `open()`, `close()`, `send()` have different effects depending on state. Other examples: a **finite state machine** implementation, workflow with steps, or UI component states (enabled/disabled, etc.). The State pattern avoids large monolithic conditional statements for state-specific behavior by distributing it into state classes.

**Example:** A simple TCP Connection state simulation:

```typescript
// State interface
interface ConnectionState {
  open(conn: Connection): void;
  close(conn: Connection): void;
  send(conn: Connection, data: string): void;
}

// Concrete States:
class ClosedState implements ConnectionState {
  open(conn: Connection): void {
    console.log("Opening connection...");
    conn.setState(new OpenState());
  }
  close(conn: Connection): void {
    console.log("Already closed.");
  }
  send(conn: Connection, data: string): void {
    console.log("Cannot send, connection is closed.");
  }
}
class OpenState implements ConnectionState {
  open(conn: Connection): void {
    console.log("Already open.");
  }
  close(conn: Connection): void {
    console.log("Closing connection...");
    conn.setState(new ClosedState());
  }
  send(conn: Connection, data: string): void {
    console.log(`Sending data: ${data}`);
    // perhaps remain in Open state or transition on send failure
  }
}

// Context:
class Connection {
  private state: ConnectionState;
  constructor() {
    this.state = new ClosedState();  // initial state
  }
  setState(newState: ConnectionState) {
    this.state = newState;
  }
  open()  { this.state.open(this); }
  close() { this.state.close(this); }
  send(data: string) { this.state.send(this, data); }
}

// Usage:
const conn = new Connection();
conn.send("Hello");    // Cannot send, connection is closed.
conn.open();           // Opening connection...
conn.send("Hello");    // Sending data: Hello
conn.close();          // Closing connection...
```

The `Connection` context delegates calls to its current `ConnectionState`. Each state class (`ClosedState`, `OpenState`) implements behaviors appropriate to that state. When a transition occurs (open/close), the context switches its state via `conn.setState(...)`. This setup makes adding new states or transitions straightforward – add a new class implementing `ConnectionState` – and keeps each state's logic localized. Without this pattern, one might use a large `switch` on a state enum inside each method, which can become unwieldy and violate single-responsibility.

The State pattern is related to Strategy in form (both use delegation), but differs in intent: State is about an object changing behavior over time via internal state changes, whereas Strategy is about swapping algorithms explicitly (often by client choice). In practice, they can look similar; sometimes state transitions can even be driven by context methods or external input.
