---
title: "Heaps"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Heaps.md"
order: 13
---
A **Heap** is a specialized tree-based data structure that satisfies the heap property: in a max-heap, every parent node is greater than or equal to its children; in a min-heap, every parent is less than or equal to its children. Heaps are commonly implemented as arrays and are the foundation of the heap sort algorithm and priority queues.

* **Intent:** Provide efficient access to the maximum (or minimum) element while supporting fast insertion and deletion.
* **Use Cases:** Priority queues, heap sort, scheduling algorithms, graph algorithms (Dijkstra's, Prim's), finding k largest/smallest elements, median maintenance.
* **Key Properties:**
  - Complete binary tree (filled left to right)
  - Parent-child relationship (heap property)
  - O(1) access to max/min element
  - O(log n) insertion and extraction

## Heap Property

```
Max-Heap: Parent ≥ Children
       90
      /  \
    80    70
   / \   /
  50 60 65

Min-Heap: Parent ≤ Children
       10
      /  \
    20    30
   / \   /
  50 40 35
```

## Array Representation

```
For node at index i:
- Parent: Math.floor((i - 1) / 2)
- Left child: 2 * i + 1
- Right child: 2 * i + 2

Array: [90, 80, 70, 50, 60, 65]
Tree:
       90 (0)
      /     \
    80 (1)  70 (2)
   /    \     /
  50(3) 60(4) 65(5)
```

## Implementation

### Min-Heap
```typescript
class MinHeap<T> {
  private heap: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.compareFn = compareFn;
  }

  private parent(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChild(i: number): number {
    return 2 * i + 1;
  }

  private rightChild(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j] ] = [this.heap[j], this.heap[i] ];
  }

  // O(log n) - Insert element
  insert(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = this.parent(index);
      if (this.compareFn(this.heap[index], this.heap[parentIdx]) < 0) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  // O(1) - View minimum element
  peek(): T | undefined {
    return this.heap[0];
  }

  // O(log n) - Extract minimum element
  extractMin(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const left = this.leftChild(index);
      const right = this.rightChild(index);
      let smallest = index;

      if (left < length && this.compareFn(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compareFn(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  // O(n) - Build heap from array
  static heapify<T>(arr: T[], compareFn?: (a: T, b: T) => number): MinHeap<T> {
    const heap = new MinHeap<T>(compareFn);
    heap.heap = [...arr];

    // Start from last non-leaf node
    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      heap.bubbleDown(i);
    }

    return heap;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}

// Usage
const minHeap = new MinHeap<number>();
[5, 3, 8, 1, 2].forEach(n => minHeap.insert(n));

console.log(minHeap.peek());       // 1
console.log(minHeap.extractMin()); // 1
console.log(minHeap.extractMin()); // 2
console.log(minHeap.extractMin()); // 3
```

### Max-Heap
```typescript
class MaxHeap<T> {
  private heap: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    // Negate comparison for max-heap behavior
    this.compareFn = (a, b) => -compareFn(a, b);
  }

  // Same implementation as MinHeap, but with inverted comparison
  // ... (insert, extractMax, etc.)

  private parent(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChild(i: number): number {
    return 2 * i + 1;
  }

  private rightChild(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j] ] = [this.heap[j], this.heap[i] ];
  }

  insert(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = this.parent(index);
      if (this.compareFn(this.heap[index], this.heap[parentIdx]) < 0) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  extractMax(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return max;
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const left = this.leftChild(index);
      const right = this.rightChild(index);
      let largest = index;

      if (left < length && this.compareFn(this.heap[left], this.heap[largest]) < 0) {
        largest = left;
      }
      if (right < length && this.compareFn(this.heap[right], this.heap[largest]) < 0) {
        largest = right;
      }

      if (largest !== index) {
        this.swap(index, largest);
        index = largest;
      } else {
        break;
      }
    }
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}
```

## Time Complexity

| Operation | Time |
|-----------|------|
| peek (min/max) | O(1) |
| insert | O(log n) |
| extract (min/max) | O(log n) |
| heapify (build) | O(n) |
| search | O(n) |

## Classic Heap Applications

### Heap Sort
```typescript
function heapSort(arr: number[]): number[] {
  const n = arr.length;

  // Build max-heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapifyDown(arr, n, i);
  }

  // Extract elements one by one
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i] ] = [arr[i], arr[0] ];
    heapifyDown(arr, i, 0);
  }

  return arr;
}

function heapifyDown(arr: number[], n: number, i: number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;

  if (largest !== i) {
    [arr[i], arr[largest] ] = [arr[largest], arr[i] ];
    heapifyDown(arr, n, largest);
  }
}

console.log(heapSort([64, 34, 25, 12, 22, 11, 90]));
// [11, 12, 22, 25, 34, 64, 90]
```

