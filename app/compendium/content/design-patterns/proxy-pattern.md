---
title: "Proxy Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Proxy Pattern.md"
order: 20
---
A **Proxy** provides a placeholder or substitute for another object to control access to it. The proxy implements the same interface as the real subject and forwards requests to it, adding extra behavior either before or after the delegation. There are several types of proxies: remote proxies (accessing an object in a different address space), virtual proxies (lazy-loading expensive objects), protection proxies (access control), caching proxies, etc.

* **Intent:** *“Proxy is a structural design pattern that lets you provide a substitute or placeholder for another object. A proxy controls access to the original object, allowing you to perform something before or after the request gets through to the original object.”*
* **Use Cases:** Controlling expensive or sensitive operations. Examples:

  * **Lazy initialization:** A proxy defers creation of a heavy object until it’s needed (e.g., a large image object).
  * **Access control:** A proxy validates access (permissions) to a sensitive object.
  * **Logging or caching:** A proxy logs calls or caches results from the real subject to improve performance.
  * **Distributed object:** A proxy stands in for an object in a remote server (e.g., a stub in RMI or gRPC client).

**Example:** Virtual proxy for lazy-loading an expensive object (say, a large image):

```typescript
interface Image {
  display(): void;
}

// Real subject – heavy to load
class HighResImage implements Image {
  private filename: string;
  constructor(filename: string) {
    this.filename = filename;
    console.log(`Loading image from disk: ${filename}...`);
    // Simulate expensive load:
    // (In reality, reading file into memory)
  }
  display(): void {
    console.log(`Displaying image: ${this.filename}`);
  }
}

// Proxy that defers loading until display() is called
class ImageProxy implements Image {
  private filename: string;
  private realImage: HighResImage | null = null;
  constructor(filename: string) {
    this.filename = filename;
  }
  display(): void {
    if (!this.realImage) {
      this.realImage = new HighResImage(this.filename);  // load on first use
    }
    this.realImage.display();
  }
}

// Usage:
const img: Image = new ImageProxy("photo.png");
// ...some operations, image not loaded yet...
img.display();  // triggers actual loading only now
```

Initially, `ImageProxy` holds just the filename. When `display()` is invoked, the proxy checks if the real image is loaded; if not, it creates the `HighResImage` (which does the heavy loading) and then delegates the display call to it. This way, if the program never calls `display()`, the expensive load is avoided entirely. The proxy and real image both implement `Image`, so the client uses `Image` interface transparently.

Another common example is a **protection proxy**: e.g., a `DatabaseProxy` that checks user roles before forwarding queries to the actual `Database` object. The concept is the same: intercept calls to add control.
