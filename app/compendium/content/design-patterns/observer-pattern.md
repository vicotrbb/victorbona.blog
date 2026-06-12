---
title: "Observer Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Observer Pattern.md"
order: 17
---
**Observer** (also known as Publish/Subscribe or Listener) defines a one-to-many dependency between objects so that when one object (subject) changes state, all its dependents (observers) are notified automatically. The subject maintains a list of observers and sends notifications to them (usually by calling a specific update method) when its state changes. Observers can subscribe or unsubscribe dynamically.

* **Intent:** *“Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.”*
* **Use Cases:** Event handling systems, GUI frameworks (e.g., a button click notifying multiple listeners), model-view-controller (MVC) architectures (the model notifies views of changes), distributed event handlers, or any scenario where an object needs to broadcast changes to interested parties. In front-end (fullstack context), JavaScript events and listeners are a form of Observer pattern (DOM element is subject, event handlers are observers).

**Example:** A simple implementation of Observer for a blog where subscribers get notified of new posts:

```typescript
// Subject interface
interface Subject {
  subscribe(obs: Observer): void;
  unsubscribe(obs: Observer): void;
  notify(data: any): void;
}

// Observer interface
interface Observer {
  update(data: any): void;
}

// Concrete Subject
class Blog implements Subject {
  private readers: Observer[] = [];
  subscribe(obs: Observer): void { this.readers.push(obs); }
  unsubscribe(obs: Observer): void { 
    this.readers = this.readers.filter(r => r !== obs);
  }
  // Notify all observers of new data (e.g., a new blog post)
  notify(post: string): void {
    this.readers.forEach(reader => reader.update(post));
  }
}

// Concrete Observer
class Reader implements Observer {
  constructor(public name: string) {}
  update(post: string): void {
    console.log(`${this.name} is notified about new post: "${post}"`);
  }
}

// Usage:
const techBlog = new Blog();
const alice = new Reader("Alice"), bob = new Reader("Bob");
techBlog.subscribe(alice);
techBlog.subscribe(bob);

// When a new post is published:
techBlog.notify("Understanding Observers in TypeScript");
/* Output:
   Alice is notified about new post: "Understanding Observers in TypeScript"
   Bob is notified about new post: "Understanding Observers in TypeScript"
*/
```

In this code, `Blog` is the subject maintaining a list of `Reader` observers. When `notify` is called (e.g., a new blog post), it calls `update` on each subscribed reader. The readers “pull” the data pushed by the blog. This decouples the blog from the concrete actions the readers take – maybe they just log, or they could trigger a UI update, send an email, etc.

The Observer pattern promotes a **loose coupling**: the subject knows nothing about observers except that they implement an `update` interface. Observers can be added or removed at runtime. It’s a cornerstone of event-driven architectures and the model-view aspect of MVC. One drawback is potential memory leaks if observers are not removed (if subject outlives observers), so care with unsubscribe is needed.

In modern languages and frameworks, this pattern is often supported by built-in constructs (for instance, C# events/delegates, Java’s `java.util.Observer` (deprecated in newer Java), or reactive libraries like RxJS using Observables which generalize the pattern with functional style).
