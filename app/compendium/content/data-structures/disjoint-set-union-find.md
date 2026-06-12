---
title: "Disjoint Set (Union-Find)"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Disjoint Set (Union-Find).md"
order: 8
---
A **Disjoint Set** (also called Union-Find) is a data structure that tracks a collection of non-overlapping sets. It provides near-constant time operations to determine if two elements are in the same set (Find) and to merge two sets (Union). It's essential for graph connectivity and clustering problems.

* **Intent:** Efficiently track connected components and perform set unions with nearly O(1) amortized operations.
* **Use Cases:** Kruskal's MST algorithm, detecting cycles in graphs, network connectivity, image segmentation, equivalence classes, least common ancestor.
* **Key Properties:**
  - O(α(n)) amortized time per operation (α is inverse Ackermann)
  - α(n) ≤ 4 for any practical n
  - Space: O(n)
  - Cannot split sets (only union)

## Core Operations

```
Make-Set(x): Create a new set containing only x
Find(x): Return the representative (root) of x's set
Union(x, y): Merge the sets containing x and y
```

## Implementation

### Basic Version
```typescript
class DisjointSet {
  private parent: number[];
  private rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  // O(log n) without path compression - Find root
  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  // O(log n) - Union by rank
  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false; // Already in same set

    // Union by rank (attach smaller tree under larger)
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    return true;
  }

  // Check if two elements are in the same set
  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}
```

### With Size Tracking
```typescript
class DisjointSetWithSize {
  private parent: number[];
  private size: number[];
  private numSets: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.numSets = n;
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // Union by size (attach smaller to larger)
    if (this.size[rootX] < this.size[rootY]) {
      this.parent[rootX] = rootY;
      this.size[rootY] += this.size[rootX];
    } else {
      this.parent[rootY] = rootX;
      this.size[rootX] += this.size[rootY];
    }

    this.numSets--;
    return true;
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  getSetSize(x: number): number {
    return this.size[this.find(x)];
  }

  getNumSets(): number {
    return this.numSets;
  }
}
```

## Time Complexity

| Operation | Without Optimizations | With Path Compression + Union by Rank |
|-----------|----------------------|--------------------------------------|
| Make-Set | O(1) | O(1) |
| Find | O(n) | O(α(n)) ≈ O(1) |
| Union | O(n) | O(α(n)) ≈ O(1) |

α(n) = inverse Ackermann function, grows incredibly slowly:
- α(1) = 0
- α(2-4) = 1
- α(5-16) = 2
- α(17-65536) = 3
- α(65537-2^65536) = 4

For all practical purposes, α(n) ≤ 4.

## Optimizations Explained

### Path Compression
During Find, make every node point directly to root:

```
Before Find(5):      After Find(5):
    1                    1
    |                  / | \
    2                 2  3  5
    |                    |
    3                    4
    |
    4
    |
    5
```

### Union by Rank/Size
Always attach smaller tree under larger to keep height minimal:

```
Union by rank:
- If ranks differ: attach lower rank to higher
- If ranks equal: attach either, increment winner's rank

Union by size:
- Attach smaller set to larger set
- Better for applications tracking set sizes
```

## Classic Applications

### Number of Connected Components
```typescript
function countComponents(n: number, edges: [number, number][]): number {
  const ds = new DisjointSetWithSize(n);

  for (const [a, b] of edges) {
    ds.union(a, b);
  }

  return ds.getNumSets();
}

console.log(countComponents(5, [ [0, 1], [1, 2], [3, 4] ])); // 2
// Components: {0,1,2} and {3,4}
```

### Cycle Detection in Undirected Graph
```typescript
function hasCycle(n: number, edges: [number, number][]): boolean {
  const ds = new DisjointSet(n);

  for (const [a, b] of edges) {
    // If already connected, adding edge creates cycle
    if (ds.connected(a, b)) {
      return true;
    }
    ds.union(a, b);
  }

  return false;
}

console.log(hasCycle(4, [ [0, 1], [1, 2], [2, 0] ])); // true
console.log(hasCycle(4, [ [0, 1], [1, 2], [2, 3] ])); // false
```

