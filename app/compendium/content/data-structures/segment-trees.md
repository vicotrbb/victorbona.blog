---
title: "Segment Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Segment Trees.md"
order: 18
---
A **Segment Tree** is a binary tree data structure used for storing information about intervals (segments) of an array. It allows efficient querying of aggregate information (sum, minimum, maximum, GCD, etc.) over any range and supports point or range updates in O(log n) time.

* **Intent:** Provide efficient range queries and updates on an array where both operations need to be fast.
* **Use Cases:** Range sum/min/max queries, computational geometry, database query optimization, interval scheduling, competitive programming.
* **Key Properties:**
  - Balanced binary tree structure
  - Each node represents a range of the array
  - Leaf nodes represent individual elements
  - O(log n) for both query and update

## Structure

```
Array: [1, 3, 5, 7, 9, 11]

Segment Tree (sum):
                36 [0,5]
              /          \
         9 [0,2]        27 [3,5]
        /      \        /       \
     4 [0,1]  5[2,2]  16[3,4]  11[5,5]
    /    \           /     \
 1[0,0] 3[1,1]   7[3,3]  9[4,4]

Each node stores sum of its range
Query [1,4]: 3 + 5 + 7 + 9 = 24
```

## Implementation

### Basic Segment Tree (Array-based)
```typescript
class SegmentTree {
  private tree: number[];
  private n: number;
  private operation: (a: number, b: number) => number;
  private identity: number;

  constructor(
    arr: number[],
    operation: (a: number, b: number) => number = (a, b) => a + b,
    identity: number = 0
  ) {
    this.n = arr.length;
    this.operation = operation;
    this.identity = identity;
    // Tree size: 4 * n is safe upper bound
    this.tree = new Array(4 * this.n).fill(identity);
    this.build(arr, 0, 0, this.n - 1);
  }

  // O(n) - Build tree
  private build(arr: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = arr[start];
      return;
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * node + 1;
    const rightChild = 2 * node + 2;

    this.build(arr, leftChild, start, mid);
    this.build(arr, rightChild, mid + 1, end);

    this.tree[node] = this.operation(this.tree[leftChild], this.tree[rightChild]);
  }

  // O(log n) - Point update
  update(index: number, value: number): void {
    this.updateHelper(0, 0, this.n - 1, index, value);
  }

  private updateHelper(
    node: number,
    start: number,
    end: number,
    index: number,
    value: number
  ): void {
    if (start === end) {
      this.tree[node] = value;
      return;
    }

    const mid = Math.floor((start + end) / 2);
    const leftChild = 2 * node + 1;
    const rightChild = 2 * node + 2;

    if (index <= mid) {
      this.updateHelper(leftChild, start, mid, index, value);
    } else {
      this.updateHelper(rightChild, mid + 1, end, index, value);
    }

    this.tree[node] = this.operation(this.tree[leftChild], this.tree[rightChild]);
  }

  // O(log n) - Range query
  query(left: number, right: number): number {
    return this.queryHelper(0, 0, this.n - 1, left, right);
  }

  private queryHelper(
    node: number,
    start: number,
    end: number,
    left: number,
    right: number
  ): number {
    // No overlap
    if (right < start || left > end) {
      return this.identity;
    }

    // Complete overlap
    if (left <= start && end <= right) {
      return this.tree[node];
    }

    // Partial overlap
    const mid = Math.floor((start + end) / 2);
    const leftResult = this.queryHelper(2 * node + 1, start, mid, left, right);
    const rightResult = this.queryHelper(2 * node + 2, mid + 1, end, left, right);

    return this.operation(leftResult, rightResult);
  }
}

// Usage - Range Sum
const sumTree = new SegmentTree([1, 3, 5, 7, 9, 11]);
console.log(sumTree.query(1, 4)); // 24 (3 + 5 + 7 + 9)
sumTree.update(2, 10);            // Change 5 to 10
console.log(sumTree.query(1, 4)); // 29 (3 + 10 + 7 + 9)

// Usage - Range Minimum
const minTree = new SegmentTree(
  [1, 3, 5, 7, 9, 11],
  Math.min,
  Infinity
);
console.log(minTree.query(1, 4)); // 3

// Usage - Range Maximum
const maxTree = new SegmentTree(
  [1, 3, 5, 7, 9, 11],
  Math.max,
  -Infinity
);
console.log(maxTree.query(1, 4)); // 9
```

