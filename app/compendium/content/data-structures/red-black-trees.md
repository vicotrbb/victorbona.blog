---
title: "Red-Black Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Red-Black Trees.md"
order: 17
---
A **Red-Black Tree** is a self-balancing Binary Search Tree where each node has an extra bit for color (red or black). The tree maintains balance through a set of properties that ensure no path from root to leaf is more than twice as long as any other, guaranteeing O(log n) operations.

* **Intent:** Maintain an approximately balanced BST with efficient rebalancing, optimizing for frequent insertions and deletions.
* **Use Cases:** Standard library implementations (C++ std::map, Java TreeMap), Linux kernel (process scheduling, memory management), database indexes, file systems.
* **Key Properties:**
  - Every node is either red or black
  - Root is always black
  - All leaves (NIL) are black
  - Red nodes cannot have red children
  - Every path from root to NIL has same number of black nodes

## Red-Black Properties Explained

```
1. Every node is RED or BLACK
2. Root is BLACK
3. Every leaf (NIL/null) is BLACK
4. If a node is RED, both children are BLACK (no red-red parent-child)
5. For each node, all paths to descendant leaves have same BLACK count

These properties guarantee:
- Longest path ≤ 2 × shortest path
- Height ≤ 2 × log₂(n + 1)
```

## Visual Example

```
        8(B)
       /    \
     4(R)    12(R)
    /   \    /    \
  2(B)  6(B) 10(B) 14(B)
 /   \
1(R) 3(R)

B = Black, R = Red
Black height = 2 (count black nodes on any path to leaf)
```

## Implementation

```typescript
enum Color {
  RED = 'RED',
  BLACK = 'BLACK'
}

class RBNode<T> {
  value: T;
  color: Color;
  left: RBNode<T> | null = null;
  right: RBNode<T> | null = null;
  parent: RBNode<T> | null = null;

  constructor(value: T, color: Color = Color.RED) {
    this.value = value;
    this.color = color;
  }
}

class RedBlackTree<T> {
  root: RBNode<T> | null = null;
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.compareFn = compareFn;
  }

  // Left rotation
  private rotateLeft(x: RBNode<T>): void {
    const y = x.right!;
    x.right = y.left;

    if (y.left) {
      y.left.parent = x;
    }

    y.parent = x.parent;

    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
  }

  // Right rotation
  private rotateRight(y: RBNode<T>): void {
    const x = y.left!;
    y.left = x.right;

    if (x.right) {
      x.right.parent = y;
    }

    x.parent = y.parent;

    if (!y.parent) {
      this.root = x;
    } else if (y === y.parent.right) {
      y.parent.right = x;
    } else {
      y.parent.left = x;
    }

    x.right = y;
    y.parent = x;
  }

  // O(log n) - Insert
  insert(value: T): void {
    const newNode = new RBNode(value, Color.RED);

    // Standard BST insert
    let parent: RBNode<T> | null = null;
    let current = this.root;

    while (current) {
      parent = current;
      const cmp = this.compareFn(value, current.value);
      if (cmp < 0) {
        current = current.left;
      } else if (cmp > 0) {
        current = current.right;
      } else {
        return; // Duplicate
      }
    }

    newNode.parent = parent;

    if (!parent) {
      this.root = newNode;
    } else if (this.compareFn(value, parent.value) < 0) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    this.fixInsert(newNode);
  }

  private fixInsert(node: RBNode<T>): void {
    while (node.parent && node.parent.color === Color.RED) {
      const parent = node.parent;
      const grandparent = parent.parent!;

      if (parent === grandparent.left) {
        const uncle = grandparent.right;

        if (uncle && uncle.color === Color.RED) {
          // Case 1: Uncle is red - recolor
          parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          grandparent.color = Color.RED;
          node = grandparent;
        } else {
          if (node === parent.right) {
            // Case 2: Node is right child - left rotate
            node = parent;
            this.rotateLeft(node);
          }
          // Case 3: Node is left child - right rotate
          node.parent!.color = Color.BLACK;
          node.parent!.parent!.color = Color.RED;
          this.rotateRight(node.parent!.parent!);
        }
      } else {
        // Mirror cases for right subtree
        const uncle = grandparent.left;

        if (uncle && uncle.color === Color.RED) {
          parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          grandparent.color = Color.RED;
          node = grandparent;
        } else {
          if (node === parent.left) {
            node = parent;
            this.rotateRight(node);
          }
          node.parent!.color = Color.BLACK;
          node.parent!.parent!.color = Color.RED;
          this.rotateLeft(node.parent!.parent!);
        }
      }
    }

    this.root!.color = Color.BLACK;
  }

  // O(log n) - Search
  search(value: T): RBNode<T> | null {
    let current = this.root;

    while (current) {
      const cmp = this.compareFn(value, current.value);
      if (cmp === 0) return current;
      current = cmp < 0 ? current.left : current.right;
    }

    return null;
  }

  // O(log n) - Find minimum
  findMin(): T | null {
    if (!this.root) return null;
    let current = this.root;
    while (current.left) {
      current = current.left;
    }
    return current.value;
  }

  // O(log n) - Find maximum
  findMax(): T | null {
    if (!this.root) return null;
    let current = this.root;
    while (current.right) {
      current = current.right;
    }
    return current.value;
  }

  // O(n) - Inorder traversal
  inorder(): T[] {
    const result: T[] = [];
    this.inorderHelper(this.root, result);
    return result;
  }

  private inorderHelper(node: RBNode<T> | null, result: T[]): void {
    if (!node) return;
    this.inorderHelper(node.left, result);
    result.push(node.value);
    this.inorderHelper(node.right, result);
  }

  // Verify Red-Black properties
  isValid(): boolean {
    // Property 2: Root is black
    if (this.root && this.root.color !== Color.BLACK) {
      return false;
    }

    return this.checkProperties(this.root) !== -1;
  }

  private checkProperties(node: RBNode<T> | null): number {
    if (!node) return 1; // NIL nodes are black

    // Property 4: Red nodes have black children
    if (node.color === Color.RED) {
      if ((node.left && node.left.color === Color.RED) ||
          (node.right && node.right.color === Color.RED)) {
        return -1;
      }
    }

    // Property 5: Equal black height on all paths
    const leftBlackHeight = this.checkProperties(node.left);
    const rightBlackHeight = this.checkProperties(node.right);

    if (leftBlackHeight === -1 || rightBlackHeight === -1 ||
        leftBlackHeight !== rightBlackHeight) {
      return -1;
    }

    return leftBlackHeight + (node.color === Color.BLACK ? 1 : 0);
  }
}

// Usage
const rbt = new RedBlackTree<number>();
[7, 3, 18, 10, 22, 8, 11, 26].forEach(n => rbt.insert(n));

console.log(rbt.inorder());  // [3, 7, 8, 10, 11, 18, 22, 26]
console.log(rbt.isValid());  // true
console.log(rbt.search(10)); // RBNode { value: 10, ... }
```

