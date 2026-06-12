---
title: "B-Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/B-Trees.md"
order: 3
---
A **B-Tree** is a self-balancing tree data structure designed for systems that read and write large blocks of data, such as databases and file systems. Unlike binary trees, B-Trees can have many children per node, making them ideal for minimizing disk I/O operations.

* **Intent:** Maintain sorted data with efficient insertion, deletion, and search operations optimized for disk-based storage systems.
* **Use Cases:** Database indexes (MySQL InnoDB, PostgreSQL), file systems (NTFS, ext4, HFS+), key-value stores, search engines.
* **Key Properties:**
  - All leaves at same depth (perfectly balanced)
  - Nodes can have many keys and children
  - Optimized for block-based storage
  - Self-balancing through splits and merges

## B-Tree Properties

For a B-Tree of order **m** (maximum children per node):
- Every node has at most **m** children
- Every non-leaf node (except root) has at least **⌈m/2⌉** children
- Root has at least 2 children (if not a leaf)
- A node with **k** children contains **k-1** keys
- All leaves appear at the same level

```
B-Tree of order 3 (2-3 Tree):
- Each node has 2-3 children (1-2 keys)

Example:
          [30]
         /    \
    [10,20]   [40,50]
   /   |  \   /  |  \
  ...  ... ... ... ... ...
```

## B-Tree vs B+ Tree

| Feature | B-Tree | B+ Tree |
|---------|--------|---------|
| Data location | All nodes | Leaves only |
| Leaf linking | No | Yes (linked list) |
| Range queries | Slower | Faster |
| Space usage | Less redundant | More keys in internal |
| Typical use | General | Databases, filesystems |

## Implementation

