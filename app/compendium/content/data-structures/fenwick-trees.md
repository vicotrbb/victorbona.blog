---
title: "Fenwick Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Fenwick Trees.md"
order: 9
---
A **Fenwick Tree** (also called Binary Indexed Tree or BIT) is a data structure that efficiently supports prefix sum queries and point updates on an array. It achieves O(log n) for both operations using a clever bit manipulation technique, with less memory overhead than segment trees.

* **Intent:** Provide efficient prefix sum queries and point updates with minimal space overhead.
* **Use Cases:** Running frequency counts, cumulative statistics, range sum queries, inversion counting, 2D cumulative queries, competitive programming.
* **Key Properties:**
  - O(log n) for query and update
  - Uses array of size n+1 (1-indexed)
  - Each index stores sum of specific range based on lowest set bit
  - Simpler than segment trees for sum queries

## The Key Insight

Each index `i` is responsible for elements in range `[i - lowbit(i) + 1, i]`:

```
lowbit(i) = i & (-i)  // Lowest set bit

Index:  1    2    3    4    5    6    7    8
Binary: 001  010  011  100  101  110  111  1000
Lowbit: 1    2    1    4    1    2    1    8

Index 1 covers [1,1]   (1 element)
Index 2 covers [1,2]   (2 elements)
Index 3 covers [3,3]   (1 element)
Index 4 covers [1,4]   (4 elements)
Index 5 covers [5,5]   (1 element)
Index 6 covers [5,6]   (2 elements)
Index 7 covers [7,7]   (1 element)
Index 8 covers [1,8]   (8 elements)
```

## Visual Representation

```
Array:    [_, 1, 3, 2, 5, 4, 6, 3, 7]  (1-indexed, index 0 unused)
BIT:      [_, 1, 4, 2, 10, 4, 10, 3, 30]

BIT[1] = A[1] = 1
BIT[2] = A[1] + A[2] = 4
BIT[3] = A[3] = 2
BIT[4] = A[1] + A[2] + A[3] + A[4] = 10
BIT[5] = A[5] = 4
BIT[6] = A[5] + A[6] = 10
BIT[7] = A[7] = 3
BIT[8] = A[1] + ... + A[8] = 30

Query prefix sum [1,6]:
  BIT[6] + BIT[4] = 10 + 10 = 20
  Path: 6 (110) → 4 (100) → 0
```

## Implementation

```typescript
class FenwickTree {
  private tree: number[];
  private n: number;

  constructor(n: number);
  constructor(arr: number[]);
  constructor(arg: number | number[]) {
    if (typeof arg === 'number') {
      this.n = arg;
      this.tree = new Array(this.n + 1).fill(0);
    } else {
      this.n = arg.length;
      this.tree = new Array(this.n + 1).fill(0);
      // Build from array
      for (let i = 0; i < arg.length; i++) {
        this.update(i + 1, arg[i]);
      }
    }
  }

  // Get lowest set bit
  private lowbit(i: number): number {
    return i & (-i);
  }

  // O(log n) - Add delta to index i (1-indexed)
  update(i: number, delta: number): void {
    while (i <= this.n) {
      this.tree[i] += delta;
      i += this.lowbit(i);
    }
  }

  // O(log n) - Get prefix sum [1, i]
  prefixSum(i: number): number {
    let sum = 0;
    while (i > 0) {
      sum += this.tree[i];
      i -= this.lowbit(i);
    }
    return sum;
  }

  // O(log n) - Get range sum [left, right] (1-indexed)
  rangeSum(left: number, right: number): number {
    return this.prefixSum(right) - this.prefixSum(left - 1);
  }

  // O(log n) - Set value at index (not add)
  set(i: number, value: number): void {
    const current = this.rangeSum(i, i);
    this.update(i, value - current);
  }
}

// Usage (1-indexed)
const bit = new FenwickTree([1, 3, 2, 5, 4, 6, 3, 7]);
console.log(bit.prefixSum(6));    // 21 (1+3+2+5+4+6)
console.log(bit.rangeSum(3, 6));  // 17 (2+5+4+6)
bit.update(4, 3);                 // Add 3 to index 4
console.log(bit.rangeSum(3, 6));  // 20 (2+8+4+6)
```

### 0-Indexed Wrapper
```typescript
class FenwickTree0Indexed {
  private bit: FenwickTree;

  constructor(n: number);
  constructor(arr: number[]);
  constructor(arg: number | number[]) {
    if (typeof arg === 'number') {
      this.bit = new FenwickTree(arg);
    } else {
      this.bit = new FenwickTree(arg);
    }
  }

  // 0-indexed update
  update(i: number, delta: number): void {
    this.bit.update(i + 1, delta);
  }

  // 0-indexed prefix sum [0, i]
  prefixSum(i: number): number {
    return this.bit.prefixSum(i + 1);
  }

  // 0-indexed range sum [left, right]
  rangeSum(left: number, right: number): number {
    return this.bit.rangeSum(left + 1, right + 1);
  }
}
```

## Fenwick Tree with Range Updates

```typescript
class FenwickTreeRangeUpdate {
  private bit1: FenwickTree;
  private bit2: FenwickTree;
  private n: number;

  constructor(n: number) {
    this.n = n;
    this.bit1 = new FenwickTree(n);
    this.bit2 = new FenwickTree(n);
  }

  // O(log n) - Add value to range [left, right]
  rangeUpdate(left: number, right: number, value: number): void {
    this.bit1.update(left, value);
    this.bit1.update(right + 1, -value);
    this.bit2.update(left, value * (left - 1));
    this.bit2.update(right + 1, -value * right);
  }

  // O(log n) - Get prefix sum [1, i]
  prefixSum(i: number): number {
    return this.bit1.prefixSum(i) * i - this.bit2.prefixSum(i);
  }

  // O(log n) - Get range sum [left, right]
  rangeSum(left: number, right: number): number {
    return this.prefixSum(right) - this.prefixSum(left - 1);
  }
}
```

