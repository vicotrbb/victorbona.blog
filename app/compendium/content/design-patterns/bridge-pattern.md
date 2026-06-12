---
title: "Bridge Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Bridge Pattern.md"
order: 2
---
The **Bridge** pattern decouples an abstraction from its implementation, so the two can vary independently. It achieves this by using composition: an abstraction class holds a reference to an implementor interface, and different implementors can provide the concrete behavior. Bridge is useful when you have an inheritance hierarchy on both sides (abstractions and implementations) and want to mix and match them freely without explosion of subclasses.

* **Intent:** “Decouple an abstraction from its implementation so that the two can vary independently.”
* **Use Cases:** When a class has two (or more) orthogonal dimensions that could evolve (for example: an abstraction of “Shape” that can be drawn in different ways on different platforms – you might have shape hierarchy and rendering method hierarchy). Instead of making subclasses for every combination (e.g., `CircleOnWindows`, `CircleOnLinux`, `SquareOnWindows`, `SquareOnLinux`, etc.), you separate the abstraction (“Shape”) from the implementation of rendering (“DrawingAPI”) and bridge them by aggregation.

**Example:** Drawing shapes using different drawing APIs:

```typescript
// Implementor interface
interface DrawingAPI {
  drawCircle(x: number, y: number, radius: number): void;
}

// Concrete implementors
class DrawingAPI_SVG implements DrawingAPI {
  drawCircle(x: number, y: number, radius: number): void {
    console.log(`SVG: Draw circle at (${x},${y}) radius ${radius}`);
  }
}
class DrawingAPI_Canvas implements DrawingAPI {
  drawCircle(x: number, y: number, radius: number): void {
    console.log(`Canvas: Draw circle at (${x},${y}) radius ${radius}`);
  }
}

// Abstraction hierarchy
abstract class Shape {
  protected drawingAPI: DrawingAPI;
  constructor(drawingAPI: DrawingAPI) {
    this.drawingAPI = drawingAPI;
  }
  abstract draw(): void;           // abstract operation
  // potentially other abstract methods like resize, etc.
}

class Circle extends Shape {
  private x: number; private y: number; private radius: number;
  constructor(x: number, y: number, r: number, api: DrawingAPI) {
    super(api);
    this.x = x; this.y = y; this.radius = r;
  }
  draw(): void {
    this.drawingAPI.drawCircle(this.x, this.y, this.radius);
  }
}

// Usage:
const shapes: Shape[] = [
  new Circle(5, 10, 3, new DrawingAPI_SVG()),
  new Circle(5, 10, 3, new DrawingAPI_Canvas())
];
shapes.forEach(shape => shape.draw());
/* Output:
   SVG: Draw circle at (5,10) radius 3
   Canvas: Draw circle at (5,10) radius 3
*/
```

Here, `Circle` is the abstraction (a kind of `Shape`), and it is paired with a `DrawingAPI` implementation. The `Circle.draw()` calls the `drawCircle` method of whichever `DrawingAPI` it’s configured with. If we introduce a new shape (e.g., `Square` class), it can use the same `DrawingAPI` interface. If we introduce a new DrawingAPI (say, OpenGL), it can be used by all existing shapes. Thus, shapes and rendering methods can evolve independently, and any combination works (the “bridge” is the association between `Shape` and `DrawingAPI`). This pattern emphasizes **composition over inheritance**: rather than subclassing to mix features, we compose objects to achieve flexibility.
