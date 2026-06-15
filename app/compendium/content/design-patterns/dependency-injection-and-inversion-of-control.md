---
title: "Dependency Injection (and Inversion of Control)"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Dependency Injection (and Inversion of Control).md"
order: 9
---
While not a “pattern” in the GoF sense, **Dependency Injection (DI)** is an essential design principle/pattern for modern software construction. It is a technique where an object’s dependencies (its collaborators or required services) are provided to it (injected) from the outside rather than the object constructing them itself. Inversion of Control (IoC) is the broader principle where the control of obtaining dependencies is inverted from the object to an external container or framework.

* **Intent:** Make dependencies explicit and easily swappable by injecting them, leading to looser coupling and more testable code.
* **Explanation:** Instead of a class internally doing `this.repo = new UserRepository()` (which hard-codes a concrete dependency), the class receives a `UserRepository` (often through its constructor or a setter). This way, the class is not responsible for choosing or creating the implementation of the repository  -  that is handled by whoever constructs the class (or by a DI container framework). The class simply expresses a need for something that fulfills a given interface.
* **Use Cases:** Almost all non-trivial applications use DI in some form. For example, in a web controller, you might inject a `Service` layer object. The service might inject a `Repository`. This makes each component more modular. It also allows things like swapping implementations (maybe a mock repository for tests, or a different implementation for a different database).

**Example without DI:**

```typescript
class OrderService {
  private repo: OrderRepository;
  constructor() {
    // directly instantiating dependency (bad for flexibility/testing)
    this.repo = new SqlOrderRepository(); 
  }
  placeOrder(order) {
    // use this.repo...
  }
}
```

Here `OrderService` is tightly coupled to `SqlOrderRepository`. If we want to test `OrderService`, we can’t easily replace the repo with a fake one.

**Example with DI:**

```typescript
class OrderService {
  constructor(private repo: OrderRepository) {
    // repo is injected
  }
  placeOrder(order) {
    // use this.repo to save order
    this.repo.save(order);
  }
}

// Now we can inject a dependency:
const repo = new InMemoryOrderRepository(); // or new SqlOrderRepository();
const service = new OrderService(repo);
service.placeOrder(anOrder);
```

Now `OrderService` depends only on the `OrderRepository` **interface**, not a specific implementation. We inverted the control of choosing the implementation – it’s provided from outside.

**Benefits:**

* **Testability:** We can easily provide mocks or stubs for dependencies in tests, isolating the unit under test.
* **Flexibility:** Swap different implementations (e.g., a different repository if the storage technology changes, or different strategies).
* **No hard-coded dependencies:** This aligns with the **Dependency Inversion Principle (D in SOLID)**, which says high-level modules should not depend on low-level modules directly, but on abstractions.

Often, frameworks provide a DI container that automatically injects dependencies (like Spring in Java, or using decorators/injectors in .NET, or Angular for front-end). But even without a container, you can do manual DI as shown (passing dependencies via constructors or setters).

Dependency Injection itself is more of a **principle** than a formal pattern, but it’s so widely used that it’s considered a core practice in software design. It’s tightly related to patterns like Strategy (injecting different strategies), Template Method (injecting hooks or using inheritance), and others where the goal is decoupling modules.
