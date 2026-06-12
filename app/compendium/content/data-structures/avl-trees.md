---
title: "AVL Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/AVL Trees.md"
order: 2
---
An **AVL Tree** is a self-balancing Binary Search Tree where the height difference between left and right subtrees of any node (called the balance factor) is at most 1. Named after inventors Adelson-Velsky and Landis (1962), AVL trees guarantee O(log n) operations by automatically rebalancing after insertions and deletions.

* **Intent:** Maintain a strictly balanced BST to guarantee O(log n) worst-case performance for all operations.
* **Use Cases:** Databases requiring fast lookups with frequent updates, memory-constrained systems (tighter balance than Red-Black), in-memory indexes, when worst-case guarantees are critical.
* **Key Properties:**
  - Balance factor = height(left) - height(right) ∈ {-1, 0, 1}
  - Height is always O(log n)
  - More strictly balanced than Red-Black trees
  - More rotations on insert/delete than Red-Black

## Balance Factor and Rotations

```
Balance Factor = height(left subtree) - height(right subtree)

Valid values: -1, 0, +1
If |BF| > 1, tree needs rebalancing via rotations
```

### Rotation Types

**Right Rotation (LL Case):**
```
    z                      y
   / \                   /   \
  y   T4   Right       x      z
 / \       Rotate     / \    / \
x   T3    ------→   T1  T2  T3  T4
/ \
T1  T2
```

**Left Rotation (RR Case):**
```
  z                        y
 / \                     /   \
T1   y      Left        z      x
    / \     Rotate     / \    / \
   T2   x  ------→   T1  T2  T3  T4
       / \
      T3  T4
```

**Left-Right Rotation (LR Case):**
```
    z               z                x
   / \             / \             /   \
  y   T4  Left    x   T4  Right   y      z
 / \      →      / \      →      / \    / \
T1   x          y   T3          T1  T2 T3  T4
    / \        / \
   T2  T3     T1  T2
```

**Right-Left Rotation (RL Case):**
```
  z                 z                    x
 / \               / \                 /   \
T1   y   Right    T1   x    Left      z      y
    / \    →          / \     →      / \    / \
   x   T4            T2   y         T1  T2 T3  T4
  / \                    / \
 T2  T3                 T3  T4
```

## Implementation

```typescript
class AVLNode<T> {
  value: T;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

class AVLTree<T> {
  root: AVLNode<T> | null = null;
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.compareFn = compareFn;
  }

  private height(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private balanceFactor(node: AVLNode<T>): number {
    return this.height(node.left) - this.height(node.right);
  }

  private updateHeight(node: AVLNode<T>): void {
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  // Right rotation
  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  // Left rotation
  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  // Balance the node
  private balance(node: AVLNode<T>): AVLNode<T> {
    this.updateHeight(node);
    const bf = this.balanceFactor(node);

    // Left heavy
    if (bf > 1) {
      // Left-Right case
      if (this.balanceFactor(node.left!) < 0) {
        node.left = this.rotateLeft(node.left!);
      }
      // Left-Left case
      return this.rotateRight(node);
    }

    // Right heavy
    if (bf < -1) {
      // Right-Left case
      if (this.balanceFactor(node.right!) > 0) {
        node.right = this.rotateRight(node.right!);
      }
      // Right-Right case
      return this.rotateLeft(node);
    }

    return node;
  }

  // O(log n) - Insert
  insert(value: T): void {
    this.root = this.insertNode(this.root, value);
  }

  private insertNode(node: AVLNode<T> | null, value: T): AVLNode<T> {
    if (!node) return new AVLNode(value);

    const cmp = this.compareFn(value, node.value);
    if (cmp < 0) {
      node.left = this.insertNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.insertNode(node.right, value);
    } else {
      return node; // Duplicate, no insert
    }

    return this.balance(node);
  }

  // O(log n) - Delete
  delete(value: T): void {
    this.root = this.deleteNode(this.root, value);
  }

  private deleteNode(node: AVLNode<T> | null, value: T): AVLNode<T> | null {
    if (!node) return null;

    const cmp = this.compareFn(value, node.value);

    if (cmp < 0) {
      node.left = this.deleteNode(node.left, value);
    } else if (cmp > 0) {
      node.right = this.deleteNode(node.right, value);
    } else {
      // Node found
      if (!node.left || !node.right) {
        return node.left || node.right;
      }

      // Two children: find inorder successor
      const minNode = this.findMinNode(node.right);
      node.value = minNode.value;
      node.right = this.deleteNode(node.right, minNode.value);
    }

    return this.balance(node);
  }

  private findMinNode(node: AVLNode<T>): AVLNode<T> {
    while (node.left) {
      node = node.left;
    }
    return node;
  }

  // O(log n) - Search
  search(value: T): AVLNode<T> | null {
    let current = this.root;

    while (current) {
      const cmp = this.compareFn(value, current.value);
      if (cmp === 0) return current;
      current = cmp < 0 ? current.left : current.right;
    }

    return null;
  }

  // O(n) - Inorder traversal
  inorder(): T[] {
    const result: T[] = [];
    this.inorderHelper(this.root, result);
    return result;
  }

  private inorderHelper(node: AVLNode<T> | null, result: T[]): void {
    if (!node) return;
    this.inorderHelper(node.left, result);
    result.push(node.value);
    this.inorderHelper(node.right, result);
  }

  // Verify AVL property
  isBalanced(): boolean {
    return this.checkBalance(this.root);
  }

  private checkBalance(node: AVLNode<T> | null): boolean {
    if (!node) return true;
    const bf = this.balanceFactor(node);
    return Math.abs(bf) <= 1 &&
           this.checkBalance(node.left) &&
           this.checkBalance(node.right);
  }
}

// Usage
const avl = new AVLTree<number>();
[10, 20, 30, 40, 50, 25].forEach(n => avl.insert(n));

console.log(avl.inorder());     // [10, 20, 25, 30, 40, 50]
console.log(avl.isBalanced());  // true

// Without AVL balancing, inserting sorted data creates:
// 10 -> 20 -> 30 -> 40 -> 50 (degenerate tree, height = 5)

// With AVL balancing, we get:
//        30
//       /  \
//      20   40
//     /  \    \
//    10  25   50
// (balanced tree, height = 3)
```

