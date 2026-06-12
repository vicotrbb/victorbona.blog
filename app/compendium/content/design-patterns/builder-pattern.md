---
title: "Builder Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Builder Pattern.md"
order: 3
---
The **Builder** pattern separates the construction of a complex object from its representation, allowing step-by-step construction and the ability to vary the product’s internal representation. It is useful when an object has many parts or configuration options, making it impractical to have a complex constructor with numerous parameters. Instead, a builder provides a fluent interface to assemble the object gradually.

* **Intent:** Construct complex objects step by step, and allow the same construction process to create different representations of the object.
* **Use Cases:** When object creation involves a lot of optional parameters or intricate assembly of parts. For example, assembling a complex `Meal` with many optional ingredients, or building a query with various clauses. The Builder can construct the final object in a readable way while ensuring immutability or consistency when complete.

**Example:** Building a “House” object with optional features using a builder:

```typescript
class House {
  rooms: number;
  hasGarage: boolean;
  hasSwimmingPool: boolean;
  // other complex parts...

  constructor(builder: HouseBuilder) {
    // copy all options from builder
    this.rooms = builder.rooms;
    this.hasGarage = builder.hasGarage;
    this.hasSwimmingPool = builder.hasSwimmingPool;
  }
}

// The Builder class
class HouseBuilder {
  rooms: number = 0;
  hasGarage: boolean = false;
  hasSwimmingPool: boolean = false;

  setRooms(count: number): HouseBuilder {
    this.rooms = count;
    return this;
  }
  addGarage(): HouseBuilder {
    this.hasGarage = true;
    return this;
  }
  addSwimmingPool(): HouseBuilder {
    this.hasSwimmingPool = true;
    return this;
  }

  build(): House {
    return new House(this);
  }
}

// Usage:
const myHouse = new HouseBuilder()
                  .setRooms(5)
                  .addGarage()
                  .build();
```

In this pattern, `HouseBuilder` has methods to configure each part of the `House`. Each method returns `this` (the builder) to allow chaining (fluent interface). Finally, `build()` constructs the `House` with the accumulated configuration. This approach makes the code for constructing a complex object more readable and flexible than telescoping constructors (many overloaded constructors) or inconsistent object state. The Builder pattern is especially powerful for creating immutable objects with many optional parameters (as seen in many libraries and frameworks). It exemplifies the principle of separating object **construction** from **representation**, since you could have different builder implementations for the same object (e.g., building a text-based house plan vs. a graphical house representation) using the same steps.
