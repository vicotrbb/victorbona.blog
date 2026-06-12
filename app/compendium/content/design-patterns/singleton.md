---
title: "Singleton"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Singleton.md"
order: 23
---
The **Singleton** ensures a class has only one instance and provides a global point of access to it. This is useful for shared resources like configuration, caches, or thread pools, where multiple instantiations could cause issues. The class controls instance creation by making its constructor private and offering a static method to get the sole instance.

* **Intent:** Restrict instantiation to one object and provide global access.
* **Use Cases:** Config managers, database connection pools, logging objects (where a single shared instance is desired).
* **Implementation:** Often involves a private static variable to hold the instance, a private constructor, and a public static `getInstance()` method that creates the instance on first call (with lazy initialization).

```typescript
class ConfigManager {
  private static instance: ConfigManager;
  private settings: Map<string, string>;

  // Private constructor prevents external instantiation
  private constructor() {
    this.settings = new Map();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Example method
  getSetting(key: string): string | undefined {
    return this.settings.get(key);
  }
}
 
// Usage:
const cfg = ConfigManager.getInstance();
cfg.getSetting("API_URL");
```

In this TypeScript pseudocode, `ConfigManager` uses a static field to store the sole instance. The first call to `getInstance()` creates the object, and subsequent calls return the same instance. This pattern provides a simple way to access global resources. However, **caution**: singletons introduce global state and can make testing harder, so use them judiciously (sometimes dependency injection is preferable to singletons).
