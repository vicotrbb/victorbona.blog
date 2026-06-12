---
title: "Graphs"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Graphs.md"
order: 10
---
A **Graph** is a non-linear data structure consisting of vertices (nodes) and edges that connect pairs of vertices. Graphs are used to represent relationships, networks, and connections between entities. They are fundamental to modeling real-world problems in computer science.

* **Intent:** Model relationships and connections between entities, enabling analysis of networks, paths, and dependencies.
* **Use Cases:** Social networks, web page linking, road networks, dependency resolution, circuit design, recommendation systems, network routing.
* **Key Properties:**
  - Vertices (V) and Edges (E)
  - Can be directed or undirected
  - Can be weighted or unweighted
  - Can have cycles or be acyclic

## Graph Types

```
Undirected Graph:          Directed Graph (Digraph):
    A --- B                     A --→ B
    |     |                     ↑     |
    |     |                     |     ↓
    C --- D                     C ←-- D

Weighted Graph:            Directed Acyclic Graph (DAG):
    A -5- B                     A --→ B
    |     |                     |     |
   3|    2|                     ↓     ↓
    C -4- D                     C --→ D
```

## Graph Representations

### Adjacency List
Best for sparse graphs (E << V²)

```typescript
class Graph<T> {
  private adjacencyList: Map<T, Set<T>> = new Map();
  private directed: boolean;

  constructor(directed: boolean = false) {
    this.directed = directed;
  }

  // O(1) - Add vertex
  addVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Set());
    }
  }

  // O(1) - Add edge
  addEdge(v1: T, v2: T): void {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjacencyList.get(v1)!.add(v2);
    if (!this.directed) {
      this.adjacencyList.get(v2)!.add(v1);
    }
  }

  // O(1) - Remove edge
  removeEdge(v1: T, v2: T): void {
    this.adjacencyList.get(v1)?.delete(v2);
    if (!this.directed) {
      this.adjacencyList.get(v2)?.delete(v1);
    }
  }

  // O(V + E) - Remove vertex
  removeVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) return;

    // Remove all edges to this vertex
    for (const [_, neighbors] of this.adjacencyList) {
      neighbors.delete(vertex);
    }

    this.adjacencyList.delete(vertex);
  }

  // O(1) - Get neighbors
  getNeighbors(vertex: T): T[] {
    return [...(this.adjacencyList.get(vertex) || [])];
  }

  // O(1) - Check if edge exists
  hasEdge(v1: T, v2: T): boolean {
    return this.adjacencyList.get(v1)?.has(v2) || false;
  }

  getVertices(): T[] {
    return [...this.adjacencyList.keys()];
  }

  getEdgeCount(): number {
    let count = 0;
    for (const neighbors of this.adjacencyList.values()) {
      count += neighbors.size;
    }
    return this.directed ? count : count / 2;
  }
}
```

### Weighted Graph
```typescript
class WeightedGraph<T> {
  private adjacencyList: Map<T, Map<T, number>> = new Map();
  private directed: boolean;

  constructor(directed: boolean = false) {
    this.directed = directed;
  }

  addVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Map());
    }
  }

  addEdge(v1: T, v2: T, weight: number): void {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjacencyList.get(v1)!.set(v2, weight);
    if (!this.directed) {
      this.adjacencyList.get(v2)!.set(v1, weight);
    }
  }

  getWeight(v1: T, v2: T): number | undefined {
    return this.adjacencyList.get(v1)?.get(v2);
  }

  getNeighborsWithWeights(vertex: T): [T, number][] {
    const neighbors = this.adjacencyList.get(vertex);
    return neighbors ? [...neighbors.entries()] : [];
  }
}
```

### Adjacency Matrix
Best for dense graphs or when O(1) edge lookup is needed

```typescript
class GraphMatrix {
  private matrix: number[][];
  private vertices: number;

  constructor(vertices: number) {
    this.vertices = vertices;
    this.matrix = Array.from({ length: vertices }, () =>
      new Array(vertices).fill(0)
    );
  }

  // O(1) - Add edge (weighted)
  addEdge(v1: number, v2: number, weight: number = 1): void {
    this.matrix[v1][v2] = weight;
    // For undirected: this.matrix[v2][v1] = weight;
  }

  // O(1) - Check edge
  hasEdge(v1: number, v2: number): boolean {
    return this.matrix[v1][v2] !== 0;
  }

  // O(V) - Get neighbors
  getNeighbors(vertex: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < this.vertices; i++) {
      if (this.matrix[vertex][i] !== 0) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }
}
```