## Time Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Search | O(log n) | O(1) |
| Insert | O(log n) | O(log n)* |
| Delete | O(log n) | O(log n)* |
| Min/Max | O(log n) | O(1) |
| Traversal | O(n) | O(n) |

*Recursive stack space; can be O(1) with iterative + parent pointers

## AVL vs Red-Black Trees

| Aspect | AVL Tree | Red-Black Tree |
|--------|----------|----------------|
| Balance strictness | Stricter (height diff ≤ 1) | Looser (black height equal) |
| Height | ≤ 1.44 log(n) | ≤ 2 log(n) |
| Search | Slightly faster | Slightly slower |
| Insert/Delete | More rotations | Fewer rotations |
| Memory | Height per node | Color bit per node |
| Use case | Read-heavy workloads | Write-heavy workloads |
| Implementation | Simpler | More complex |

## AVL Tree Properties

For an AVL tree with n nodes:
- **Maximum height**: 1.44 * log₂(n) (worst case)
- **Minimum nodes for height h**: F(h+3) - 1 (Fibonacci-related)
- **Single rotation**: O(1)
- **Rotations per insert**: At most 2
- **Rotations per delete**: Up to O(log n)

## Insertion Example

```
Insert sequence: 10, 20, 30, 25, 28

1. Insert 10:
   10 (BF=0)

2. Insert 20:
   10 (BF=-1)
     \
     20

3. Insert 30 (RR case, left rotate at 10):
   10 (BF=-2)          20 (BF=0)
     \        →       /  \
     20              10   30
       \
       30

4. Insert 25:
      20 (BF=-1)
     /  \
    10   30
        /
       25

5. Insert 28 (RL case at 30, right rotate then left rotate):
      20                    20                     20
     /  \                  /  \                   /  \
    10   30 (BF=2)  →    10   25 (BF=-1)  →     10   25
        /                       \                   /  \
       25 (BF=-1)               30                 (skip) 28   30
         \                      /
         28                    28
```

## When to Use AVL Trees

**Use AVL trees when:**
- Need guaranteed O(log n) worst-case performance
- Read operations significantly outnumber writes
- Application is sensitive to worst-case lookup time
- Memory for height storage is acceptable

**Consider alternatives:**
- More writes than reads → [Red-Black Trees](/compendium/data-structures/red-black-trees)
- Simple implementation needed → [Binary Search Trees](/compendium/data-structures/binary-search-trees) with occasional rebuild
- Need range queries with updates → [Segment Trees](/compendium/data-structures/segment-trees)
- Memory is critical → [Skip Lists](/compendium/data-structures/skip-lists) (probabilistic)

## Related Structures

- [Binary Search Trees](/compendium/data-structures/binary-search-trees) - Foundation, no balancing
- [Red-Black Trees](/compendium/data-structures/red-black-trees) - Alternative self-balancing BST
- [B-Trees](/compendium/data-structures/b-trees) - Self-balancing for disk storage
- <span className="compendium-external-reference" title="Vault-only reference">Splay Trees</span> - Self-adjusting BST (not covered)
