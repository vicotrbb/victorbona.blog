---
title: "Facade Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Facade Pattern.md"
order: 12
---
**Facade** provides a unified, simplified interface to a complex subsystem of classes. It hides the complexity of multiple interrelated classes behind a single wrapper interface. This makes the subsystem easier to use for clients by reducing the number of interactions and the need to understand internal details.

* **Intent:** *“Facade is a structural design pattern that provides a simplified interface to a library, a framework, or any other complex set of classes.”*
* **Use Cases:** When you have a complex system (e.g., a library with many classes or a multi-step process) and you want to expose a simpler API to clients. Also useful in layered architectures: a facade can act as an entry-point to each layer. For example, a `VideoConverterFacade` might internally use complex classes for decoding, filtering, encoding video, but present a single method `convertVideo(file, format)` to the user.

**Example:** Facade for an **Order Processing** system:

```typescript
// Subsystem classes:
class InventorySystem {
  checkStock(productId: string): boolean { /* ... */ return true; }
}
class PaymentGateway {
  processPayment(amount: number): boolean { /* ... */ return true; }
}
class ShippingService {
  arrangeShipping(productId: string, address: string): void { /* ... */ }
}

// Facade:
class OrderFacade {
  private inventory = new InventorySystem();
  private payment = new PaymentGateway();
  private shipping = new ShippingService();

  placeOrder(productId: string, quantity: number, paymentInfo: any, shipAddress: string): void {
    if (!this.inventory.checkStock(productId)) {
      console.log("Product out of stock");
      return;
    }
    // Assume price lookup etc.
    const amount = 100 * quantity;
    if (!this.payment.processPayment(amount)) {
      console.log("Payment failed");
      return;
    }
    this.shipping.arrangeShipping(productId, shipAddress);
    console.log("Order placed successfully!");
  }
}

// Client uses the facade:
const orderService = new OrderFacade();
orderService.placeOrder("ABC123", 2, /* payment info */ {}, "123 Elm St.");
```

The client here only interacts with `OrderFacade`. Internally, the facade coordinates the `InventorySystem`, `PaymentGateway`, and `ShippingService` to complete the operation. Without the facade, a client would have to call these components individually in the correct order, manage intermediate results, etc., which complicates client code and increases coupling to subsystem details. Facade simplifies usage and isolates clients from the implementation of the subsystem. Note that the facade doesn’t forbid direct use of subsystem classes if needed; it just offers a convenient shorthand for common operations.