## Space/Time Complexity

| Operation | Adjacency List | Adjacency Matrix |
|-----------|----------------|------------------|
| Space | O(V + E) | O(V²) |
| Add Vertex | O(1) | O(V²) |
| Add Edge | O(1) | O(1) |
| Remove Edge | O(E) | O(1) |
| Check Edge | O(V) | O(1) |
| Get Neighbors | O(degree) | O(V) |
| Iterate Edges | O(V + E) | O(V²) |

## Graph Traversal

### Breadth-First Search (BFS)
```typescript
function bfs<T>(graph: Graph<T>, start: T): T[] {
  const visited = new Set<T>();
  const result: T[] = [];
  const queue: T[] = [start];

  visited.add(start);

  while (queue.length > 0) {
    const vertex = queue.shift()!;
    result.push(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

### Depth-First Search (DFS)
```typescript
// Recursive
function dfsRecursive<T>(graph: Graph<T>, start: T): T[] {
  const visited = new Set<T>();
  const result: T[] = [];

  function dfs(vertex: T): void {
    visited.add(vertex);
    result.push(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  dfs(start);
  return result;
}

// Iterative
function dfsIterative<T>(graph: Graph<T>, start: T): T[] {
  const visited = new Set<T>();
  const result: T[] = [];
  const stack: T[] = [start];

  while (stack.length > 0) {
    const vertex = stack.pop()!;

    if (visited.has(vertex)) continue;
    visited.add(vertex);
    result.push(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return result;
}
```

## Classic Graph Algorithms

### Dijkstra's Shortest Path
```typescript
function dijkstra<T>(
  graph: WeightedGraph<T>,
  start: T
): Map<T, { distance: number; previous: T | null }> {
  const distances = new Map<T, { distance: number; previous: T | null }>();
  const visited = new Set<T>();
  const pq: [T, number][] = [[start, 0]];

  // Initialize
  for (const vertex of graph.getVertices()) {
    distances.set(vertex, { distance: Infinity, previous: null });
  }
  distances.get(start)!.distance = 0;

  while (pq.length > 0) {
    // Get minimum (should use proper min-heap)
    pq.sort((a, b) => a[1] - b[1]);
    const [current, currentDist] = pq.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    for (const [neighbor, weight] of graph.getNeighborsWithWeights(current)) {
      const newDist = currentDist + weight;
      if (newDist < distances.get(neighbor)!.distance) {
        distances.get(neighbor)!.distance = newDist;
        distances.get(neighbor)!.previous = current;
        pq.push([neighbor, newDist]);
      }
    }
  }

  return distances;
}
```

### Topological Sort (DAG only)
```typescript
function topologicalSort<T>(graph: Graph<T>): T[] {
  const visited = new Set<T>();
  const result: T[] = [];

  function dfs(vertex: T): void {
    visited.add(vertex);
    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
    result.unshift(vertex); // Add to front
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      dfs(vertex);
    }
  }

  return result;
}

// Kahn's Algorithm (BFS-based)
function topologicalSortKahn<T>(graph: Graph<T>): T[] {
  const inDegree = new Map<T, number>();
  const result: T[] = [];

  // Calculate in-degrees
  for (const vertex of graph.getVertices()) {
    inDegree.set(vertex, 0);
  }
  for (const vertex of graph.getVertices()) {
    for (const neighbor of graph.getNeighbors(vertex)) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    }
  }

  // Start with zero in-degree vertices
  const queue: T[] = [];
  for (const [vertex, degree] of inDegree) {
    if (degree === 0) queue.push(vertex);
  }

  while (queue.length > 0) {
    const vertex = queue.shift()!;
    result.push(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycle
  if (result.length !== graph.getVertices().length) {
    throw new Error('Graph has a cycle');
  }

  return result;
}
```

### Cycle Detection
```typescript
// Undirected graph - using DFS
function hasCycleUndirected<T>(graph: Graph<T>): boolean {
  const visited = new Set<T>();

  function dfs(vertex: T, parent: T | null): boolean {
    visited.add(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, vertex)) return true;
      } else if (neighbor !== parent) {
        return true; // Back edge found
      }
    }

    return false;
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      if (dfs(vertex, null)) return true;
    }
  }

  return false;
}

