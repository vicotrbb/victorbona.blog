---
title: "Binary Trees"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Binary Trees.md"
order: 5
---
A **Binary Tree** is a hierarchical data structure in which each node has at most two children, referred to as the left child and right child. Binary trees form the foundation for many important data structures like BSTs, heaps, and expression trees.

* **Intent:** Represent hierarchical relationships with a branching factor of two, enabling efficient recursive algorithms.
* **Use Cases:** Expression parsing, decision trees, file systems, Huffman coding, syntax trees, game trees (minimax), hierarchical data representation.
* **Key Properties:**
  - Each node has at most 2 children
  - One designated root node
  - Each node has exactly one parent (except root)
  - Height can range from log(n) to n

## Terminology

- **Root**: Top node with no parent
- **Leaf**: Node with no children
- **Internal node**: Node with at least one child
- **Height**: Longest path from root to leaf
- **Depth**: Distance from root to a node
- **Level**: Set of nodes at same depth
- **Subtree**: Tree formed by a node and its descendants

## Types of Binary Trees

| Type | Description |
|------|-------------|
| **Full** | Every node has 0 or 2 children |
| **Complete** | All levels full except last, filled left to right |
| **Perfect** | All internal nodes have 2 children, all leaves at same level |
| **Balanced** | Height difference between subtrees ≤ 1 |
| **Degenerate** | Each parent has only one child (like linked list) |

## Implementation

```typescript
class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class BinaryTree<T> {
  root: TreeNode<T> | null = null;

  // Build tree from array (level order)
  static fromArray<T>(arr: (T | null)[]): BinaryTree<T> {
    const tree = new BinaryTree<T>();
    if (arr.length === 0 || arr[0] === null) return tree;

    tree.root = new TreeNode(arr[0]);
    const queue: TreeNode<T>[] = [tree.root];
    let i = 1;

    while (queue.length > 0 && i < arr.length) {
      const node = queue.shift()!;

      if (i < arr.length && arr[i] !== null) {
        node.left = new TreeNode(arr[i] as T);
        queue.push(node.left);
      }
      i++;

      if (i < arr.length && arr[i] !== null) {
        node.right = new TreeNode(arr[i] as T);
        queue.push(node.right);
      }
      i++;
    }

    return tree;
  }

  // Calculate height
  height(node: TreeNode<T> | null = this.root): number {
    if (!node) return -1; // or 0 depending on convention
    return 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  // Count nodes
  size(node: TreeNode<T> | null = this.root): number {
    if (!node) return 0;
    return 1 + this.size(node.left) + this.size(node.right);
  }

  // Count leaves
  countLeaves(node: TreeNode<T> | null = this.root): number {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return this.countLeaves(node.left) + this.countLeaves(node.right);
  }

  // Check if balanced
  isBalanced(node: TreeNode<T> | null = this.root): boolean {
    if (!node) return true;

    const leftHeight = this.height(node.left);
    const rightHeight = this.height(node.right);

    return Math.abs(leftHeight - rightHeight) <= 1 &&
           this.isBalanced(node.left) &&
           this.isBalanced(node.right);
  }
}
```

## Tree Traversals

### Depth-First Traversals

```typescript
class BinaryTreeTraversals<T> {
  // Preorder: Root -> Left -> Right
  // Use: Copy tree, prefix expression
  preorder(node: TreeNode<T> | null, result: T[] = []): T[] {
    if (!node) return result;
    result.push(node.value);
    this.preorder(node.left, result);
    this.preorder(node.right, result);
    return result;
  }

  // Inorder: Left -> Root -> Right
  // Use: Sorted order for BST
  inorder(node: TreeNode<T> | null, result: T[] = []): T[] {
    if (!node) return result;
    this.inorder(node.left, result);
    result.push(node.value);
    this.inorder(node.right, result);
    return result;
  }

  // Postorder: Left -> Right -> Root
  // Use: Delete tree, postfix expression
  postorder(node: TreeNode<T> | null, result: T[] = []): T[] {
    if (!node) return result;
    this.postorder(node.left, result);
    this.postorder(node.right, result);
    result.push(node.value);
    return result;
  }
}

//       1
//      / \
//     2   3
//    / \
//   4   5
// Preorder:  [1, 2, 4, 5, 3]
// Inorder:   [4, 2, 5, 1, 3]
// Postorder: [4, 5, 2, 3, 1]
```

### Iterative Traversals (using Stack)

