---
title: "Arrays"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Arrays.md"
order: 1
---
An **Array** is the most fundamental data structure, storing elements in contiguous memory locations. Each element can be accessed directly using an index, providing O(1) random access. Arrays form the building block for many other data structures.

* **Intent:** Store a fixed-size sequential collection of elements of the same type with constant-time access by index.
* **Use Cases:** Storing collections where size is known, matrix operations, implementing other data structures (stacks, queues, heaps), lookup tables, buffers.
* **Key Properties:**
  - Elements stored contiguously in memory (cache-friendly)
  - Fixed size in most languages (dynamic arrays resize automatically)
  - Zero-indexed in most programming languages
  - Homogeneous elements (same type)

## Static vs Dynamic Arrays

**Static Arrays** have a fixed size determined at creation:
```typescript
// Fixed-size array (conceptual - TypeScript uses dynamic arrays)
const fixedArray: number[] = new Array(10);
```

**Dynamic Arrays** (ArrayList, Vector, JavaScript Array) automatically resize:
```typescript
class DynamicArray<T> {
  private data: T[];
  private length: number = 0;
  private capacity: number;

  constructor(initialCapacity: number = 8) {
    this.capacity = initialCapacity;
    this.data = new Array(this.capacity);
  }

  push(element: T): void {
    if (this.length === this.capacity) {
      this.resize(this.capacity * 2); // Double capacity when full
    }
    this.data[this.length] = element;
    this.length++;
  }

  pop(): T | undefined {
    if (this.length === 0) return undefined;
    this.length--;
    const element = this.data[this.length];
    // Shrink if too empty (optional)
    if (this.length < this.capacity / 4 && this.capacity > 8) {
      this.resize(this.capacity / 2);
    }
    return element;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) return undefined;
    return this.data[index];
  }

  set(index: number, value: T): boolean {
    if (index < 0 || index >= this.length) return false;
    this.data[index] = value;
    return true;
  }

  private resize(newCapacity: number): void {
    const newData = new Array(newCapacity);
    for (let i = 0; i < this.length; i++) {
      newData[i] = this.data[i];
    }
    this.data = newData;
    this.capacity = newCapacity;
  }

  size(): number {
    return this.length;
  }
}

// Usage
const arr = new DynamicArray<number>();
arr.push(1);
arr.push(2);
arr.push(3);
console.log(arr.get(1)); // 2
```

## Time Complexity

| Operation | Average | Worst | Notes |
|-----------|---------|-------|-------|
| Access by index | O(1) | O(1) | Direct memory calculation |
| Search (unsorted) | O(n) | O(n) | Linear scan required |
| Search (sorted) | O(log n) | O(log n) | Binary search |
| Insert at end | O(1)* | O(n) | *Amortized; O(n) when resize |
| Insert at index | O(n) | O(n) | Shift elements right |
| Delete at end | O(1) | O(1) | |
| Delete at index | O(n) | O(n) | Shift elements left |

## Common Array Algorithms

**Binary Search (sorted array):**
```typescript
function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // Not found
}
```

**Two Pointer Technique:**
```typescript
// Find pair that sums to target in sorted array
function twoSum(arr: number[], target: number): [number, number] | null {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
```

**Sliding Window:**
```typescript
// Maximum sum of k consecutive elements
function maxSumSubarray(arr: number[], k: number): number {
  if (arr.length < k) return -1;

  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}
```

## Multi-dimensional Arrays

```typescript
// 2D Array (Matrix)
const matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

// Access element at row i, column j
const element = matrix[1][2]; // 6

// Initialize m x n matrix with zeros
function createMatrix(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}
```

## Memory and Cache Considerations

Arrays are **cache-friendly** because elements are stored contiguously. When accessing one element, nearby elements are loaded into CPU cache, making sequential access very fast. This is why arrays often outperform linked lists in practice, even for operations where linked lists have better theoretical complexity.

**Row-major vs Column-major order** matters for multi-dimensional arrays:
- In row-major (C, JavaScript), elements in the same row are contiguous
- Iterating row-by-row is faster than column-by-column

```typescript
// Efficient (row-major access)
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    process(matrix[i][j]);
  }
}

// Inefficient (column-major access in row-major layout)
for (let j = 0; j < cols; j++) {
  for (let i = 0; i < rows; i++) {
    process(matrix[i][j]); // Cache misses
  }
}
```

## When to Use Arrays

**Prefer arrays when:**
- You need fast random access by index
- The size is known or changes infrequently
- You're iterating through elements sequentially
- Memory locality and cache performance matter

**Consider alternatives when:**
- Frequent insertions/deletions in the middle → [Linked Lists](/compendium/data-structures/linked-lists)
- Need fast search without sorting → [Hash Tables](/compendium/data-structures/hash-tables)
- Elements need to stay sorted with frequent updates → [Binary Search Trees](/compendium/data-structures/binary-search-trees)
