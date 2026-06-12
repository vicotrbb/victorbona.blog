---
title: "LRU Cache"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/LRU Cache.md"
order: 15
---
An **LRU (Least Recently Used) Cache** is a data structure that stores a limited number of items and evicts the least recently used item when the cache reaches capacity. It combines a hash map for O(1) lookups with a doubly linked list for O(1) ordering updates.

* **Intent:** Provide a fixed-size cache with O(1) get and put operations that automatically evicts the least recently accessed items.
* **Use Cases:** Web browser cache, database query cache, DNS cache, page replacement in OS, memoization with memory limits, API response caching.
* **Key Properties:**
  - O(1) get and put operations
  - Fixed capacity with automatic eviction
  - Most recently used items stay in cache
  - Combines hash map + doubly linked list

## How It Works

```
Capacity: 3

Operations:
1. put(1, "A") → [1]
2. put(2, "B") → [2, 1]
3. put(3, "C") → [3, 2, 1]
4. get(1)      → [1, 3, 2]  (1 moved to front)
5. put(4, "D") → [4, 1, 3]  (2 evicted - least recently used)
6. get(2)      → null (was evicted)

Most Recent ←→ Least Recent
[HEAD] ↔ [4] ↔ [1] ↔ [3] ↔ [TAIL]
```

## Implementation

```typescript
class LRUNode<K, V> {
  key: K;
  value: V;
  prev: LRUNode<K, V> | null = null;
  next: LRUNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, LRUNode<K, V>> = new Map();
  private head: LRUNode<K, V>; // Most recently used
  private tail: LRUNode<K, V>; // Least recently used

  constructor(capacity: number) {
    this.capacity = capacity;
    // Dummy head and tail for easier list manipulation
    this.head = new LRUNode<K, V>(null as any, null as any);
    this.tail = new LRUNode<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // O(1) - Get value and mark as recently used
  get(key: K): V | null {
    const node = this.cache.get(key);
    if (!node) return null;

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  // O(1) - Put value and mark as recently used
  put(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing
      existingNode.value = value;
      this.moveToFront(existingNode);
    } else {
      // Add new
      const newNode = new LRUNode(key, value);

      this.cache.set(key, newNode);
      this.addToFront(newNode);

      // Evict if over capacity
      if (this.cache.size > this.capacity) {
        this.evictLRU();
      }
    }
  }

  // O(1) - Remove key
  remove(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.removeNode(node);
    this.cache.delete(key);
    return true;
  }

  // Add node right after head
  private addToFront(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  // Remove node from current position
  private removeNode(node: LRUNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  // Move existing node to front
  private moveToFront(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToFront(node);
  }

  // Remove least recently used (node before tail)
  private evictLRU(): void {
    const lru = this.tail.prev!;
    this.removeNode(lru);
    this.cache.delete(lru.key);
  }

  // Get current size
  size(): number {
    return this.cache.size;
  }

  // Check if key exists (without updating recency)
  has(key: K): boolean {
    return this.cache.has(key);
  }

  // Clear the cache
  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // Get all keys in order (most to least recent)
  keys(): K[] {
    const result: K[] = [];
    let current = this.head.next;
    while (current !== this.tail) {
      result.push(current!.key);
      current = current!.next;
    }
    return result;
  }
}

// Usage
const cache = new LRUCache<number, string>(3);

cache.put(1, "one");
cache.put(2, "two");
cache.put(3, "three");
console.log(cache.keys()); // [3, 2, 1]

cache.get(1);
console.log(cache.keys()); // [1, 3, 2]

cache.put(4, "four"); // Evicts 2
console.log(cache.keys()); // [4, 1, 3]
console.log(cache.get(2)); // null (evicted)
```

## Time Complexity

| Operation | Time | Space |
|-----------|------|-------|
| get | O(1) | - |
| put | O(1) | - |
| remove | O(1) | - |
| Total space | - | O(capacity) |

## LRU Cache with TTL (Time-To-Live)

```typescript
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

class LRUCacheWithTTL<K, V> {
  private cache: LRUCache<K, CacheEntry<V>>;
  private defaultTTL: number;

  constructor(capacity: number, defaultTTL: number = 60000) {
    this.cache = new LRUCache(capacity);
    this.defaultTTL = defaultTTL;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.remove(key);
      return null;
    }

    return entry.value;
  }

  put(key: K, value: V, ttl: number = this.defaultTTL): void {
    this.cache.put(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }

  // Periodically clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key);
      if (entry && now > entry.expiresAt) {
        this.cache.remove(key);
      }
    }
  }
}
```

## LFU Cache (Least Frequently Used)

Alternative eviction strategy based on access frequency:

