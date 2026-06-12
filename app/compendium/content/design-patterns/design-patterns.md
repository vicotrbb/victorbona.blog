---
title: "Design patterns"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Design patterns.md"
order: 10
---
## Design patterns
* [Adapter Pattern](/compendium/design-patterns/adapter-pattern)
* [Bridge Pattern](/compendium/design-patterns/bridge-pattern)
* [Builder Pattern](/compendium/design-patterns/builder-pattern)
* [Chain of Responsibility Pattern](/compendium/design-patterns/chain-of-responsibility-pattern)
* [Command Pattern](/compendium/design-patterns/command-pattern)
* [Composite Pattern](/compendium/design-patterns/composite-pattern)
* [CQRS (Command Query Responsibility Segregation)](/compendium/design-patterns/cqrs-command-query-responsibility-segregation)
* [Decorator Pattern](/compendium/design-patterns/decorator-pattern)
* [Dependency Injection (and Inversion of Control)](/compendium/design-patterns/dependency-injection-and-inversion-of-control)
* [Event Sourcing](/compendium/design-patterns/event-sourcing)
* [Facade Pattern](/compendium/design-patterns/facade-pattern)
* [Factory Method and Abstract Factory](/compendium/design-patterns/factory-method-and-abstract-factory)
* [Microkernel (Plugin) Architecture](/compendium/design-patterns/microkernel-plugin-architecture)
* [Microservices Architecture](/compendium/design-patterns/microservices-architecture)
* [Model-View-Controller (MVC)](/compendium/design-patterns/model-view-controller-mvc)
* [Observer Pattern](/compendium/design-patterns/observer-pattern)
* [Prototype Pattern](/compendium/design-patterns/prototype-pattern)
* [Proxy Pattern](/compendium/design-patterns/proxy-pattern)
* [Repository Pattern](/compendium/design-patterns/repository-pattern)
* [Singleton](/compendium/design-patterns/singleton)
* [Strategy Pattern](/compendium/design-patterns/strategy-pattern)
* [Template Method Pattern](/compendium/design-patterns/template-method-pattern)
* [Outbox Pattern](/compendium/design-patterns/outbox-pattern)
* [Saga Pattern for Distributed Transactions](/compendium/design-patterns/saga-pattern-for-distributed-transactions)
## Patterns in Functional Paradigms

Many of the classic design patterns emerged from object-oriented programming. In **functional programming (FP)**, some of these patterns either become simpler or unnecessary due to language features like first-class functions, immutability, and powerful type systems. It's valuable for a well-rounded engineer to understand how similar problems are approached in FP:

* **First-class and Higher-Order Functions:** In FP, you can pass functions as arguments, return them from other functions, and store them in variables. This capability often replaces patterns like **Strategy** or **Command**. For example, instead of having a `DiscountStrategy` interface with multiple classes, you could have a dictionary of functions (or just pass a different function to apply discount). The effect is the same: behavior is parameterized, but with less boilerplate. **Example:** In JavaScript/TypeScript, one might do:

  ```js
  const strategies = {
    noDiscount: amount => amount,
    tenPercent: amount => amount * 0.9,
    flat5: amount => Math.max(0, amount - 5)
  };
  // Use a strategy:
  let total = strategies.tenPercent(100);
  ```

  This is a functional take on the Strategy pattern – no classes or interfaces needed, just functions.

* **Functions as Observers:** The Observer pattern can be seen in FP via callback functions or reactive streams. For instance, instead of an object implementing an `update` method, you might register a function to an event stream. Many modern JavaScript implementations use this (e.g., `Array.forEach(callback)` or Node’s EventEmitter where you `on('event', callback)`). These are essentially observer patterns expressed as higher-order functions.

* **Immutability and Pure Functions:** Patterns like **Memento** (capturing state for undo) become trivial if you have immutable data structures – you can just keep the old copy as the memento. Similarly, **Command** in FP might just be representing an operation as a function or closure, which naturally can be stored or passed around (for undo, one might store the inverse function too).

* **No need for Singleton:** In FP, if something is meant to be a single instance, you can just create it as a module or a constant. Since pure functions have no state, the concept of limiting instances is less relevant except for external resources (which can be handled by scope).

* **Monads and other FP patterns:** Functional programming has its own idioms which some call "design patterns of FP." For example, a **Monad** can be viewed as a design pattern for wrapping and sequencing computations (for handling things like null/undefined (`Maybe` monad instead of Null Object or checks), or asynchronous computations (`Promise` monad), etc.). These abstract a common flow (compute, and if missing value then propagate a none). While monads come from category theory, practically they solve certain recurring problems (like chaining operations that might fail without deeply nested conditionals).

* **Pattern Matching vs. Visitor:** In languages with algebraic data types (ADTs) and pattern matching (like Haskell or Scala), adding new operations to a structure is often done with pattern matching on variants, which can be more straightforward than the Visitor pattern in OO. The Visitor is essentially a workaround for the lack of multiple dispatch in OO languages; FP languages often allow you to simply write functions that deconstruct variants.

* **Recursion and higher-order operations vs. Iterator:** Instead of using an Iterator object to traverse a collection (as in OO iterator pattern), FP favors **higher-order functions** like map, filter, reduce, or recursion. These abstract the iteration pattern so explicitly needing an iterator is rare.

**Table: OOP Pattern vs FP Approach** (a few examples for clarity):

* Strategy (OOP): define interface + classes for each algorithm.
  Strategy (FP): pass function as parameter or choose function from a map/record.

* Command (OOP): encapsulate operation in an object with execute().
  Command (FP): use a closure or function that captures the needed context (for undo, maybe return a function that performs the inverse).

* Observer (OOP): objects register as listeners, subject calls update on them.
  Observer (FP): callbacks registered, or use reactive stream (observables) that functions subscribe to.

* Template Method (OOP): abstract class with method using self-calls to hooks.
  FP approach: higher-order function that takes necessary operation(s) as parameters. (E.g., instead of a base class calling a subclass method, you write a function that accepts another function to fill in the blank.)

* Singleton (OOP): private constructor, global access.
  Singleton (FP): Just a module or a single immutable value (since there's no stateful object creation in the same sense, it's simply not a needed construct).

In summary, functional programming often **replaces object-oriented patterns with language constructs**. Many patterns are about achieving polymorphism, extensibility, or controlling side effects – FP provides alternate mechanisms (first-class functions, immutability, pure functions, and powerful type systems) to address these. However, the underlying problems (like modularizing behavior, handling state, etc.) still exist, so one could say FP has its own patterns (even if they aren't named like GoF).

For a back-end engineer, it’s useful to realize that if you switch to or work with functional languages, you might use fewer classical patterns explicitly, but you will use functional idioms that serve similar purposes. Knowing both perspectives allows choosing the best approach in a multi-paradigm environment (for instance, using a functional style to simplify the implementation of a strategy or command within an otherwise OO codebase).
