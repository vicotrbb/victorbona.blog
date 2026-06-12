---
title: "Hash Tables"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Hash Tables.md"
order: 12
---
A **Hash Table** (also called Hash Map or Dictionary) is a data structure that stores key-value pairs and provides near-constant time O(1) average case for insertion, deletion, and lookup operations. It uses a hash function to compute an index into an array of buckets where the value is stored.

* **Intent:** Provide fast key-based access to values by mapping keys to array indices using a hash function.
* **Use Cases:** Caching, database indexing, symbol tables in compilers, counting frequencies, detecting duplicates, implementing sets, memoization, routing tables.
* **Key Properties:**
  - Average O(1) for insert, delete, lookup
  - Unordered (iteration order not guaranteed)
  - Keys must be hashable and unique
  - Memory overhead for handling collisions

## How Hash Tables Work

1. **Hash Function**: Converts a key into an integer (hash code)
2. **Index Calculation**: `index = hashCode % arraySize`
3. **Storage**: Value stored at calculated index
4. **Collision Handling**: When two keys hash to same index

```
Key "apple" → hash("apple") = 394892 → 394892 % 10 = 2 → store at index 2
Key "banana" → hash("banana") = 203847 → 203847 % 10 = 7 → store at index 7
```

## Implementation

### Hash Table with Chaining
Collisions handled by storing multiple items in a linked list at each bucket.

```typescript
class HashNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public next: HashNode<K, V> | null = null
  ) {}
}

class HashMap<K, V> {
  private buckets: (HashNode<K, V> | null)[];
  private size: number = 0;
  private capacity: number;
  private loadFactorThreshold: number = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.buckets = new Array(this.capacity).fill(null);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash % this.capacity;
  }

  // O(1) average - Insert or update
  set(key: K, value: V): void {
    if (this.size / this.capacity >= this.loadFactorThreshold) {
      this.resize();
    }

    const index = this.hash(key);
    let node = this.buckets[index];

    // Check if key exists
    while (node) {
      if (node.key === key) {
        node.value = value;
        return;
      }
      node = node.next;
    }

    // Insert at head of chain
    const newNode = new HashNode(key, value, this.buckets[index]);
    this.buckets[index] = newNode;
    this.size++;
  }

  // O(1) average - Retrieve value
  get(key: K): V | undefined {
    const index = this.hash(key);
    let node = this.buckets[index];

    while (node) {
      if (node.key === key) {
        return node.value;
      }
      node = node.next;
    }

    return undefined;
  }

  // O(1) average - Check existence
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  // O(1) average - Remove key
  delete(key: K): boolean {
    const index = this.hash(key);
    let node = this.buckets[index];
    let prev: HashNode<K, V> | null = null;

    while (node) {
      if (node.key === key) {
        if (prev) {
          prev.next = node.next;
        } else {
          this.buckets[index] = node.next;
        }
        this.size--;
        return true;
      }
      prev = node;
      node = node.next;
    }

    return false;
  }

  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = new Array(this.capacity).fill(null);
    this.size = 0;

    for (const bucket of oldBuckets) {
      let node = bucket;
      while (node) {
        this.set(node.key, node.value);
        node = node.next;
      }
    }
  }

  getSize(): number {
    return this.size;
  }

  keys(): K[] {
    const result: K[] = [];
    for (const bucket of this.buckets) {
      let node = bucket;
      while (node) {
        result.push(node.key);
        node = node.next;
      }
    }
    return result;
  }
}

// Usage
const map = new HashMap<string, number>();
map.set("apple", 5);
map.set("banana", 3);
map.set("cherry", 7);
console.log(map.get("banana")); // 3
map.delete("banana");
console.log(map.has("banana")); // false
```

### Open Addressing (Linear Probing)
Collisions handled by finding next available slot.