```typescript
class BTreeNode<K, V> {
  keys: K[] = [];
  values: V[] = [];
  children: BTreeNode<K, V>[] = [];
  isLeaf: boolean = true;

  constructor(isLeaf: boolean = true) {
    this.isLeaf = isLeaf;
  }
}

class BTree<K, V> {
  root: BTreeNode<K, V>;
  private order: number; // Maximum children per node
  private minKeys: number;
  private compareFn: (a: K, b: K) => number;

  constructor(
    order: number = 3,
    compareFn: (a: K, b: K) => number = (a, b) => (a as any) - (b as any)
  ) {
    this.order = order;
    this.minKeys = Math.ceil(order / 2) - 1;
    this.compareFn = compareFn;
    this.root = new BTreeNode<K, V>();
  }

  // O(log n) - Search
  search(key: K): V | null {
    return this.searchNode(this.root, key);
  }

  private searchNode(node: BTreeNode<K, V>, key: K): V | null {
    let i = 0;

    // Find the first key greater than or equal to key
    while (i < node.keys.length && this.compareFn(key, node.keys[i]) > 0) {
      i++;
    }

    // If key found
    if (i < node.keys.length && this.compareFn(key, node.keys[i]) === 0) {
      return node.values[i];
    }

    // If leaf node, key not present
    if (node.isLeaf) {
      return null;
    }

    // Recurse to child
    return this.searchNode(node.children[i], key);
  }

  // O(log n) - Insert
  insert(key: K, value: V): void {
    const root = this.root;

    // If root is full, split it
    if (root.keys.length === this.order - 1) {
      const newRoot = new BTreeNode<K, V>(false);
      newRoot.children.push(this.root);
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }

    this.insertNonFull(this.root, key, value);
  }

  private insertNonFull(node: BTreeNode<K, V>, key: K, value: V): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Find position and insert
      while (i >= 0 && this.compareFn(key, node.keys[i]) < 0) {
        i--;
      }

      // Check for duplicate
      if (i >= 0 && this.compareFn(key, node.keys[i]) === 0) {
        node.values[i] = value; // Update existing
        return;
      }

      node.keys.splice(i + 1, 0, key);
      node.values.splice(i + 1, 0, value);
    } else {
      // Find child to recurse into
      while (i >= 0 && this.compareFn(key, node.keys[i]) < 0) {
        i--;
      }
      i++;

      // Split child if full
      if (node.children[i].keys.length === this.order - 1) {
        this.splitChild(node, i);
        if (this.compareFn(key, node.keys[i]) > 0) {
          i++;
        }
      }

      this.insertNonFull(node.children[i], key, value);
    }
  }

  private splitChild(parent: BTreeNode<K, V>, index: number): void {
    const order = this.order;
    const fullChild = parent.children[index];
    const newChild = new BTreeNode<K, V>(fullChild.isLeaf);

    const midIndex = Math.floor((order - 1) / 2);

    // Move second half of keys to new child
    newChild.keys = fullChild.keys.splice(midIndex + 1);
    newChild.values = fullChild.values.splice(midIndex + 1);

    // Move median key to parent
    const medianKey = fullChild.keys.pop()!;
    const medianValue = fullChild.values.pop()!;

    // Move children if not leaf
    if (!fullChild.isLeaf) {
      newChild.children = fullChild.children.splice(midIndex + 1);
    }

    // Insert median into parent
    parent.keys.splice(index, 0, medianKey);
    parent.values.splice(index, 0, medianValue);
    parent.children.splice(index + 1, 0, newChild);
  }

  // O(n) - Get all key-value pairs in order
  inorder(): [K, V][] {
    const result: [K, V][] = [];
    this.inorderHelper(this.root, result);
    return result;
  }

  private inorderHelper(node: BTreeNode<K, V>, result: [K, V][]): void {
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.isLeaf) {
        this.inorderHelper(node.children[i], result);
      }
      result.push([node.keys[i], node.values[i]]);
    }
    if (!node.isLeaf) {
      this.inorderHelper(node.children[node.keys.length], result);
    }
  }

  // Get height
  height(): number {
    let h = 0;
    let node = this.root;
    while (!node.isLeaf) {
      h++;
      node = node.children[0];
    }
    return h;
  }
}

// Usage
const btree = new BTree<number, string>(3); // Order 3 (2-3 tree)
btree.insert(10, "ten");
btree.insert(20, "twenty");
btree.insert(5, "five");
btree.insert(15, "fifteen");
btree.insert(25, "twenty-five");

console.log(btree.search(15));  // "fifteen"
console.log(btree.inorder());   // [[5,"five"], [10,"ten"], ...]
```

## B+ Tree Implementation (Simplified)

```typescript
class BPlusTreeNode<K, V> {
  keys: K[] = [];
  isLeaf: boolean;
  // For internal nodes
  children: BPlusTreeNode<K, V>[] = [];
  // For leaf nodes
  values: V[] = [];
  next: BPlusTreeNode<K, V> | null = null; // Linked list for range queries

  constructor(isLeaf: boolean = true) {
    this.isLeaf = isLeaf;
  }
}

class BPlusTree<K, V> {
  root: BPlusTreeNode<K, V>;
  order: number;
  private compareFn: (a: K, b: K) => number;

  constructor(order: number = 4) {
    this.order = order;
    this.root = new BPlusTreeNode<K, V>(true);
    this.compareFn = (a, b) => (a as any) - (b as any);
  }

  // O(log n) - Search
  search(key: K): V | null {
    let node = this.root;

    // Navigate to leaf
    while (!node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && this.compareFn(key, node.keys[i]) >= 0) {
        i++;
      }
      node = node.children[i];
    }

    // Search in leaf
    for (let i = 0; i < node.keys.length; i++) {
      if (this.compareFn(key, node.keys[i]) === 0) {
        return node.values[i];
      }
    }

    return null;
  }

  // O(log n + k) - Range query
  rangeQuery(start: K, end: K): [K, V][] {
    const result: [K, V][] = [];
    let node = this.root;

    // Navigate to starting leaf
    while (!node.isLeaf) {
      let i = 0;
      while (i < node.keys.length && this.compareFn(start, node.keys[i]) >= 0) {
        i++;
      }
      node = node.children[i];
    }

    // Traverse leaf nodes
    while (node) {
      for (let i = 0; i < node.keys.length; i++) {
        if (this.compareFn(node.keys[i], start) >= 0 &&
            this.compareFn(node.keys[i], end) <= 0) {
          result.push([node.keys[i], node.values[i]]);
        }
        if (this.compareFn(node.keys[i], end) > 0) {
          return result;
        }
      }
      node = node.next!;
    }

    return result;
  }
}
```