```typescript
function inorderIterative<T>(root: TreeNode<T> | null): T[] {
  const result: T[] = [];
  const stack: TreeNode<T>[] = [];
  let current = root;

  while (current || stack.length > 0) {
    // Go to leftmost node
    while (current) {
      stack.push(current);
      current = current.left;
    }

    // Process node
    current = stack.pop()!;
    result.push(current.value);

    // Move to right subtree
    current = current.right;
  }

  return result;
}

function preorderIterative<T>(root: TreeNode<T> | null): T[] {
  if (!root) return [];

  const result: T[] = [];
  const stack: TreeNode<T>[] = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node.value);

    // Push right first so left is processed first
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}
```

### Breadth-First (Level Order) Traversal

```typescript
function levelOrder<T>(root: TreeNode<T> | null): T[][] {
  if (!root) return [];

  const result: T[][] = [];
  const queue: TreeNode<T>[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: T[] = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.value);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

//       1
//      / \
//     2   3
//    / \   \
//   4   5   6
// Level order: [ [1], [2, 3], [4, 5, 6] ]
```

## Common Binary Tree Problems

### Maximum Depth
```typescript
function maxDepth<T>(root: TreeNode<T> | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Same Tree
```typescript
function isSameTree<T>(p: TreeNode<T> | null, q: TreeNode<T> | null): boolean {
  if (!p && !q) return true;
  if (!p || !q) return false;
  return p.value === q.value &&
         isSameTree(p.left, q.left) &&
         isSameTree(p.right, q.right);
}
```

### Symmetric Tree
```typescript
function isSymmetric<T>(root: TreeNode<T> | null): boolean {
  if (!root) return true;
  return isMirror(root.left, root.right);
}

function isMirror<T>(t1: TreeNode<T> | null, t2: TreeNode<T> | null): boolean {
  if (!t1 && !t2) return true;
  if (!t1 || !t2) return false;
  return t1.value === t2.value &&
         isMirror(t1.left, t2.right) &&
         isMirror(t1.right, t2.left);
}
```

### Invert Binary Tree
```typescript
function invertTree<T>(root: TreeNode<T> | null): TreeNode<T> | null {
  if (!root) return null;

  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);

  return root;
}
```

### Path Sum
```typescript
function hasPathSum(root: TreeNode<number> | null, targetSum: number): boolean {
  if (!root) return false;

  // Leaf node
  if (!root.left && !root.right) {
    return root.value === targetSum;
  }

  const remaining = targetSum - root.value;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}
```

### Lowest Common Ancestor
```typescript
function lowestCommonAncestor<T>(
  root: TreeNode<T> | null,
  p: TreeNode<T>,
  q: TreeNode<T>
): TreeNode<T> | null {
  if (!root || root === p || root === q) return root;

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left && right) return root; // p and q are on different sides
  return left || right; // Both on same side
}
```

### Serialize and Deserialize
```typescript
function serialize<T>(root: TreeNode<T> | null): string {
  const result: (T | null)[] = [];

  function preorder(node: TreeNode<T> | null) {
    if (!node) {
      result.push(null);
      return;
    }
    result.push(node.value);
    preorder(node.left);
    preorder(node.right);
  }

  preorder(root);
  return JSON.stringify(result);
}

function deserialize<T>(data: string): TreeNode<T> | null {
  const values: (T | null)[] = JSON.parse(data);
  let index = 0;

  function buildTree(): TreeNode<T> | null {
    if (index >= values.length || values[index] === null) {
      index++;
      return null;
    }

    const node = new TreeNode(values[index]!);
    index++;
    node.left = buildTree();
    node.right = buildTree();
    return node;
  }

  return buildTree();
}
```

## Binary Tree Properties

For a binary tree with n nodes:
- Minimum height: ⌊log₂(n)⌋ (complete/balanced tree)
- Maximum height: n - 1 (degenerate tree)
- Number of leaves in full tree: (n + 1) / 2
- Maximum nodes at level i: 2^i
- Maximum nodes in tree of height h: 2^(h+1) - 1

## Time Complexity

| Operation | Average | Worst (Degenerate) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |
| Traversal | O(n) | O(n) |

## Related Data Structures

- [Binary Search Trees](/compendium/data-structures/binary-search-trees) - Binary tree with ordering property
- [AVL Trees](/compendium/data-structures/avl-trees) - Self-balancing BST
- [Red-Black Trees](/compendium/data-structures/red-black-trees) - Self-balancing BST
- [Heaps](/compendium/data-structures/heaps) - Complete binary tree with heap property
- [Tries](/compendium/data-structures/tries) - Tree for string storage
- [Segment Trees](/compendium/data-structures/segment-trees) - Tree for range queries