### Kruskal's Minimum Spanning Tree
```typescript
interface Edge {
  u: number;
  v: number;
  weight: number;
}

function kruskalMST(n: number, edges: Edge[]): Edge[] {
  // Sort edges by weight
  edges.sort((a, b) => a.weight - b.weight);

  const ds = new DisjointSet(n);
  const mst: Edge[] = [];

  for (const edge of edges) {
    // Add edge if it doesn't create cycle
    if (!ds.connected(edge.u, edge.v)) {
      ds.union(edge.u, edge.v);
      mst.push(edge);

      // MST complete when we have n-1 edges
      if (mst.length === n - 1) break;
    }
  }

  return mst;
}

const edges = [
  { u: 0, v: 1, weight: 4 },
  { u: 0, v: 2, weight: 3 },
  { u: 1, v: 2, weight: 1 },
  { u: 1, v: 3, weight: 2 },
  { u: 2, v: 3, weight: 4 }
];

console.log(kruskalMST(4, edges));
// MST edges with minimum total weight
```

### Accounts Merge
```typescript
function accountsMerge(accounts: string[][]): string[][] {
  const emailToId = new Map<string, number>();
  const emailToName = new Map<string, string>();
  let id = 0;

  // Assign ID to each email
  for (const account of accounts) {
    const name = account[0];
    for (let i = 1; i < account.length; i++) {
      if (!emailToId.has(account[i])) {
        emailToId.set(account[i], id++);
      }
      emailToName.set(account[i], name);
    }
  }

  const ds = new DisjointSet(id);

  // Union emails in same account
  for (const account of accounts) {
    const firstEmail = account[1];
    for (let i = 2; i < account.length; i++) {
      ds.union(emailToId.get(firstEmail)!, emailToId.get(account[i])!);
    }
  }

  // Group emails by root
  const groups = new Map<number, string[]>();
  for (const [email, emailId] of emailToId) {
    const root = ds.find(emailId);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root)!.push(email);
  }

  // Build result
  const result: string[][] = [];
  for (const emails of groups.values()) {
    emails.sort();
    result.push([emailToName.get(emails[0])!, ...emails]);
  }

  return result;
}
```

### Redundant Connection (Find Cycle Edge)
```typescript
function findRedundantConnection(edges: [number, number][]): [number, number] {
  const ds = new DisjointSet(edges.length + 1);

  for (const [u, v] of edges) {
    if (!ds.union(u, v)) {
      return [u, v]; // This edge creates a cycle
    }
  }

  return [-1, -1];
}

console.log(findRedundantConnection([ [1,2], [1,3], [2,3] ])); // [2, 3]
```

### Largest Component by Size
```typescript
function largestComponent(n: number, edges: [number, number][]): number {
  const ds = new DisjointSetWithSize(n);

  for (const [a, b] of edges) {
    ds.union(a, b);
  }

  let maxSize = 0;
  for (let i = 0; i < n; i++) {
    if (ds.find(i) === i) { // Is root
      maxSize = Math.max(maxSize, ds.getSetSize(i));
    }
  }

  return maxSize;
}
```

## Weighted Union-Find

For problems tracking distance/relationship to root:

```typescript
class WeightedUnionFind {
  private parent: number[];
  private rank: number[];
  private weight: number[]; // Weight/distance to parent

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.weight = new Array(n).fill(0);
  }

  find(x: number): [number, number] {
    if (this.parent[x] === x) {
      return [x, 0];
    }

    const [root, parentWeight] = this.find(this.parent[x]);
    this.parent[x] = root;
    this.weight[x] += parentWeight;
    return [root, this.weight[x] ];
  }

  // Union with weight: weight[y] - weight[x] = w
  union(x: number, y: number, w: number): boolean {
    const [rootX, weightX] = this.find(x);
    const [rootY, weightY] = this.find(y);

    if (rootX === rootY) return false;

    // Adjust weight so relationship holds
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
      this.weight[rootX] = w + weightY - weightX;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
      this.weight[rootY] = -w + weightX - weightY;
    } else {
      this.parent[rootY] = rootX;
      this.weight[rootY] = -w + weightX - weightY;
      this.rank[rootX]++;
    }

    return true;
  }
}
```

## When to Use Disjoint Sets

**Use disjoint sets when:**
- Tracking connected components
- Need to detect cycles in undirected graphs
- Implementing Kruskal's MST algorithm
- Grouping/clustering elements
- Checking equivalence/connectivity

**Consider alternatives:**
- Need to enumerate elements in set → Use actual sets
- Need to split sets → Not supported
- Dense graphs → BFS/DFS may be simpler
- Single connectivity query → BFS/DFS

## Related Structures

- [Graphs](/compendium/data-structures/graphs) - Union-Find helps with graph algorithms
- [Hash Tables](/compendium/data-structures/hash-tables) - Alternative for simple grouping
- [Binary Trees](/compendium/data-structures/binary-trees) - Tree structure used internally
