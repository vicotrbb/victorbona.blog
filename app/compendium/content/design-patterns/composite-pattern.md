---
title: "Composite Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Composite Pattern.md"
order: 6
---
**Composite** pattern composes objects into tree structures to represent part-whole hierarchies. It lets clients treat individual objects and compositions of objects uniformly. In other words, a composite allows a group of objects (that share a common interface) to be treated just like a single object of that interface. Typically, you have **Component** interface, **Leaf** (single object) and **Composite** (container of components) implementing that interface.

* **Intent:** *“Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.”*
* **Use Cases:** Any scenario with a hierarchical tree of objects. Common examples: file systems (files and directories), GUI widgets (widgets vs containers of widgets), organization charts (employees vs departments which contain employees), or HTML DOM (elements vs containers). The Composite pattern is prevalent in implementing recursive structures.

**Example:** File system structure with files and directories:

```typescript
// Component interface
interface FileSystemItem {
  getName(): string;
  getSize(): number;
}

// Leaf - File (cannot contain children)
class FileItem implements FileSystemItem {
  constructor(private name: string, private size: number) {}
  getName() { return this.name; }
  getSize() { return this.size; }
}

// Composite - Directory (can contain files or other directories)
class Directory implements FileSystemItem {
  private children: FileSystemItem[] = [];
  constructor(private name: string) {}
  getName() { return this.name; }
  getSize(): number {
    // total size is sum of children's sizes
    return this.children.reduce((sum, child) => sum + child.getSize(), 0);
  }
  add(item: FileSystemItem): void {
    this.children.push(item);
  }
  // We could also implement methods like remove, listContents, etc.
}

// Usage:
const rootDir = new Directory("root");
const file1 = new FileItem("a.txt", 120);
const file2 = new FileItem("b.txt", 80);
const subDir = new Directory("sub");
const file3 = new FileItem("c.txt", 30);

rootDir.add(file1);
rootDir.add(file2);
rootDir.add(subDir);
subDir.add(file3);

console.log(`Total size of ${rootDir.getName()} = ${rootDir.getSize()} bytes`);  // 230 bytes
```

In this example, `FileItem` is a leaf node (no children) and `Directory` is a composite that can contain `FileSystemItem` children (which could be files or other directories). Both implement `FileSystemItem`, so the client can call `getSize()` on a single file or an entire directory without caring if it’s a composite or a leaf. The composite (`Directory`) forwards or aggregates operations to its children. This uniform treatment is powerful for recursive algorithms (e.g., computing total size, printing structure, etc.) since each node is just a `FileSystemItem`.

The Composite pattern promotes **tree structures** and simplifies client code dealing with whole-part hierarchies. Clients don't need separate logic for single vs. container objects – e.g., here `getSize()` works on both. One must be careful with operations like adding/removing children (usually defined in composite but can be no-op or unsupported in leaf). Composite aligns with the **Liskov Substitution Principle** in that any composite or leaf can be used wherever a `FileSystemItem` is expected.
