---
title: "Bloom Filters"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Bloom Filters.md"
order: 6
---
A **Bloom Filter** is a space-efficient probabilistic data structure used to test whether an element is a member of a set. It can have false positives (saying an element is present when it's not) but never false negatives (if it says an element is absent, it definitely is).

* **Intent:** Provide extremely fast and memory-efficient membership testing with a controlled false positive rate.
* **Use Cases:** Spell checkers, database query optimization, cache filtering, web crawlers (URL deduplication), network routers, malware detection, password breach checking.
* **Key Properties:**
  - O(k) insert and lookup (k = number of hash functions)
  - No false negatives, possible false positives
  - Cannot delete elements (standard variant)
  - Fixed memory regardless of element count

## How It Works

```
1. Create bit array of size m, all zeros
2. Use k different hash functions
3. Insert: Set bits at positions hash₁(x), hash₂(x), ..., hashₖ(x) to 1
4. Lookup: Check if ALL positions hash₁(x), ..., hashₖ(x) are 1

Example (m=10, k=3):
Insert "apple": hash₁=2, hash₂=5, hash₃=8
Bit array: [0,0,1,0,0,1,0,0,1,0]

Insert "banana": hash₁=1, hash₂=5, hash₃=7
Bit array: [0,1,1,0,0,1,0,1,1,0]

Lookup "apple": positions 2,5,8 all = 1 → "possibly present"
Lookup "cherry": positions 3,6,9 → if any = 0 → "definitely not present"
```

## Implementation

```typescript
class BloomFilter {
  private bitArray: boolean[];
  private size: number;
  private hashCount: number;

  constructor(size: number, hashCount: number) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(false);
  }

  // Generate k hash values using double hashing
  private getHashValues(item: string): number[] {
    const hash1 = this.hash1(item);
    const hash2 = this.hash2(item);
    const hashes: number[] = [];

    for (let i = 0; i < this.hashCount; i++) {
      // Double hashing: h(i) = (h1 + i * h2) % size
      const hash = Math.abs((hash1 + i * hash2) % this.size);
      hashes.push(hash);
    }

    return hashes;
  }

  // FNV-1a hash
  private hash1(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash;
  }

  // DJB2 hash
  private hash2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  // O(k) - Add element
  add(item: string): void {
    const hashes = this.getHashValues(item);
    for (const hash of hashes) {
      this.bitArray[hash] = true;
    }
  }

  // O(k) - Check if element might be present
  mightContain(item: string): boolean {
    const hashes = this.getHashValues(item);
    return hashes.every(hash => this.bitArray[hash]);
  }

  // Get approximate false positive rate
  getFalsePositiveRate(insertedCount: number): number {
    // (1 - e^(-k*n/m))^k
    const k = this.hashCount;
    const n = insertedCount;
    const m = this.size;
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }

  // Calculate optimal parameters
  static getOptimalSize(expectedCount: number, falsePositiveRate: number): number {
    // m = -n * ln(p) / (ln(2)^2)
    return Math.ceil(-expectedCount * Math.log(falsePositiveRate) / Math.pow(Math.log(2), 2));
  }

  static getOptimalHashCount(size: number, expectedCount: number): number {
    // k = (m/n) * ln(2)
    return Math.ceil((size / expectedCount) * Math.log(2));
  }
}

// Usage
const expectedItems = 1000;
const falsePositiveRate = 0.01; // 1%

const optimalSize = BloomFilter.getOptimalSize(expectedItems, falsePositiveRate);
const optimalHashCount = BloomFilter.getOptimalHashCount(optimalSize, expectedItems);

console.log(`Optimal size: ${optimalSize} bits`);
console.log(`Optimal hash count: ${optimalHashCount}`);

const bloom = new BloomFilter(optimalSize, optimalHashCount);

// Add elements
bloom.add("apple");
bloom.add("banana");
bloom.add("cherry");

// Check membership
console.log(bloom.mightContain("apple"));   // true (definitely added)
console.log(bloom.mightContain("banana"));  // true (definitely added)
console.log(bloom.mightContain("grape"));   // false (definitely not added) or true (false positive)
```

## Counting Bloom Filter

Allows deletions by using counters instead of bits:

```typescript
class CountingBloomFilter {
  private counters: number[];
  private size: number;
  private hashCount: number;

  constructor(size: number, hashCount: number) {
    this.size = size;
    this.hashCount = hashCount;
    this.counters = new Array(size).fill(0);
  }

  private getHashValues(item: string): number[] {
    // Same as standard Bloom filter
    const hash1 = this.hash1(item);
    const hash2 = this.hash2(item);
    const hashes: number[] = [];

    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(Math.abs((hash1 + i * hash2) % this.size));
    }
    return hashes;
  }

  private hash1(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash;
  }

  private hash2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
  }

  // Add element
  add(item: string): void {
    for (const hash of this.getHashValues(item)) {
      this.counters[hash]++;
    }
  }

  // Remove element (only if previously added!)
  remove(item: string): void {
    const hashes = this.getHashValues(item);
    // Only remove if all counters are > 0
    if (hashes.every(h => this.counters[h] > 0)) {
      for (const hash of hashes) {
        this.counters[hash]--;
      }
    }
  }

  mightContain(item: string): boolean {
    return this.getHashValues(item).every(hash => this.counters[hash] > 0);
  }
}
```

## Time and Space Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Insert | O(k) | - |
| Lookup | O(k) | - |
| Space | - | O(m) bits |

Where:
- k = number of hash functions (typically 3-10)
- m = bit array size

## Optimal Parameters

For n expected elements with false positive probability p:

```
Optimal bit array size: m = -n × ln(p) / (ln(2))²
Optimal hash functions: k = (m/n) × ln(2) ≈ 0.7 × (m/n)

Example: 1 million elements, 1% false positive rate
m = -1,000,000 × ln(0.01) / (ln(2))² ≈ 9.6 million bits ≈ 1.2 MB
k = 0.7 × 9.6 ≈ 7 hash functions
```

## Practical Applications

### Password Breach Checking
```typescript
class BreachedPasswordChecker {
  private bloom: BloomFilter;

  constructor(breachedPasswords: string[]) {
    // Size for ~10 million passwords with 0.1% false positive rate
    this.bloom = new BloomFilter(143775874, 10);
    for (const password of breachedPasswords) {
      this.bloom.add(password);
    }
  }

  isBreached(password: string): boolean {
    return this.bloom.mightContain(password);
  }
}

// Much smaller than storing all breached passwords
// 143M bits ≈ 18MB vs potentially gigabytes of raw data
```

### Web Crawler URL Deduplication
```typescript
class WebCrawler {
  private visitedUrls: BloomFilter;
  private urlQueue: string[];

  constructor() {
    // 100 million URLs, 1% false positive
    this.visitedUrls = new BloomFilter(958505838, 7);
    this.urlQueue = [];
  }

  enqueueUrl(url: string): void {
    if (!this.visitedUrls.mightContain(url)) {
      this.visitedUrls.add(url);
      this.urlQueue.push(url);
    }
    // If false positive, we skip a URL (acceptable trade-off)
  }
}
```

### Database Query Optimization
```typescript
// Before expensive disk lookup, check Bloom filter
class DatabaseWithBloomFilter {
  private bloom: BloomFilter;
  private storage: Map<string, any>; // Simulates disk storage

  constructor() {
    this.bloom = new BloomFilter(10000, 7);
    this.storage = new Map();
  }

  set(key: string, value: any): void {
    this.bloom.add(key);
    this.storage.set(key, value);
  }

  get(key: string): any | null {
    // Quick check - avoid disk read if definitely not present
    if (!this.bloom.mightContain(key)) {
      return null; // Definitely not in storage
    }

    // Might be present - need to check actual storage
    return this.storage.get(key) ?? null;
  }
}
```

### CDN Cache Filtering
```typescript
class CDNCache {
  private bloom: BloomFilter;
  private cache: Map<string, Buffer>;

  constructor() {
    this.bloom = new BloomFilter(100000, 7);
    this.cache = new Map();
  }

  // Only cache content that's been requested before
  async getContent(url: string): Promise<Buffer> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const content = await this.fetchFromOrigin(url);

    // Only cache if seen before (prevents one-hit-wonders from filling cache)
    if (this.bloom.mightContain(url)) {
      this.cache.set(url, content);
    } else {
      this.bloom.add(url);
    }

    return content;
  }

  private async fetchFromOrigin(url: string): Promise<Buffer> {
    // Fetch from origin server
    return Buffer.from('');
  }
}
```

## Bloom Filter Variants

| Variant | Feature | Use Case |
|---------|---------|----------|
| **Standard** | Basic, no deletion | General membership |
| **Counting** | Supports deletion | Dynamic sets |
| **Scalable** | Grows dynamically | Unknown size |
| **Cuckoo Filter** | Delete + lower FP | Cache systems |
| **Quotient Filter** | Cache-friendly | Database systems |

## Bloom Filter vs Other Structures

| Structure | Space | FP Rate | Deletion | Query |
|-----------|-------|---------|----------|-------|
| Hash Set | O(n) | 0% | Yes | O(1) |
| Bloom Filter | O(1)* | 1-5% | No | O(k) |
| Counting Bloom | O(1)* | 1-5% | Yes | O(k) |
| Cuckoo Filter | O(n) | &lt;1% | Yes | O(1) |

*Fixed size regardless of n

## When to Use Bloom Filters

**Use Bloom filters when:**
- Memory is constrained
- False positives are acceptable
- Need extremely fast membership testing
- Checking before expensive operations (disk, network)
- Dealing with large datasets

**Don't use when:**
- Need exact membership (no false positives)
- Need to enumerate elements
- Need to delete elements (use counting variant)
- Small datasets (regular hash set is simpler)

## Related Structures

- [Hash Sets](/compendium/data-structures/hash-sets) - Exact membership, more space
- [Hash Tables](/compendium/data-structures/hash-tables) - Key-value storage
- Cuckoo Filter - Better FP rate, supports deletion
- HyperLogLog - Cardinality estimation (related probabilistic structure)
