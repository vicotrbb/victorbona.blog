---
title: "Skip Lists"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Skip Lists.md"
order: 19
---
A **Skip List** is a probabilistic data structure that allows O(log n) search, insertion, and deletion operations within an ordered sequence. It achieves this by maintaining multiple layers of linked lists, where each higher layer acts as an "express lane" that skips over elements.

* **Intent:** Provide a simpler alternative to balanced trees with probabilistic O(log n) operations and efficient concurrent access.
* **Use Cases:** Redis sorted sets, LevelDB/RocksDB, concurrent data structures, in-memory databases, range queries with updates.
* **Key Properties:**
  - Expected O(log n) for search, insert, delete
  - Simpler implementation than balanced trees
  - Easy to make concurrent (lock-free)
  - Space: O(n) expected

## Structure

```
Level 3: HEAD ─────────────────────────────────────→ 6 ─────────────────→ NIL
Level 2: HEAD ────────→ 3 ─────────────────────────→ 6 ────────→ 9 ─────→ NIL
Level 1: HEAD ────────→ 3 ────────→ 5 ─────────────→ 6 ────────→ 9 ─────→ NIL
Level 0: HEAD → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → NIL

- Level 0 contains all elements (like a regular linked list)
- Higher levels contain progressively fewer elements
- Search starts at highest level and drops down when overshooting
```

## Implementation

```typescript
class SkipListNode<K, V> {
  key: K;
  value: V;
  forward: (SkipListNode<K, V> | null)[];

  constructor(key: K, value: V, level: number) {
    this.key = key;
    this.value = value;
    this.forward = new Array(level + 1).fill(null);
  }
}

class SkipList<K, V> {
  private head: SkipListNode<K, V>;
  private maxLevel: number;
  private currentLevel: number;
  private probability: number;
  private compareFn: (a: K, b: K) => number;

  constructor(
    maxLevel: number = 16,
    probability: number = 0.5,
    compareFn: (a: K, b: K) => number = (a, b) => (a as any) - (b as any)
  ) {
    this.maxLevel = maxLevel;
    this.probability = probability;
    this.currentLevel = 0;
    this.compareFn = compareFn;
    // Head node with sentinel values
    this.head = new SkipListNode<K, V>(null as any, null as any, maxLevel);
  }

  // Randomly determine level for new node
  private randomLevel(): number {
    let level = 0;
    while (Math.random() < this.probability && level < this.maxLevel) {
      level++;
    }
    return level;
  }

  // O(log n) expected - Search
  search(key: K): V | null {
    let current = this.head;

    // Start from highest level and work down
    for (let i = this.currentLevel; i >= 0; i--) {
      while (
        current.forward[i] !== null &&
        this.compareFn(current.forward[i]!.key, key) < 0
      ) {
        current = current.forward[i]!;
      }
    }

    // Move to potential match
    current = current.forward[0]!;

    if (current !== null && this.compareFn(current.key, key) === 0) {
      return current.value;
    }

    return null;
  }

  // O(log n) expected - Insert
  insert(key: K, value: V): void {
    const update: (SkipListNode<K, V> | null)[] = new Array(this.maxLevel + 1).fill(null);
    let current = this.head;

    // Find position at each level
    for (let i = this.currentLevel; i >= 0; i--) {
      while (
        current.forward[i] !== null &&
        this.compareFn(current.forward[i]!.key, key) < 0
      ) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0]!;

    // Update existing key
    if (current !== null && this.compareFn(current.key, key) === 0) {
      current.value = value;
      return;
    }

    // Insert new node
    const newLevel = this.randomLevel();

    // Initialize update pointers for new levels
    if (newLevel > this.currentLevel) {
      for (let i = this.currentLevel + 1; i <= newLevel; i++) {
        update[i] = this.head;
      }
      this.currentLevel = newLevel;
    }

    const newNode = new SkipListNode(key, value, newLevel);

    // Update forward pointers
    for (let i = 0; i <= newLevel; i++) {
      newNode.forward[i] = update[i]!.forward[i];
      update[i]!.forward[i] = newNode;
    }
  }

  // O(log n) expected - Delete
  delete(key: K): boolean {
    const update: (SkipListNode<K, V> | null)[] = new Array(this.maxLevel + 1).fill(null);
    let current = this.head;

    // Find position at each level
    for (let i = this.currentLevel; i >= 0; i--) {
      while (
        current.forward[i] !== null &&
        this.compareFn(current.forward[i]!.key, key) < 0
      ) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    current = current.forward[0]!;

    // Key not found
    if (current === null || this.compareFn(current.key, key) !== 0) {
      return false;
    }

    // Update forward pointers
    for (let i = 0; i <= this.currentLevel; i++) {
      if (update[i]!.forward[i] !== current) {
        break;
      }
      update[i]!.forward[i] = current.forward[i];
    }

    // Reduce level if necessary
    while (this.currentLevel > 0 && this.head.forward[this.currentLevel] === null) {
      this.currentLevel--;
    }

    return true;
  }

  // O(n) - Get all key-value pairs in order
  toArray(): [K, V][] {
    const result: [K, V][] = [];
    let current = this.head.forward[0];

    while (current !== null) {
      result.push([current.key, current.value]);
      current = current.forward[0];
    }

    return result;
  }

  // O(log n + k) - Range query
  range(start: K, end: K): [K, V][] {
    const result: [K, V][] = [];
    let current = this.head;

    // Find starting position
    for (let i = this.currentLevel; i >= 0; i--) {
      while (
        current.forward[i] !== null &&
        this.compareFn(current.forward[i]!.key, start) < 0
      ) {
        current = current.forward[i]!;
      }
    }

    current = current.forward[0]!;

    // Collect elements in range
    while (current !== null && this.compareFn(current.key, end) <= 0) {
      result.push([current.key, current.value]);
      current = current.forward[0]!;
    }

    return result;
  }

  // Get minimum
  min(): [K, V] | null {
    const first = this.head.forward[0];
    return first ? [first.key, first.value] : null;
  }

  // Get maximum
  max(): [K, V] | null {
    let current = this.head;

    for (let i = this.currentLevel; i >= 0; i--) {
      while (current.forward[i] !== null) {
        current = current.forward[i]!;
      }
    }

    return current !== this.head ? [current.key, current.value] : null;
  }
}

// Usage
const skipList = new SkipList<number, string>();

skipList.insert(3, "three");
skipList.insert(1, "one");
skipList.insert(5, "five");
skipList.insert(2, "two");
skipList.insert(4, "four");

console.log(skipList.search(3));      // "three"
console.log(skipList.toArray());      // [[1,"one"], [2,"two"], ...]
console.log(skipList.range(2, 4));    // [[2,"two"], [3,"three"], [4,"four"]]
console.log(skipList.min());          // [1, "one"]
console.log(skipList.max());          // [5, "five"]

skipList.delete(3);
console.log(skipList.search(3));      // null
```