// Directed graph - using colors
function hasCycleDirected<T>(graph: Graph<T>): boolean {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<T, number>();

  for (const vertex of graph.getVertices()) {
    color.set(vertex, WHITE);
  }

  function dfs(vertex: T): boolean {
    color.set(vertex, GRAY);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (color.get(neighbor) === GRAY) {
        return true; // Back edge
      }
      if (color.get(neighbor) === WHITE && dfs(neighbor)) {
        return true;
      }
    }

    color.set(vertex, BLACK);
    return false;
  }

  for (const vertex of graph.getVertices()) {
    if (color.get(vertex) === WHITE && dfs(vertex)) {
      return true;
    }
  }

  return false;
}
```

### Connected Components
```typescript
function findConnectedComponents<T>(graph: Graph<T>): T[][] {
  const visited = new Set<T>();
  const components: T[][] = [];

  function dfs(vertex: T, component: T[]): void {
    visited.add(vertex);
    component.push(vertex);

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, component);
      }
    }
  }

  for (const vertex of graph.getVertices()) {
    if (!visited.has(vertex)) {
      const component: T[] = [];
      dfs(vertex, component);
      components.push(component);
    }
  }

  return components;
}
```

### Shortest Path (Unweighted)
```typescript
function shortestPath<T>(graph: Graph<T>, start: T, end: T): T[] | null {
  const visited = new Set<T>();
  const parent = new Map<T, T | null>();
  const queue: T[] = [start];

  visited.add(start);
  parent.set(start, null);

  while (queue.length > 0) {
    const vertex = queue.shift()!;

    if (vertex === end) {
      // Reconstruct path
      const path: T[] = [];
      let current: T | null = end;
      while (current !== null) {
        path.unshift(current);
        current = parent.get(current) || null;
      }
      return path;
    }

    for (const neighbor of graph.getNeighbors(vertex)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, vertex);
        queue.push(neighbor);
      }
    }
  }

  return null; // No path found
}
```

## Minimum Spanning Tree

### Prim's Algorithm
```typescript
function primMST<T>(graph: WeightedGraph<T>): [T, T, number][] {
  const vertices = graph.getVertices();
  if (vertices.length === 0) return [];

  const mst: [T, T, number][] = [];
  const visited = new Set<T>();
  const pq: [T, T, number][] = []; // [from, to, weight]

  const start = vertices[0];
  visited.add(start);

  // Add edges from start
  for (const [neighbor, weight] of graph.getNeighborsWithWeights(start)) {
    pq.push([start, neighbor, weight]);
  }

  while (pq.length > 0 && visited.size < vertices.length) {
    pq.sort((a, b) => a[2] - b[2]);
    const [from, to, weight] = pq.shift()!;

    if (visited.has(to)) continue;

    visited.add(to);
    mst.push([from, to, weight]);

    for (const [neighbor, w] of graph.getNeighborsWithWeights(to)) {
      if (!visited.has(neighbor)) {
        pq.push([to, neighbor, w]);
      }
    }
  }

  return mst;
}
```

## Algorithm Complexity Summary

| Algorithm | Time | Space |
|-----------|------|-------|
| BFS | O(V + E) | O(V) |
| DFS | O(V + E) | O(V) |
| Dijkstra | O((V + E) log V) | O(V) |
| Bellman-Ford | O(V × E) | O(V) |
| Floyd-Warshall | O(V³) | O(V²) |
| Topological Sort | O(V + E) | O(V) |
| Prim's MST | O(E log V) | O(V) |
| Kruskal's MST | O(E log E) | O(V) |

## When to Use Different Representations

**Adjacency List:**
- Sparse graphs (E << V²)
- Need to iterate over neighbors
- Memory is constrained

**Adjacency Matrix:**
- Dense graphs (E ≈ V²)
- Need O(1) edge lookup
- Graph is small

## Related Structures

- [Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find) - For connected components
- [Heaps](/compendium/data-structures/heaps) - For Dijkstra's algorithm
- [Hash Tables](/compendium/data-structures/hash-tables) - For adjacency list implementation
- [Binary Trees](/compendium/data-structures/binary-trees) - Special case of graphs