### K Largest Elements
```typescript
function kLargest(arr: number[], k: number): number[] {
  // Use min-heap of size k
  const minHeap = new MinHeap<number>();

  for (const num of arr) {
    if (minHeap.size() < k) {
      minHeap.insert(num);
    } else if (num > minHeap.peek()!) {
      minHeap.extractMin();
      minHeap.insert(num);
    }
  }

  const result: number[] = [];
  while (!minHeap.isEmpty()) {
    result.push(minHeap.extractMin()!);
  }
  return result.reverse();
}

console.log(kLargest([3, 1, 4, 1, 5, 9, 2, 6], 3)); // [9, 6, 5]
```

### Merge K Sorted Arrays
```typescript
function mergeKSortedArrays(arrays: number[][]): number[] {
  const minHeap = new MinHeap<{ val: number; arrIdx: number; idx: number }>(
    (a, b) => a.val - b.val
  );

  // Initialize with first element from each array
  for (let i = 0; i < arrays.length; i++) {
    if (arrays[i].length > 0) {
      minHeap.insert({ val: arrays[i][0], arrIdx: i, idx: 0 });
    }
  }

  const result: number[] = [];

  while (!minHeap.isEmpty()) {
    const { val, arrIdx, idx } = minHeap.extractMin()!;
    result.push(val);

    // Add next element from same array
    if (idx + 1 < arrays[arrIdx].length) {
      minHeap.insert({
        val: arrays[arrIdx][idx + 1],
        arrIdx,
        idx: idx + 1
      });
    }
  }

  return result;
}

console.log(mergeKSortedArrays([ [1, 4, 7], [2, 5, 8], [3, 6, 9] ]));
// [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### Running Median
```typescript
class MedianFinder {
  private maxHeap: MaxHeap<number>; // Lower half
  private minHeap: MinHeap<number>; // Upper half

  constructor() {
    this.maxHeap = new MaxHeap();
    this.minHeap = new MinHeap();
  }

  addNum(num: number): void {
    // Add to max-heap first
    this.maxHeap.insert(num);

    // Balance: move max from lower half to upper half
    this.minHeap.insert(this.maxHeap.extractMax()!);

    // Ensure lower half has equal or one more element
    if (this.maxHeap.size() < this.minHeap.size()) {
      this.maxHeap.insert(this.minHeap.extractMin()!);
    }
  }

  findMedian(): number {
    if (this.maxHeap.size() > this.minHeap.size()) {
      return this.maxHeap.peek()!;
    }
    return (this.maxHeap.peek()! + this.minHeap.peek()!) / 2;
  }
}

const mf = new MedianFinder();
mf.addNum(1);
console.log(mf.findMedian()); // 1
mf.addNum(2);
console.log(mf.findMedian()); // 1.5
mf.addNum(3);
console.log(mf.findMedian()); // 2
```

### Task Scheduler with Priority
```typescript
interface Task {
  id: string;
  priority: number;
  action: () => void;
}

class TaskScheduler {
  private taskQueue: MaxHeap<Task>;

  constructor() {
    this.taskQueue = new MaxHeap<Task>((a, b) => a.priority - b.priority);
  }

  addTask(id: string, priority: number, action: () => void): void {
    this.taskQueue.insert({ id, priority, action });
  }

  runNext(): void {
    const task = this.taskQueue.extractMax();
    if (task) {
      console.log(`Running task ${task.id} with priority ${task.priority}`);
      task.action();
    }
  }

  runAll(): void {
    while (!this.taskQueue.isEmpty()) {
      this.runNext();
    }
  }
}
```

## Dijkstra's Algorithm (Min-Heap)
```typescript
function dijkstra(
  graph: Map<number, [number, number][]>, // node -> [(neighbor, weight)]
  start: number
): Map<number, number> {
  const distances = new Map<number, number>();
  const minHeap = new MinHeap<[number, number]>((a, b) => a[1] - b[1]);

  minHeap.insert([start, 0]);

  while (!minHeap.isEmpty()) {
    const [node, dist] = minHeap.extractMin()!;

    if (distances.has(node)) continue;
    distances.set(node, dist);

    for (const [neighbor, weight] of graph.get(node) || []) {
      if (!distances.has(neighbor)) {
        minHeap.insert([neighbor, dist + weight]);
      }
    }
  }

  return distances;
}
```

## When to Use Heaps

**Use heaps when:**
- Need quick access to min/max element
- Processing elements by priority
- Implementing priority queues
- Finding k largest/smallest elements
- Graph algorithms (Dijkstra, Prim)

**Consider alternatives:**
- Need sorted iteration → [Binary Search Trees](/compendium/data-structures/binary-search-trees)
- Need all elements sorted → Sort array
- Need arbitrary access → [Arrays](/compendium/data-structures/arrays)
- Need deque operations → [Queues](/compendium/data-structures/queues) (deque variant)
