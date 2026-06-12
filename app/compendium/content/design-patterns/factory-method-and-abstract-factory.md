---
title: "Factory Method and Abstract Factory"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Factory Method and Abstract Factory.md"
order: 13
---
**Factory Method** is a creational pattern that defines an interface for creating an object but lets subclasses decide which class to instantiate. Instead of calling a constructor directly, the client calls a factory method which returns a product of an appropriate subtype. This promotes **loose coupling** by abstracting the creation logic.

* **Intent:** “Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.”
* **Use Cases:** When a class cannot anticipate the class of objects it needs to create, or to delegate the choice of concrete type to subclasses. For example, an `ImageReader` interface could define a factory method `createDecoder()` that subclasses (`PNGImageReader`, `JPEGImageReader`) implement to produce format-specific decoder objects.

```typescript
// Product interface and concrete products
interface Button { render(): void; }
class WindowsButton implements Button {
  render() { console.log("Rendering Windows-style button"); }
}
class MacOSButton implements Button {
  render() { console.log("Rendering MacOS-style button"); }
}

// Creator base class with factory method
abstract class Dialog {
  // Factory Method: to be implemented by subclasses
  abstract createButton(): Button;  

  renderDialog(): void {
    // use the factory method to get a Button, then use it
    const okButton = this.createButton();
    okButton.render();
  }
}

// Concrete Creators override factory method
class WindowsDialog extends Dialog {
  createButton(): Button { return new WindowsButton(); }
}
class MacOSDialog extends Dialog {
  createButton(): Button { return new MacOSButton(); }
}

// Client usage:
const dialog: Dialog = (platform === "Windows") ? new WindowsDialog() : new MacOSDialog();
dialog.renderDialog();  // creates and uses an appropriate Button via factory
```

In this example, `Dialog` is an abstract creator with a factory method `createButton()`. Subclasses decide which `Button` (product) to create. The client code works with the abstract `Dialog` but actually gets Windows or MacOS buttons based on the concrete subclass instantiated. This decouples the button creation from the dialog logic.

**Abstract Factory** is a related pattern that provides an interface to create **families of related objects** without specifying their concrete classes. An abstract factory groups individual factory methods for a suite of products. For example, an abstract GUI factory may create multiple UI components (buttons, checkboxes, menus) in a consistent style (all Windows, or all MacOS).

* **Intent:** Encapsulate a group of factories with a common theme to produce families of related products without exposing concrete classes.
* **Use Case:** Ensures that a set of products (e.g., UI widget kit) are created in matching variants. It’s useful when products must be used together and you want to swap families easily (e.g., switching from one database provider to another by swapping factories).

**Example:** Abstract factory for GUI toolkit:

```typescript
// Abstract product interfaces:
interface Button { draw(): void; }
interface Checkbox { draw(): void; }

// Concrete product implementations for Windows:
class WinButton implements Button { draw() { /* ... */ } }
class WinCheckbox implements Checkbox { draw() { /* ... */ } }

// Concrete product implementations for Mac:
class MacButton implements Button { draw() { /* ... */ } }
class MacCheckbox implements Checkbox { draw() { /* ... */ } }

// Abstract Factory interface:
interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// Concrete factories:
class WinFactory implements GUIFactory {
  createButton(): Button { return new WinButton(); }
  createCheckbox(): Checkbox { return new WinCheckbox(); }
}
class MacFactory implements GUIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}

// Client code:
function buildUI(factory: GUIFactory) {
  const btn = factory.createButton();
  const chk = factory.createCheckbox();
  btn.draw();
  chk.draw();
}

// If we want a Windows UI:
buildUI(new WinFactory());
// For Mac UI:
buildUI(new MacFactory());
```

Here, the `GUIFactory` abstract factory defines methods to create each product type. `WinFactory` and `MacFactory` produce Windows and Mac variants of the products. The client (`buildUI`) is unaware of concrete classes; it just uses whichever factory is passed in. This makes it easy to switch entire families of products by choosing a different factory at runtime.

**Summary:** Factory patterns promote the *Open/Closed Principle* by encapsulating object creation. They decouple code from specific concrete classes, making it easier to extend or change the creation of objects without modifying existing code.
