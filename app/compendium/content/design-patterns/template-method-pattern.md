---
title: "Template Method Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Template Method Pattern.md"
order: 25
---
**Template Method** defines the skeleton of an algorithm in a method, deferring some steps to subclasses. It allows subclasses to redefine certain steps of an algorithm without changing the algorithm’s overall structure. The base class provides a template method that calls various hook operations (some default, some abstract). Subclasses override the abstract hooks to provide specific behavior.

* **Intent:** *“Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm’s structure.”*
* **Use Cases:** When you have an algorithm that consists of fixed steps, but some steps can or should be customized by subclasses. Common in frameworks: e.g., a game framework might have a `Game` base class with a `play()` template method that calls `initialize()`, `startPlay()`, `endPlay()`, where default or abstract implementations exist and game-specific subclasses override the steps. Or in a UI framework, a base class for UI components might have a template method for rendering that calls hooks like `beforeRender()` and `afterRender()`. The Template Method pattern is also present in Hollywood Principle (“Don’t call us, we’ll call you”) situations, where the framework calls subclass methods at specific times.

**Example:** An abstract data parser that defines steps for parsing data, with a hook for custom parsing logic:

```typescript
abstract class DataParser {
  // Template method defining algorithm for parsing data:
  parseAndProcess(): void {
    loadData();
    parseData();       // abstract step
    processData();
    saveResults();
  }
  loadData(): void {
    console.log("Data loaded from source");
  }
  abstract parseData(): void;    // to be provided by subclass
  processData(): void {
    console.log("Processing data...");
  }
  saveResults(): void {
    console.log("Results saved");
  }
}

class CSVParser extends DataParser {
  parseData(): void {
    console.log("Parsing data as CSV format");
  }
}
class JSONParser extends DataParser {
  parseData(): void {
    console.log("Parsing data as JSON format");
  }
}

// Usage:
const parser: DataParser = new CSVParser();
parser.parseAndProcess();
/* 
Output:
 Data loaded from source
 Parsing data as CSV format
 Processing data...
 Results saved
*/
```

Here, `DataParser.parseAndProcess()` is the template method outlining the sequence: load, parse, process, save. The `parseData()` step is abstract; `CSVParser` and `JSONParser` provide their own implementations for that step. The overall algorithm (loading, processing, saving) remains unchanged for all subclasses, but the parsing detail varies. This pattern ensures the high-level workflow is controlled by the base class, while subclasses plug in necessary custom code. It’s a way to enforce an algorithm’s structure and also promote code reuse (common parts in base class) and flexibility (variable parts in subclasses).

A real-world example is the `java.io.InputStream` class in Java, which has a template method `read(byte[] b)` that calls an abstract `read()` method in a loop – subclasses of InputStream implement how to read a single byte, while the looping logic to fill a buffer is provided by the base class.
