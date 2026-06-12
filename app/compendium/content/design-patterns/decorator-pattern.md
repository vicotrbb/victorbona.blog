---
title: "Decorator Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Decorator Pattern.md"
order: 8
---
**Decorator** attaches new responsibilities or behaviors to an object dynamically, without altering its structure. It provides a flexible alternative to subclassing for extending functionality. A decorator wraps an object of the same interface, intercepting operations to add features before/after delegating to the wrapped object.

* **Intent:** *“Decorator is a structural design pattern that lets you attach new behaviors to objects by placing these objects inside special wrapper objects that contain the behaviors.”*
* **Use Cases:** When you need to add functionality to objects without subclass explosion. For example, adding scrolling to a text view, or adding encryption to a data stream, where you might wrap the original object in a decorator that adds these behaviors. Multiple decorators can be stacked (each adding one aspect).

**Example:** Suppose we have a basic `Notifier` that sends alerts via email. We want to extend it to send SMS and Slack notifications optionally, without hard-coding combinations of all possibilities. We can use decorators:

```typescript
// Component interface
interface Notifier {
  send(message: string): void;
}

// Concrete component
class EmailNotifier implements Notifier {
  send(message: string): void {
    console.log(`Email sent: ${message}`);
  }
}

// Base Decorator (implements Notifier and wraps another Notifier)
class NotifierDecorator implements Notifier {
  constructor(protected wrappee: Notifier) {}
  send(message: string): void {
    this.wrappee.send(message); // default to delegating
  }
}

// Concrete Decorators adding features:
class SMSDecorator extends NotifierDecorator {
  send(message: string): void {
    this.wrappee.send(message);
    console.log(`SMS sent: ${message}`);
  }
}
class SlackDecorator extends NotifierDecorator {
  send(message: string): void {
    this.wrappee.send(message);
    console.log(`Slack message sent: ${message}`);
  }
}

// Usage:
let notifier: Notifier = new EmailNotifier();
notifier = new SMSDecorator(notifier);    // wrap with SMS feature
notifier = new SlackDecorator(notifier);  // wrap with Slack feature

notifier.send("Server is down!");
/* Output:
   Email sent: Server is down!
   SMS sent: Server is down!
   Slack message sent: Server is down!
*/
```

In this scenario, decorators `SMSDecorator` and `SlackDecorator` wrap the base `EmailNotifier`. Each decorator adds its own behavior (sending SMS or Slack notification) and then defers to the wrapped notifier (ensuring the email is still sent). Because each decorator implements `Notifier`, we can treat the decorated object just like a normal notifier. This pattern exemplifies **open/closed principle** – we extend functionality (open for extension) without modifying existing classes (closed for modification). It avoids the need to create subclasses like `EmailAndSMSNotifier`, `EmailAndSlackNotifier`, etc., which would multiply as combinations grow.
