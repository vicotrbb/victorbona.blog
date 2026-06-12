---
title: "Hash Sets"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Hash Sets.md"
order: 11
---
A **Hash Set** is a collection that stores unique elements with no duplicates, providing O(1) average time for add, remove, and contains operations. It's implemented using a hash table where elements serve as both keys and values (or keys with a dummy value).

* **Intent:** Provide a collection of unique elements with fast membership testing, insertion, and deletion.
* **Use Cases:** Removing duplicates, membership testing, tracking visited nodes, finding unique elements, set operations (union, intersection, difference), blacklists/whitelists.
* **Key Properties:**
  - No duplicate elements
  - Unordered (iteration order not guaranteed)
  - O(1) average for add, remove, contains
  - Elements must be hashable

## Implementation

```typescript
class HashSet<T> {
  private map: Map<T, boolean> = new Map();

  // O(1) average - Add element
  add(element: T): void {
    this.map.set(element, true);
  }

  // O(1) average - Remove element
  delete(element: T): boolean {
    return this.map.delete(element);
  }

  // O(1) average - Check membership
  has(element: T): boolean {
    return this.map.has(element);
  }

  // O(1) - Get size
  size(): number {
    return this.map.size;
  }

  // O(1) - Clear all elements
  clear(): void {
    this.map.clear();
  }

  // O(n) - Get all elements
  values(): T[] {
    return Array.from(this.map.keys());
  }

  // O(n) - Iterate over elements
  forEach(callback: (element: T) => void): void {
    this.map.forEach((_, key) => callback(key));
  }

  // O(n + m) - Union of two sets
  union(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    this.forEach(el => result.add(el));
    other.forEach(el => result.add(el));
    return result;
  }

  // O(min(n, m)) - Intersection of two sets
  intersection(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    const [smaller, larger] = this.size() < other.size()
      ? [this, other]
      : [other, this];

    smaller.forEach(el => {
      if (larger.has(el)) result.add(el);
    });
    return result;
  }

  // O(n) - Difference (elements in this but not in other)
  difference(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    this.forEach(el => {
      if (!other.has(el)) result.add(el);
    });
    return result;
  }

  // O(n) - Symmetric difference (elements in either but not both)
  symmetricDifference(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    this.forEach(el => {
      if (!other.has(el)) result.add(el);
    });
    other.forEach(el => {
      if (!this.has(el)) result.add(el);
    });
    return result;
  }

  // O(n) - Check if subset
  isSubsetOf(other: HashSet<T>): boolean {
    if (this.size() > other.size()) return false;
    for (const el of this.values()) {
      if (!other.has(el)) return false;
    }
    return true;
  }

  // O(n) - Check if superset
  isSupersetOf(other: HashSet<T>): boolean {
    return other.isSubsetOf(this);
  }
}

// Usage
const set = new HashSet<number>();
set.add(1);
set.add(2);
set.add(3);
set.add(2); // Duplicate ignored
console.log(set.values()); // [1, 2, 3]
console.log(set.has(2));   // true

const setA = new HashSet<number>();
[1, 2, 3, 4].forEach(n => setA.add(n));

const setB = new HashSet<number>();
[3, 4, 5, 6].forEach(n => setB.add(n));

console.log(setA.union(setB).values());        // [1, 2, 3, 4, 5, 6]
console.log(setA.intersection(setB).values()); // [3, 4]
console.log(setA.difference(setB).values());   // [1, 2]
```

## Time Complexity

| Operation | Average | Worst Case |
|-----------|---------|------------|
| add | O(1) | O(n) |
| delete | O(1) | O(n) |
| has/contains | O(1) | O(n) |
| union | O(n + m) | O(n + m) |
| intersection | O(min(n, m)) | O(n * m) |
| difference | O(n) | O(n * m) |
| isSubset | O(n) | O(n * m) |

## Common Hash Set Applications

### Remove Duplicates
```typescript
function removeDuplicates<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 5])); // [1, 2, 3, 4, 5]
```