```typescript
class LFUCache<K, V> {
  private capacity: number;
  private cache: Map<K, { value: V; freq: number }> = new Map();
  private freqMap: Map<number, Set<K>> = new Map();
  private minFreq: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | null {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key)!;
    this.updateFrequency(key, entry.freq);
    return entry.value;
  }

  put(key: K, value: V): void {
    if (this.capacity === 0) return;

    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      this.updateFrequency(key, entry.freq);
      return;
    }

    if (this.cache.size >= this.capacity) {
      this.evictLFU();
    }

    this.cache.set(key, { value, freq: 1 });
    if (!this.freqMap.has(1)) {
      this.freqMap.set(1, new Set());
    }
    this.freqMap.get(1)!.add(key);
    this.minFreq = 1;
  }

  private updateFrequency(key: K, oldFreq: number): void {
    const entry = this.cache.get(key)!;

    // Remove from old frequency set
    this.freqMap.get(oldFreq)!.delete(key);
    if (this.freqMap.get(oldFreq)!.size === 0) {
      this.freqMap.delete(oldFreq);
      if (this.minFreq === oldFreq) {
        this.minFreq++;
      }
    }

    // Add to new frequency set
    entry.freq++;
    if (!this.freqMap.has(entry.freq)) {
      this.freqMap.set(entry.freq, new Set());
    }
    this.freqMap.get(entry.freq)!.add(key);
  }

  private evictLFU(): void {
    const keys = this.freqMap.get(this.minFreq)!;
    const evictKey = keys.values().next().value;
    keys.delete(evictKey);
    if (keys.size === 0) {
      this.freqMap.delete(this.minFreq);
    }
    this.cache.delete(evictKey);
  }
}
```

## Practical Applications

### Memoization with Cache Limit
```typescript
function memoizeWithLRU<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);
    cache.put(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveFn = memoizeWithLRU((n: number) => {
  // Expensive computation
  return n * n;
}, 50);
```

### HTTP Response Cache
```typescript
interface CachedResponse {
  data: any;
  headers: Record<string, string>;
  timestamp: number;
}

class HTTPCache {
  private cache: LRUCacheWithTTL<string, CachedResponse>;

  constructor(maxEntries: number = 100, defaultTTL: number = 300000) {
    this.cache = new LRUCacheWithTTL(maxEntries, defaultTTL);
  }

  getCacheKey(url: string, method: string = 'GET'): string {
    return `${method}:${url}`;
  }

  get(url: string, method: string = 'GET'): CachedResponse | null {
    return this.cache.get(this.getCacheKey(url, method));
  }

  set(
    url: string,
    response: CachedResponse,
    method: string = 'GET',
    ttl?: number
  ): void {
    // Only cache GET requests by default
    if (method === 'GET') {
      this.cache.put(this.getCacheKey(url, method), response, ttl);
    }
  }
}
```

### Database Query Cache
```typescript
class QueryCache {
  private cache: LRUCache<string, any>;

  constructor(maxQueries: number = 1000) {
    this.cache = new LRUCache(maxQueries);
  }

  // Normalize query for consistent caching
  private normalizeQuery(query: string, params: any[]): string {
    return JSON.stringify({ query: query.trim().toLowerCase(), params });
  }

  async executeQuery<T>(
    query: string,
    params: any[],
    executor: () => Promise<T>
  ): Promise<T> {
    const key = this.normalizeQuery(query, params);
    const cached = this.cache.get(key);

    if (cached !== null) {
      return cached as T;
    }

    const result = await executor();
    this.cache.put(key, result);
    return result;
  }

  invalidate(query: string, params: any[]): void {
    const key = this.normalizeQuery(query, params);
    this.cache.remove(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
```

## Cache Eviction Strategies Comparison

| Strategy | Evicts | Best For |
|----------|--------|----------|
| **LRU** | Least recently accessed | General purpose, temporal locality |
| **LFU** | Least frequently accessed | Access patterns with popularity |
| **FIFO** | Oldest entry | Simple, predictable behavior |
| **Random** | Random entry | When access patterns unknown |
| **TTL** | Expired entries | Time-sensitive data |

## LRU vs Map

| Feature | LRU Cache | Map/Object |
|---------|-----------|------------|
| Size limit | Fixed | Unlimited |
| Eviction | Automatic | Manual |
| Order tracking | Yes (recency) | No* |
| Memory | Bounded | Unbounded |
| Overhead | Higher (linked list) | Lower |

*JavaScript Map maintains insertion order, not access order

## When to Use LRU Cache

**Use LRU cache when:**
- Need bounded memory usage
- Recent data is more likely to be accessed
- Can regenerate evicted data
- O(1) access is required
- Temporal locality in access patterns

**Consider alternatives:**
- Frequency-based access → LFU Cache
- Time-sensitive data → Cache with TTL
- No size limit needed → Simple Map/Object
- Distributed systems → Redis, Memcached

## Related Structures

- [Hash Tables](/compendium/data-structures/hash-tables) - Used for O(1) lookup
- [Linked Lists](/compendium/data-structures/linked-lists) - Doubly linked list for ordering
- [Queues](/compendium/data-structures/queues) - FIFO alternative (simpler eviction)