## Time Complexity

| Operation | Expected | Worst Case |
|-----------|----------|------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |
| Range | O(log n + k) | O(n) |
| Min/Max | O(log n) | O(n) |
| Space | O(n) | O(n log n) |

Worst case is extremely rare with proper probability (usually p=0.5 or p=0.25)

## Skip List Analysis

```
Expected levels: log(1/p)(n) ≈ log n

With p = 0.5:
- Level 0: n elements
- Level 1: n/2 elements (expected)
- Level 2: n/4 elements (expected)
- Level k: n/2^k elements (expected)

Expected space: n + n/2 + n/4 + ... = 2n = O(n)

Search path: ~2 × log(n) expected comparisons
```

## Skip List vs Balanced Trees

| Aspect | Skip List | AVL/Red-Black Tree |
|--------|-----------|-------------------|
| Time complexity | O(log n) expected | O(log n) guaranteed |
| Implementation | Simple | Complex |
| Rebalancing | None needed | Required |
| Concurrent access | Easy (lock-free) | Hard |
| Cache performance | Good | Varies |
| Memory | ~2n pointers | ~3n pointers |
| Range queries | Natural | Requires traversal |

## Concurrent Skip List

Skip lists are naturally suited for concurrent access:

```typescript
// Conceptual concurrent skip list
class ConcurrentSkipList<K, V> {
  // Lock-free insert using CAS (Compare-And-Swap)
  // Each node has:
  // - Marked flag for logical deletion
  // - Atomic next pointers

  // Key insight:
  // - Physical structure can be modified while searching
  // - Mark-and-sweep deletion pattern
  // - No global rebalancing needed
}

// Java's ConcurrentSkipListMap uses this approach
// Provides O(log n) operations with concurrent access
```

## Redis Sorted Sets (ZSET)

Redis uses skip lists for its sorted set implementation:

```typescript
// Simplified Redis ZSET operations
class RedisSortedSet {
  private skipList: SkipList<number, string>; // score -> member
  private members: Map<string, number>; // member -> score

  constructor() {
    this.skipList = new SkipList();
    this.members = new Map();
  }

  // ZADD
  add(member: string, score: number): void {
    if (this.members.has(member)) {
      // Update existing
      const oldScore = this.members.get(member)!;
      this.skipList.delete(oldScore);
    }
    this.members.set(member, score);
    this.skipList.insert(score, member);
  }

  // ZSCORE
  score(member: string): number | null {
    return this.members.get(member) ?? null;
  }

  // ZRANK (0-indexed position by score)
  rank(member: string): number | null {
    const score = this.members.get(member);
    if (score === undefined) return null;

    // Count elements with lower score
    let rank = 0;
    for (const [s] of this.skipList.toArray()) {
      if (s < score) rank++;
      else break;
    }
    return rank;
  }

  // ZRANGE (get elements by rank range)
  range(start: number, stop: number): string[] {
    const all = this.skipList.toArray();
    return all.slice(start, stop + 1).map(([, member]) => member);
  }

  // ZRANGEBYSCORE (get elements by score range)
  rangeByScore(min: number, max: number): string[] {
    return this.skipList.range(min, max).map(([, member]) => member);
  }
}
```

## Probability Selection

```
p = 0.5 (50% chance to promote)
- Higher levels, simpler math
- More memory usage
- Faster search (fewer nodes per level)

p = 0.25 (25% chance to promote)
- Lower levels
- Less memory (~1.33n vs 2n pointers)
- Used by Redis

p = 1/e ≈ 0.37
- Theoretically optimal for some metrics
```

## When to Use Skip Lists

**Use skip lists when:**
- Need concurrent access (lock-free algorithms)
- Simplicity is valued over guaranteed bounds
- Implementing ordered maps/sets
- Range queries are common
- Memory usage should be predictable

**Consider alternatives:**
- Guaranteed O(log n) → [Red-Black Trees](/compendium/data-structures/red-black-trees) or [AVL Trees](/compendium/data-structures/avl-trees)
- Disk-based → [B-Trees](/compendium/data-structures/b-trees)
- No ordering needed → [Hash Tables](/compendium/data-structures/hash-tables)
- Only min/max operations → [Heaps](/compendium/data-structures/heaps)

## Related Structures

- [Linked Lists](/compendium/data-structures/linked-lists) - Base structure (level 0)
- [Red-Black Trees](/compendium/data-structures/red-black-trees) - Deterministic alternative
- [AVL Trees](/compendium/data-structures/avl-trees) - Strictly balanced alternative
- [B-Trees](/compendium/data-structures/b-trees) - Disk-optimized alternative