```typescript
class OpenAddressHashMap<K, V> {
  private keys: (K | undefined | null)[];
  private values: (V | undefined)[];
  private size: number = 0;
  private capacity: number;
  private DELETED = Symbol('deleted') as unknown as K;

  constructor(capacity: number = 16) {
    this.capacity = capacity;
    this.keys = new Array(capacity).fill(undefined);
    this.values = new Array(capacity).fill(undefined);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash % this.capacity;
  }

  set(key: K, value: V): void {
    if (this.size >= this.capacity * 0.7) {
      this.resize();
    }

    let index = this.hash(key);
    let i = 0;

    while (i < this.capacity) {
      const currentKey = this.keys[index];

      if (currentKey === undefined || currentKey === this.DELETED) {
        this.keys[index] = key;
        this.values[index] = value;
        this.size++;
        return;
      }

      if (currentKey === key) {
        this.values[index] = value;
        return;
      }

      index = (index + 1) % this.capacity; // Linear probing
      i++;
    }
  }

  get(key: K): V | undefined {
    let index = this.hash(key);
    let i = 0;

    while (i < this.capacity) {
      const currentKey = this.keys[index];

      if (currentKey === undefined) {
        return undefined;
      }

      if (currentKey === key) {
        return this.values[index];
      }

      index = (index + 1) % this.capacity;
      i++;
    }

    return undefined;
  }

  delete(key: K): boolean {
    let index = this.hash(key);
    let i = 0;

    while (i < this.capacity) {
      if (this.keys[index] === key) {
        this.keys[index] = this.DELETED;
        this.values[index] = undefined;
        this.size--;
        return true;
      }

      if (this.keys[index] === undefined) {
        return false;
      }

      index = (index + 1) % this.capacity;
      i++;
    }

    return false;
  }

  private resize(): void {
    const oldKeys = this.keys;
    const oldValues = this.values;
    this.capacity *= 2;
    this.keys = new Array(this.capacity).fill(undefined);
    this.values = new Array(this.capacity).fill(undefined);
    this.size = 0;

    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== undefined && oldKeys[i] !== this.DELETED) {
        this.set(oldKeys[i] as K, oldValues[i] as V);
      }
    }
  }
}
```

## Collision Resolution Strategies

| Strategy | Pros | Cons |
|----------|------|------|
| **Chaining** | Simple, handles high load | Extra memory for links |
| **Linear Probing** | Cache-friendly | Clustering issues |
| **Quadratic Probing** | Reduces clustering | Secondary clustering |
| **Double Hashing** | Best distribution | More computation |

## Time Complexity

| Operation | Average | Worst Case |
|-----------|---------|------------|
| Insert | O(1) | O(n) |
| Delete | O(1) | O(n) |
| Search | O(1) | O(n) |
| Space | O(n) | O(n) |

Worst case occurs when all keys hash to the same bucket (poor hash function or adversarial input).

## Hash Function Properties

A good hash function should have:
1. **Deterministic**: Same key always produces same hash
2. **Uniform Distribution**: Keys spread evenly across buckets
3. **Fast Computation**: Quick to calculate
4. **Avalanche Effect**: Small key changes cause large hash changes

```typescript
// Simple string hash (djb2)
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
}

// FNV-1a hash
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}
```

## Common Hash Table Applications

### Frequency Counter
```typescript
function countFrequency<T>(items: T[]): Map<T, number> {
  const freq = new Map<T, number>();
  for (const item of items) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }
  return freq;
}

console.log(countFrequency(['a', 'b', 'a', 'c', 'a', 'b']));
// Map { 'a' => 3, 'b' => 2, 'c' => 1 }
```

### Two Sum Problem
```typescript
function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }
    seen.set(nums[i], i);
  }

  return null;
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
```

### Group Anagrams
```typescript
function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();

  for (const str of strs) {
    const key = str.split('').sort().join('');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(str);
  }

  return Array.from(groups.values());
}

console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
```

### LRU Cache (with Hash Map)
```typescript
// See [[LRU Cache]] for full implementation
// Hash map provides O(1) lookup
// Doubly linked list provides O(1) reordering
```

### Memoization
```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(50)); // Fast due to memoization
```

## Load Factor and Resizing

**Load Factor** = number of entries / number of buckets

- Low load factor (&lt; 0.5): Wastes memory
- High load factor (&gt; 0.75): More collisions, slower operations
- Typical threshold: 0.75 (resize when exceeded)

Resizing involves:
1. Creating a larger array (typically 2x)
2. Rehashing all existing entries
3. Cost: O(n), but amortized O(1) per insertion

## Hash Tables vs Other Structures

| Feature | Hash Table | BST | Array |
|---------|------------|-----|-------|
| Search | O(1) avg | O(log n) | O(n) |
| Insert | O(1) avg | O(log n) | O(n) |
| Delete | O(1) avg | O(log n) | O(n) |
| Ordered | No | Yes | By index |
| Min/Max | O(n) | O(log n) | O(n) |
| Range query | O(n) | O(log n + k) | O(n) |

## When to Use Hash Tables

**Use hash tables when:**
- Need fast key-based lookup
- Order doesn't matter
- Keys are hashable
- Counting occurrences
- Detecting duplicates
- Caching computed values

**Consider alternatives when:**
- Need ordered traversal → [Red-Black Trees](/compendium/data-structures/red-black-trees) or [AVL Trees](/compendium/data-structures/avl-trees)
- Need range queries → [Binary Search Trees](/compendium/data-structures/binary-search-trees)
- Need min/max operations → [Heaps](/compendium/data-structures/heaps)
- Memory is very constrained → [Arrays](/compendium/data-structures/arrays)
- Need probabilistic membership → [Bloom Filters](/compendium/data-structures/bloom-filters)