### Find First Non-Repeating Element
```typescript
function firstUnique<T>(arr: T[]): T | undefined {
  const count = new Map<T, number>();

  for (const item of arr) {
    count.set(item, (count.get(item) || 0) + 1);
  }

  for (const item of arr) {
    if (count.get(item) === 1) return item;
  }

  return undefined;
}

console.log(firstUnique([1, 2, 1, 3, 2, 4])); // 3
```

### Check if Array Has Duplicates
```typescript
function hasDuplicates<T>(arr: T[]): boolean {
  const seen = new Set<T>();
  for (const item of arr) {
    if (seen.has(item)) return true;
    seen.add(item);
  }
  return false;
}

console.log(hasDuplicates([1, 2, 3, 4]));    // false
console.log(hasDuplicates([1, 2, 3, 2]));    // true
```

### Find Common Elements
```typescript
function findCommon<T>(arr1: T[], arr2: T[]): T[] {
  const set1 = new Set(arr1);
  return arr2.filter(item => set1.has(item));
}

console.log(findCommon([1, 2, 3, 4], [3, 4, 5, 6])); // [3, 4]
```

### Track Visited Nodes (Graph/Tree Traversal)
```typescript
function bfs(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>();
  const result: number[] = [];
  const queue: number[] = [start];

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

### Longest Consecutive Sequence
```typescript
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let maxLength = 0;

  for (const num of set) {
    // Only start counting from sequence start
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentLength = 1;

      while (set.has(currentNum + 1)) {
        currentNum++;
        currentLength++;
      }

      maxLength = Math.max(maxLength, currentLength);
    }
  }

  return maxLength;
}

console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4 (sequence: 1,2,3,4)
```

### Happy Number
```typescript
function isHappy(n: number): boolean {
  const seen = new Set<number>();

  while (n !== 1 && !seen.has(n)) {
    seen.add(n);
    n = sumOfSquares(n);
  }

  return n === 1;
}

function sumOfSquares(n: number): number {
  let sum = 0;
  while (n > 0) {
    const digit = n % 10;
    sum += digit * digit;
    n = Math.floor(n / 10);
  }
  return sum;
}

console.log(isHappy(19)); // true (19 -> 82 -> 68 -> 100 -> 1)
console.log(isHappy(2));  // false (cycles)
```

### Find Missing Number
```typescript
function findMissing(nums: number[], n: number): number[] {
  const set = new Set(nums);
  const missing: number[] = [];

  for (let i = 1; i <= n; i++) {
    if (!set.has(i)) {
      missing.push(i);
    }
  }

  return missing;
}

console.log(findMissing([1, 2, 4, 6, 7], 7)); // [3, 5]
```

## Set vs Other Data Structures

| Feature | Hash Set | Sorted Set (Tree) | Array |
|---------|----------|-------------------|-------|
| Add | O(1) avg | O(log n) | O(1)* |
| Delete | O(1) avg | O(log n) | O(n) |
| Contains | O(1) avg | O(log n) | O(n) |
| Ordered | No | Yes | By index |
| Min/Max | O(n) | O(1)/O(log n) | O(n) |
| Duplicates | No | No | Yes |

*At end; O(n) to check duplicates

## Ordered Sets (TreeSet)

When you need ordered iteration or range operations, use a tree-based set:

```typescript
// Conceptual - JavaScript doesn't have built-in TreeSet
// Use a BST or library like 'sorted-set'
class TreeSet<T> {
  // Implemented using Red-Black Tree or AVL Tree
  // See [Red-Black Trees](/compendium/data-structures/red-black-trees) or [AVL Trees](/compendium/data-structures/avl-trees)
}
```

## When to Use Hash Sets

**Use hash sets when:**
- Need to check membership frequently
- Removing duplicates from a collection
- Tracking visited/seen elements
- Performing set operations (union, intersection)
- Order doesn't matter

**Consider alternatives when:**
- Need ordered iteration → TreeSet (see [Red-Black Trees](/compendium/data-structures/red-black-trees))
- Need to store key-value pairs → [Hash Tables](/compendium/data-structures/hash-tables)
- Memory is very limited → [Bloom Filters](/compendium/data-structures/bloom-filters) (probabilistic)
- Need multiset (allow duplicates with count) → [Hash Tables](/compendium/data-structures/hash-tables) with count values