### Segment Tree with Lazy Propagation
For efficient range updates:

```typescript
class LazySegmentTree {
  private tree: number[];
  private lazy: number[];
  private n: number;

  constructor(arr: number[]) {
    this.n = arr.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);
    this.build(arr, 0, 0, this.n - 1);
  }

  private build(arr: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = arr[start];
      return;
    }

    const mid = Math.floor((start + end) / 2);
    this.build(arr, 2 * node + 1, start, mid);
    this.build(arr, 2 * node + 2, mid + 1, end);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }

  private pushDown(node: number, start: number, end: number): void {
    if (this.lazy[node] !== 0) {
      const mid = Math.floor((start + end) / 2);
      const leftChild = 2 * node + 1;
      const rightChild = 2 * node + 2;

      // Apply lazy value to children
      this.tree[leftChild] += this.lazy[node] * (mid - start + 1);
      this.tree[rightChild] += this.lazy[node] * (end - mid);
      this.lazy[leftChild] += this.lazy[node];
      this.lazy[rightChild] += this.lazy[node];

      this.lazy[node] = 0;
    }
  }

  // O(log n) - Range update: add value to all elements in [left, right]
  rangeUpdate(left: number, right: number, value: number): void {
    this.rangeUpdateHelper(0, 0, this.n - 1, left, right, value);
  }

  private rangeUpdateHelper(
    node: number,
    start: number,
    end: number,
    left: number,
    right: number,
    value: number
  ): void {
    if (right < start || left > end) return;

    if (left <= start && end <= right) {
      this.tree[node] += value * (end - start + 1);
      this.lazy[node] += value;
      return;
    }

    this.pushDown(node, start, end);

    const mid = Math.floor((start + end) / 2);
    this.rangeUpdateHelper(2 * node + 1, start, mid, left, right, value);
    this.rangeUpdateHelper(2 * node + 2, mid + 1, end, left, right, value);

    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }

  // O(log n) - Range query
  query(left: number, right: number): number {
    return this.queryHelper(0, 0, this.n - 1, left, right);
  }

  private queryHelper(
    node: number,
    start: number,
    end: number,
    left: number,
    right: number
  ): number {
    if (right < start || left > end) return 0;

    if (left <= start && end <= right) {
      return this.tree[node];
    }

    this.pushDown(node, start, end);

    const mid = Math.floor((start + end) / 2);
    return (
      this.queryHelper(2 * node + 1, start, mid, left, right) +
      this.queryHelper(2 * node + 2, mid + 1, end, left, right)
    );
  }
}

// Usage
const lazyTree = new LazySegmentTree([1, 2, 3, 4, 5]);
console.log(lazyTree.query(0, 4));  // 15
lazyTree.rangeUpdate(1, 3, 10);     // Add 10 to indices 1-3
console.log(lazyTree.query(0, 4));  // 45 (1 + 12 + 13 + 14 + 5)
```

## Time Complexity

| Operation | Without Lazy | With Lazy |
|-----------|--------------|-----------|
| Build | O(n) | O(n) |
| Point Update | O(log n) | O(log n) |
| Range Update | O(n log n) | O(log n) |
| Range Query | O(log n) | O(log n) |
| Space | O(n) | O(n) |

## Common Applications

### Count of Smaller Numbers After Self
```typescript
function countSmaller(nums: number[]): number[] {
  // Coordinate compression
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));

  const tree = new SegmentTree(
    new Array(sorted.length).fill(0),
    (a, b) => a + b,
    0
  );

  const result: number[] = [];

  // Process from right to left
  for (let i = nums.length - 1; i >= 0; i--) {
    const r = rank.get(nums[i])!;
    // Count elements smaller than current
    result.push(r > 0 ? tree.query(0, r - 1) : 0);
    // Mark current element as seen
    tree.update(r, tree.query(r, r) + 1);
  }

  return result.reverse();
}
```