## Time Complexity

For a B-Tree of order m with n keys:

| Operation | Time | Disk I/O |
|-----------|------|----------|
| Search | O(log n) | O(log_m n) |
| Insert | O(log n) | O(log_m n) |
| Delete | O(log n) | O(log_m n) |
| Range Query | O(log n + k) | O(log_m n + k/m) |

where k = number of results

## Why B-Trees for Disk Storage

```
Disk Read Cost:
- Seek time: ~10ms (mechanical movement)
- Read time: ~0.01ms per block

Strategy: Minimize number of disk reads

Binary Tree (height ~20 for 1M keys):
- 20 disk reads per search

B-Tree order 100 (height ~3 for 1M keys):
- 3 disk reads per search

That's 6-7x faster!
```

## B-Tree Order Selection

```typescript
// Optimal order calculation for disk-based B-Tree
function calculateOptimalOrder(
  blockSize: number,      // e.g., 4096 bytes
  keySize: number,        // e.g., 8 bytes (int64)
  valueSize: number,      // e.g., 100 bytes
  pointerSize: number = 8 // bytes for pointer/offset
): number {
  // For internal nodes: (m-1) keys + m pointers fit in block
  // keySize * (m-1) + pointerSize * m <= blockSize
  // m <= (blockSize + keySize) / (keySize + pointerSize)

  const internalOrder = Math.floor(
    (blockSize + keySize) / (keySize + pointerSize)
  );

  // For leaf nodes in B+ tree: keys + values fit in block
  const leafOrder = Math.floor(
    blockSize / (keySize + valueSize)
  );

  return Math.min(internalOrder, leafOrder);
}

// Example: 4KB blocks, 8-byte keys, 100-byte values
console.log(calculateOptimalOrder(4096, 8, 100));
// ~256 for internal nodes, ~37 for leaves
```

## Database Index Example

```
Table: users (1 million rows)
Index: B+ Tree on user_id (int64)

Block size: 4KB
Keys per node: ~500
Tree height: log_500(1,000,000) ≈ 2.3 → 3 levels

Query: SELECT * FROM users WHERE user_id = 12345
- Level 0 (root): 1 disk read
- Level 1: 1 disk read
- Level 2 (leaf): 1 disk read
- Data page: 1 disk read
Total: 4 disk reads

Compare to sequential scan: ~10,000 disk reads for 1M rows
```

## When to Use B-Trees

**Use B-Trees/B+ Trees when:**
- Data is stored on disk/SSD
- Need efficient range queries
- Building database indexes
- Implementing file system directories
- Data is too large for memory

**Consider alternatives:**
- In-memory only → [Red-Black Trees](/compendium/data-structures/red-black-trees) or [AVL Trees](/compendium/data-structures/avl-trees)
- Simple key-value → [Hash Tables](/compendium/data-structures/hash-tables) (if no range queries)
- Write-heavy log → LSM Trees (not covered)
- Full-text search → Inverted Index

## Related Structures

- [Binary Search Trees](/compendium/data-structures/binary-search-trees) - In-memory alternative
- [Red-Black Trees](/compendium/data-structures/red-black-trees) - In-memory balanced tree
- [AVL Trees](/compendium/data-structures/avl-trees) - In-memory strictly balanced
- LSM Trees - Write-optimized alternative (used in LevelDB, RocksDB)