## 2D Fenwick Tree

```typescript
class FenwickTree2D {
  private tree: number[][];
  private rows: number;
  private cols: number;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.tree = Array.from({ length: rows + 1 }, () =>
      new Array(cols + 1).fill(0)
    );
  }

  private lowbit(i: number): number {
    return i & (-i);
  }

  // O(log(n) * log(m)) - Update point (r, c)
  update(r: number, c: number, delta: number): void {
    for (let i = r; i <= this.rows; i += this.lowbit(i)) {
      for (let j = c; j <= this.cols; j += this.lowbit(j)) {
        this.tree[i][j] += delta;
      }
    }
  }

  // O(log(n) * log(m)) - Prefix sum from (1,1) to (r,c)
  prefixSum(r: number, c: number): number {
    let sum = 0;
    for (let i = r; i > 0; i -= this.lowbit(i)) {
      for (let j = c; j > 0; j -= this.lowbit(j)) {
        sum += this.tree[i][j];
      }
    }
    return sum;
  }

  // O(log(n) * log(m)) - Rectangle sum from (r1,c1) to (r2,c2)
  rectangleSum(r1: number, c1: number, r2: number, c2: number): number {
    return (
      this.prefixSum(r2, c2) -
      this.prefixSum(r1 - 1, c2) -
      this.prefixSum(r2, c1 - 1) +
      this.prefixSum(r1 - 1, c1 - 1)
    );
  }
}

// Usage
const bit2d = new FenwickTree2D(4, 4);
// Add values
bit2d.update(1, 1, 1);
bit2d.update(2, 2, 2);
bit2d.update(3, 3, 3);
console.log(bit2d.rectangleSum(1, 1, 3, 3)); // 6
```

## Time Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n log n) | O(n) |
| Point Update | O(log n) | - |
| Prefix Sum | O(log n) | - |
| Range Sum | O(log n) | - |
| Range Update (special) | O(log n) | O(n) extra |

## Classic Applications

### Count Inversions
```typescript
function countInversions(arr: number[]): number {
  // Coordinate compression
  const sorted = [...arr].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i + 1]));
  const n = arr.length;

  const bit = new FenwickTree(n);
  let inversions = 0;

  // Process from right to left
  for (let i = n - 1; i >= 0; i--) {
    const r = rank.get(arr[i])!;
    // Count elements smaller than current that we've seen
    inversions += bit.prefixSum(r - 1);
    // Mark current element as seen
    bit.update(r, 1);
  }

  return inversions;
}

console.log(countInversions([2, 4, 1, 3, 5])); // 3 (pairs: (2,1), (4,1), (4,3))
```

### Range Sum Queries - Mutable
```typescript
class NumArray {
  private bit: FenwickTree;
  private nums: number[];

  constructor(nums: number[]) {
    this.nums = [...nums];
    this.bit = new FenwickTree(nums);
  }

  update(index: number, val: number): void {
    const delta = val - this.nums[index];
    this.nums[index] = val;
    this.bit.update(index + 1, delta);
  }

  sumRange(left: number, right: number): number {
    return this.bit.rangeSum(left + 1, right + 1);
  }
}

const numArray = new NumArray([1, 3, 5]);
console.log(numArray.sumRange(0, 2)); // 9
numArray.update(1, 2);
console.log(numArray.sumRange(0, 2)); // 8
```

### Count of Range Sum
```typescript
function countRangeSum(nums: number[], lower: number, upper: number): number {
  const prefixSums: number[] = [0];
  for (const num of nums) {
    prefixSums.push(prefixSums[prefixSums.length - 1] + num);
  }

  // Sort and compress coordinates
  const sorted = [...new Set([
    ...prefixSums,
    ...prefixSums.map(p => p - lower),
    ...prefixSums.map(p => p - upper)
  ])].sort((a, b) => a - b);

  const rank = new Map(sorted.map((v, i) => [v, i + 1]));
  const bit = new FenwickTree(sorted.length);

  let count = 0;

  for (const prefix of prefixSums) {
    // Count prefix sums in range [prefix - upper, prefix - lower]
    const lo = rank.get(prefix - upper)!;
    const hi = rank.get(prefix - lower)!;
    count += bit.rangeSum(lo, hi);
    bit.update(rank.get(prefix)!, 1);
  }

  return count;
}
```

## Fenwick Tree vs Segment Tree

| Aspect | Fenwick Tree | Segment Tree |
|--------|--------------|--------------|
| Space | n + 1 | 2n to 4n |
| Code complexity | Simple | More complex |
| Prefix queries | Yes | Yes |
| Arbitrary range | Via prefix difference | Direct |
| Range updates | With modification | With lazy propagation |
| Min/Max queries | Limited* | Yes |
| Flexibility | Sum, XOR operations | Any associative operation |

*Fenwick tree works best with invertible operations (sum, XOR)

## When to Use Fenwick Trees

**Use Fenwick trees when:**
- Need prefix sum queries with point updates
- Operations are invertible (sum, XOR)
- Want simpler code than segment trees
- Memory is a concern
- Competitive programming (quick to implement)

**Use Segment Trees instead when:**
- Need min/max queries
- Need arbitrary range queries directly
- Need range updates with lazy propagation
- Operations are not invertible

## Related Structures

- [Segment Trees](/compendium/data-structures/segment-trees) - More flexible, handles more operations
- [Arrays](/compendium/data-structures/arrays) - O(n) query, O(1) update baseline
- Prefix Sum Array - O(1) query, O(n) update (static)
- Sparse Table - O(1) query for min/max (static)
