---
title: "Prototype Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Prototype Pattern.md"
order: 19
---
*(Note: Prototype is less commonly used in everyday backend work but worth knowing.)*

The **Prototype** pattern creates new objects by cloning an existing object, known as the prototype. This is handy when object creation is expensive, and you want to copy pre-configured objects. In languages like JavaScript, where objects are inherently prototype-based, this pattern is a native concept. In class-based languages, it involves implementing a cloning interface. The cloned object can then be modified without affecting the original.

* **Intent:** Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.
* **Use Case:** When the cost of creating a new object is high (e.g., setting up a complex object graph), or to avoid subclassing by configuring an initial object and then cloning it to produce new variations.
