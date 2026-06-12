---
title: "Binary Search Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Binary Search Trees.md"
order: 4
---
A **Binary Search Tree (BST)** is a binary tree with an ordering property: for each node, all values in its left subtree are smaller, and all values in its right subtree are larger. This property enables efficient O(log n) search, insertion, and deletion in balanced trees.

* **Intent:** Maintain a sorted collection of elements with efficient search, insertion, and deletion operations.
* **Use Cases:** Dictionary implementations, database indexing, priority queues (when order matters), range queries, floor/ceiling operations, symbol tables.
* **Key Properties:**
  - Left subtree values < node value < right subtree values
  - Inorder traversal yields sorted sequence
  - Average O(log n) operations (when balanced)
  - Can degenerate to O(n) if unbalanced

## Implementation

```typescript
class BSTNode<T> {
  value: T;
  left: BSTNode<T> | null = null;
  right: BSTNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class BinarySearchTree<T> {
  root: BSTNode<T> | null = null;
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.compareFn = compareFn;
  }

  // O(log n) average - Insert value
  insert(value: T): void {
    this.root = this.insertNode(this.root, value);
  }

  private insertNode(node: BSTNode<T> | null, value: T): BSTNode<T> {
    if (!node) return new BSTNode(value);

    const cmp = this.compareFn(value, node.value);
    if (cmp < 0) {
      node.left = this.insertNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.insertNode(node.right, value);
    }
    // If equal, do nothing (no duplicates) or handle as desired

    return node;
  }

  // O(log n) average - Search for value
  search(value: T): BSTNode<T> | null {
    let current = this.root;

    while (current) {
      const cmp = this.compareFn(value, current.value);
      if (cmp === 0) return current;
      current = cmp < 0 ? current.left : current.right;
    }

    return null;
  }

  // O(log n) average - Check if value exists
  contains(value: T): boolean {
    return this.search(value) !== null;
  }

  // O(log n) average - Delete value
  delete(value: T): void {
    this.root = this.deleteNode(this.root, value);
  }

  private deleteNode(node: BSTNode<T> | null, value: T): BSTNode<T> | null {
    if (!node) return null;

    const cmp = this.compareFn(value, node.value);

    if (cmp < 0) {
      node.left = this.deleteNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.deleteNode(node.right, value);
    } else {
      // Node found - handle deletion

      // Case 1: Leaf node
      if (!node.left && !node.right) {
        return null;
      }

      // Case 2: One child
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // Case 3: Two children
      // Find inorder successor (smallest in right subtree)
      const successor = this.findMin(node.right);
      node.value = successor.value;
      node.right = this.deleteNode(node.right, successor.value);
    }

    return node;
  }

  // O(log n) average - Find minimum
  findMin(node: BSTNode<T> | null = this.root): BSTNode<T> {
    if (!node) throw new Error("Tree is empty");
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  // O(log n) average - Find maximum
  findMax(node: BSTNode<T> | null = this.root): BSTNode<T> {
    if (!node) throw new Error("Tree is empty");
    while (node.right) {
      node = node.right;
    }
    return node;
  }

  // O(n) - Inorder traversal (sorted order)
  inorder(): T[] {
    const result: T[] = [];
    this.inorderHelper(this.root, result);
    return result;
  }

  private inorderHelper(node: BSTNode<T> | null, result: T[]): void {
    if (!node) return;
    this.inorderHelper(node.left, result);
    result.push(node.value);
    this.inorderHelper(node.right, result);
  }
}

// Usage
const bst = new BinarySearchTree<number>();
[5, 3, 7, 1, 4, 6, 8].forEach(n => bst.insert(n));
//       5
//      / \
//     3   7
//    / \ / \
//   1  4 6  8

console.log(bst.contains(4));  // true
console.log(bst.inorder());    // [1, 3, 4, 5, 6, 7, 8]
console.log(bst.findMin().value); // 1
bst.delete(3);
console.log(bst.inorder());    // [1, 4, 5, 6, 7, 8]
```

## BST Operations Visualized

### Insertion
```
Insert 4 into:     Result:
    5                5
   / \              / \
  3   7            3   7
 /               / \
1               1   4
```

### Deletion Cases
```
Case 1: Leaf node (delete 1)
    5                5
   / \              / \
  3   7    →       3   7
 /
1

Case 2: One child (delete 3)
    5                5
   / \              / \
  3   7    →       1   7
 /

Case 3: Two children (delete 5)
    5                6
   / \              / \
  3   7    →       3   7
     /
    6
```

## Time Complexity

| Operation | Average | Worst (Unbalanced) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |
| Min/Max | O(log n) | O(n) |
| Traversal | O(n) | O(n) |

## Advanced BST Operations

