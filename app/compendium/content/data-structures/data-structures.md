---
title: "Data Structures"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Data Structures.md"
order: 7
---
## Data Structures

A **data structure** is a specialized format for organizing, processing, retrieving, and storing data. Choosing the right data structure is crucial for writing efficient algorithms and building performant software systems.

### Fundamental / Linear Structures
* [Arrays](/compendium/data-structures/arrays)
* [Linked Lists](/compendium/data-structures/linked-lists)
* [Stacks](/compendium/data-structures/stacks)
* [Queues](/compendium/data-structures/queues)

### Hash-Based Structures
* [Hash Tables](/compendium/data-structures/hash-tables)
* [Hash Sets](/compendium/data-structures/hash-sets)

### Tree Structures
* [Binary Trees](/compendium/data-structures/binary-trees)
* [Binary Search Trees](/compendium/data-structures/binary-search-trees)
* [AVL Trees](/compendium/data-structures/avl-trees)
* [Red-Black Trees](/compendium/data-structures/red-black-trees)
* [B-Trees](/compendium/data-structures/b-trees)
* [Heaps](/compendium/data-structures/heaps)
* [Tries](/compendium/data-structures/tries)
* [Segment Trees](/compendium/data-structures/segment-trees)
* [Fenwick Trees](/compendium/data-structures/fenwick-trees)

### Graph Structures
* [Graphs](/compendium/data-structures/graphs)

### Advanced / Specialized Structures
* [Bloom Filters](/compendium/data-structures/bloom-filters)
* [Skip Lists](/compendium/data-structures/skip-lists)
* [Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find)
* [LRU Cache](/compendium/data-structures/lru-cache)

---

## Complexity Reference

| Structure | Access | Search | Insert | Delete | Space |
|-----------|--------|--------|--------|--------|-------|
| Array | O(1) | O(n) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1) | O(1) | O(n) |
| Stack | O(n) | O(n) | O(1) | O(1) | O(n) |
| Queue | O(n) | O(n) | O(1) | O(1) | O(n) |
| Hash Table | N/A | O(1)* | O(1)* | O(1)* | O(n) |
| BST | O(log n)* | O(log n)* | O(log n)* | O(log n)* | O(n) |
| AVL/Red-Black | O(log n) | O(log n) | O(log n) | O(log n) | O(n) |
| Heap | O(1) top | O(n) | O(log n) | O(log n) | O(n) |
| Trie | O(k) | O(k) | O(k) | O(k) | O(n*k) |

*Average case; worst case may differ

## Choosing the Right Data Structure

**Consider these factors:**
1. **Access patterns** - Random access? Sequential? By key?
2. **Operation frequency** - Which operations are most common?
3. **Memory constraints** - How much overhead is acceptable?
4. **Ordering requirements** - Do elements need to stay sorted?
5. **Concurrency** - Will multiple threads access the structure?

**Common scenarios:**
- Need fast lookup by key → [Hash Tables](/compendium/data-structures/hash-tables)
- Need ordered data with fast insert/delete → [Red-Black Trees](/compendium/data-structures/red-black-trees) or [AVL Trees](/compendium/data-structures/avl-trees)
- Need LIFO access → [Stacks](/compendium/data-structures/stacks)
- Need FIFO access → [Queues](/compendium/data-structures/queues)
- Need fast min/max extraction → [Heaps](/compendium/data-structures/heaps)
- Need prefix-based search → [Tries](/compendium/data-structures/tries)
- Need to check membership with memory constraints → [Bloom Filters](/compendium/data-structures/bloom-filters)
- Need to track connected components → [Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find)