## Insertion Cases

```
Case 1: Uncle is RED
- Recolor parent, uncle to BLACK
- Recolor grandparent to RED
- Move up to grandparent

Case 2: Uncle is BLACK, node is inner child
- Rotate to make outer child (prepare for Case 3)

Case 3: Uncle is BLACK, node is outer child
- Rotate at grandparent
- Swap colors of parent and grandparent
```

## Time Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Search | O(log n) | O(1) |
| Insert | O(log n) | O(1) |
| Delete | O(log n) | O(1) |
| Min/Max | O(log n) | O(1) |
| Traversal | O(n) | O(n) |

## Red-Black vs AVL Trees

| Aspect | Red-Black | AVL |
|--------|-----------|-----|
| Balance | Looser | Stricter |
| Height | ≤ 2 log(n) | ≤ 1.44 log(n) |
| Search | Slightly slower | Slightly faster |
| Insert | Faster (≤2 rotations) | Slower (≤2 rotations) |
| Delete | Faster (≤3 rotations) | Slower (up to log n) |
| Memory | 1 bit for color | Integer for height |
| Use case | Write-heavy | Read-heavy |

## Why Red-Black Trees Are Popular

1. **Bounded rotations**: At most 3 rotations per insert/delete
2. **Good average case**: Similar performance to AVL
3. **Memory efficient**: Only 1 bit extra per node
4. **Simpler deletion**: Compared to AVL trees
5. **Industry standard**: Used in most standard libraries

## Real-World Usage

```typescript
// JavaScript/TypeScript doesn't have built-in Red-Black Tree
// but these languages/libraries use them:

// C++ STL
// std::map<K, V> - Red-Black Tree
// std::set<T> - Red-Black Tree

// Java
// TreeMap<K, V> - Red-Black Tree
// TreeSet<T> - Red-Black Tree

// Linux Kernel
// Completely Fair Scheduler (CFS) - process scheduling
// Memory management - virtual memory areas
// ext3 filesystem - directory indexing
```

## When to Use Red-Black Trees

**Use Red-Black trees when:**
- Need ordered map/set with frequent updates
- Write operations are as frequent as reads
- Need guaranteed O(log n) worst-case
- Building standard library containers

**Consider alternatives:**
- Read-heavy workloads → [AVL Trees](/compendium/data-structures/avl-trees)
- On-disk storage → [B-Trees](/compendium/data-structures/b-trees)
- Simpler implementation → [Binary Search Trees](/compendium/data-structures/binary-search-trees) + periodic rebuild
- Unordered access only → [Hash Tables](/compendium/data-structures/hash-tables)

## Related Structures

- [AVL Trees](/compendium/data-structures/avl-trees) - Stricter balancing alternative
- [Binary Search Trees](/compendium/data-structures/binary-search-trees) - Foundation without balancing
- [B-Trees](/compendium/data-structures/b-trees) - Multi-way balanced tree for disk
- [Skip Lists](/compendium/data-structures/skip-lists) - Probabilistic alternative