### Floor and Ceiling
```typescript
// Floor: largest value <= target
floor(value: T): T | null {
  let result: T | null = null;
  let current = this.root;

  while (current) {
    const cmp = this.compareFn(value, current.value);
    if (cmp === 0) return current.value;
    if (cmp > 0) {
      result = current.value;
      current = current.right;
    } else {
      current = current.left;
    }
  }

  return result;
}

// Ceiling: smallest value >= target
ceiling(value: T): T | null {
  let result: T | null = null;
  let current = this.root;

  while (current) {
    const cmp = this.compareFn(value, current.value);
    if (cmp === 0) return current.value;
    if (cmp < 0) {
      result = current.value;
      current = current.left;
    } else {
      current = current.right;
    }
  }

  return result;
}
```

### Range Query
```typescript
// Find all values in range [low, high]
rangeQuery(low: T, high: T): T[] {
  const result: T[] = [];
  this.rangeHelper(this.root, low, high, result);
  return result;
}

private rangeHelper(node: BSTNode<T> | null, low: T, high: T, result: T[]): void {
  if (!node) return;

  const cmpLow = this.compareFn(low, node.value);
  const cmpHigh = this.compareFn(high, node.value);

  // If low < node.value, search left subtree
  if (cmpLow < 0) {
    this.rangeHelper(node.left, low, high, result);
  }

  // If node in range, include it
  if (cmpLow <= 0 && cmpHigh >= 0) {
    result.push(node.value);
  }

  // If high > node.value, search right subtree
  if (cmpHigh > 0) {
    this.rangeHelper(node.right, low, high, result);
  }
}

// Usage
console.log(bst.rangeQuery(3, 6)); // [3, 4, 5, 6]
```

### Kth Smallest Element
```typescript
kthSmallest(k: number): T | null {
  let count = 0;
  let result: T | null = null;

  const inorder = (node: BSTNode<T> | null): boolean => {
    if (!node) return false;

    if (inorder(node.left)) return true;

    count++;
    if (count === k) {
      result = node.value;
      return true;
    }

    return inorder(node.right);
  };

  inorder(this.root);
  return result;
}
```

### Validate BST
```typescript
function isValidBST(root: BSTNode<number> | null): boolean {
  return validate(root, -Infinity, Infinity);
}

function validate(
  node: BSTNode<number> | null,
  min: number,
  max: number
): boolean {
  if (!node) return true;
  if (node.value <= min || node.value >= max) return false;
  return validate(node.left, min, node.value) &&
         validate(node.right, node.value, max);
}
```

### Convert Sorted Array to Balanced BST
```typescript
function sortedArrayToBST(nums: number[]): BSTNode<number> | null {
  if (nums.length === 0) return null;

  const mid = Math.floor(nums.length / 2);
  const node = new BSTNode(nums[mid]);

  node.left = sortedArrayToBST(nums.slice(0, mid));
  node.right = sortedArrayToBST(nums.slice(mid + 1));

  return node;
}

// [1, 2, 3, 4, 5, 6, 7] becomes:
//       4
//      / \
//     2   6
//    / \ / \
//   1  3 5  7
```

## BST vs Other Data Structures

| Operation | BST (balanced) | Hash Table | Sorted Array |
|-----------|---------------|------------|--------------|
| Search | O(log n) | O(1) avg | O(log n) |
| Insert | O(log n) | O(1) avg | O(n) |
| Delete | O(log n) | O(1) avg | O(n) |
| Min/Max | O(log n) | O(n) | O(1) |
| Range query | O(log n + k) | O(n) | O(log n + k) |
| Ordered iteration | O(n) | O(n log n) | O(n) |

## The Problem with Unbalanced BSTs

Inserting sorted data creates a degenerate tree:

```
Insert [1, 2, 3, 4, 5]:

1
 \
  2
   \
    3
     \
      4
       \
        5

Height = 5 (should be ~3)
All operations become O(n)!
```

**Solutions:**
- [AVL Trees](/compendium/data-structures/avl-trees) - Strictly balanced, height difference ≤ 1
- [Red-Black Trees](/compendium/data-structures/red-black-trees) - Approximately balanced, used in most libraries
- Random insertion order
- Periodic rebalancing

## When to Use BSTs

**Use BSTs when:**
- Need sorted data with dynamic updates
- Need range queries or ordered iteration
- Need floor/ceiling operations
- Data changes frequently (vs static sorted array)

**Consider alternatives:**
- Unordered lookups only → [Hash Tables](/compendium/data-structures/hash-tables)
- Need guaranteed O(log n) → [AVL Trees](/compendium/data-structures/avl-trees) or [Red-Black Trees](/compendium/data-structures/red-black-trees)
- Priority operations only → [Heaps](/compendium/data-structures/heaps)
- String keys with prefix search → [Tries](/compendium/data-structures/tries)