### Range Minimum Query (RMQ)
```typescript
class RMQ {
  private tree: { min: number; idx: number }[];
  private n: number;

  constructor(arr: number[]) {
    this.n = arr.length;
    this.tree = new Array(4 * this.n);
    this.build(arr, 0, 0, this.n - 1);
  }

  private build(arr: number[], node: number, start: number, end: number): void {
    if (start === end) {
      this.tree[node] = { min: arr[start], idx: start };
      return;
    }

    const mid = Math.floor((start + end) / 2);
    this.build(arr, 2 * node + 1, start, mid);
    this.build(arr, 2 * node + 2, mid + 1, end);

    const left = this.tree[2 * node + 1];
    const right = this.tree[2 * node + 2];
    this.tree[node] = left.min <= right.min ? left : right;
  }

  queryMinIndex(left: number, right: number): number {
    return this.queryHelper(0, 0, this.n - 1, left, right).idx;
  }

  private queryHelper(
    node: number,
    start: number,
    end: number,
    left: number,
    right: number
  ): { min: number; idx: number } {
    if (right < start || left > end) {
      return { min: Infinity, idx: -1 };
    }
    if (left <= start && end <= right) {
      return this.tree[node];
    }

    const mid = Math.floor((start + end) / 2);
    const leftResult = this.queryHelper(2 * node + 1, start, mid, left, right);
    const rightResult = this.queryHelper(2 * node + 2, mid + 1, end, left, right);

    return leftResult.min <= rightResult.min ? leftResult : rightResult;
  }
}
```

### Rectangle Area with Updates
```typescript
// 2D segment tree for rectangle sum queries
class SegmentTree2D {
  private tree: number[][];
  private n: number;
  private m: number;

  constructor(matrix: number[][]) {
    this.n = matrix.length;
    this.m = matrix[0]?.length || 0;
    this.tree = Array.from({ length: 4 * this.n }, () =>
      new Array(4 * this.m).fill(0)
    );
    if (this.n > 0 && this.m > 0) {
      this.buildX(matrix, 0, 0, this.n - 1);
    }
  }

  private buildX(matrix: number[][], node: number, start: number, end: number): void {
    if (start === end) {
      this.buildY(matrix, node, start, start, 0, 0, this.m - 1);
    } else {
      const mid = Math.floor((start + end) / 2);
      this.buildX(matrix, 2 * node + 1, start, mid);
      this.buildX(matrix, 2 * node + 2, mid + 1, end);
      this.mergeY(node, 0, 0, this.m - 1);
    }
  }

  private buildY(
    matrix: number[][],
    nodeX: number,
    startX: number,
    endX: number,
    nodeY: number,
    startY: number,
    endY: number
  ): void {
    if (startY === endY) {
      this.tree[nodeX][nodeY] = matrix[startX][startY];
    } else {
      const mid = Math.floor((startY + endY) / 2);
      this.buildY(matrix, nodeX, startX, endX, 2 * nodeY + 1, startY, mid);
      this.buildY(matrix, nodeX, startX, endX, 2 * nodeY + 2, mid + 1, endY);
      this.tree[nodeX][nodeY] =
        this.tree[nodeX][2 * nodeY + 1] + this.tree[nodeX][2 * nodeY + 2];
    }
  }

  // ... (update and query methods follow similar pattern)
}
```

## Segment Tree vs Other Structures

| Structure | Build | Query | Point Update | Range Update |
|-----------|-------|-------|--------------|--------------|
| Array | O(n) | O(n) | O(1) | O(n) |
| Prefix Sum | O(n) | O(1) | O(n) | O(n) |
| Segment Tree | O(n) | O(log n) | O(log n) | O(n log n) |
| Segment Tree + Lazy | O(n) | O(log n) | O(log n) | O(log n) |
| Fenwick Tree | O(n) | O(log n) | O(log n) | O(log n)* |

*With range update variant

## When to Use Segment Trees

**Use segment trees when:**
- Need both range queries AND updates
- Need to answer queries on dynamic data
- Query operations are associative (sum, min, max, GCD)
- Need O(log n) for both operations

**Consider alternatives:**
- Static data, sum queries → Prefix sums
- Only point updates → [Fenwick Trees](/compendium/data-structures/fenwick-trees) (simpler)
- Interval operations only → Interval trees
- Simple min/max → Sparse Table (O(1) query)

## Related Structures

- [Fenwick Trees](/compendium/data-structures/fenwick-trees) - Simpler, for sum/XOR queries
- [Binary Trees](/compendium/data-structures/binary-trees) - Base structure
- Interval Tree - For overlapping interval queries
- Sparse Table - O(1) query, no updates
