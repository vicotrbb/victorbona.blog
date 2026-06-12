---
title: "Linked Lists"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Linked Lists.md"
order: 14
---
A **Linked List** is a linear data structure where elements (nodes) are stored in non-contiguous memory locations. Each node contains data and a reference (pointer) to the next node in the sequence. Unlike arrays, linked lists allow efficient insertion and deletion without shifting elements.

* **Intent:** Provide a dynamic collection that supports efficient insertions and deletions at any position without reallocating the entire structure.
* **Use Cases:** Implementing stacks and queues, undo functionality, polynomial arithmetic, memory allocation (free lists), LRU caches (with hash map), browser history.
* **Key Properties:**
  - Dynamic size (no pre-allocation needed)
  - Non-contiguous memory storage
  - Sequential access only (no random access)
  - O(1) insertion/deletion at known positions

## Types of Linked Lists

### Singly Linked List
Each node points only to the next node.

```typescript
class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class SinglyLinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length: number = 0;

  // O(1) - Add to end
  append(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  // O(1) - Add to beginning
  prepend(value: T): void {
    const newNode = new ListNode(value);
    newNode.next = this.head;
    this.head = newNode;
    if (!this.tail) this.tail = newNode;
    this.length++;
  }

  // O(n) - Delete first occurrence
  delete(value: T): boolean {
    if (!this.head) return false;

    // Special case: head node
    if (this.head.value === value) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.length--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this.length--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  // O(n) - Find node
  find(value: T): ListNode<T> | null {
    let current = this.head;
    while (current) {
      if (current.value === value) return current;
      current = current.next;
    }
    return null;
  }

  // O(n) - Get by index
  get(index: number): T | undefined {
    if (index < 0 || index >= this.length) return undefined;
    let current = this.head;
    for (let i = 0; i < index; i++) {
      current = current!.next;
    }
    return current?.value;
  }

  // O(n) - Convert to array
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  size(): number {
    return this.length;
  }
}

// Usage
const list = new SinglyLinkedList<number>();
list.append(1);
list.append(2);
list.append(3);
list.prepend(0);
console.log(list.toArray()); // [0, 1, 2, 3]
```

### Doubly Linked List
Each node points to both next and previous nodes, enabling bidirectional traversal.

```typescript
class DoublyListNode<T> {
  value: T;
  next: DoublyListNode<T> | null = null;
  prev: DoublyListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class DoublyLinkedList<T> {
  private head: DoublyListNode<T> | null = null;
  private tail: DoublyListNode<T> | null = null;
  private length: number = 0;

  // O(1) - Add to end
  append(value: T): DoublyListNode<T> {
    const newNode = new DoublyListNode(value);
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
    return newNode;
  }

  // O(1) - Add to beginning
  prepend(value: T): DoublyListNode<T> {
    const newNode = new DoublyListNode(value);
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.length++;
    return newNode;
  }

  // O(1) - Remove specific node (when you have reference)
  removeNode(node: DoublyListNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    this.length--;
  }

  // O(1) - Move node to front (useful for LRU cache)
  moveToFront(node: DoublyListNode<T>): void {
    if (node === this.head) return;
    this.removeNode(node);
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.length++;
  }

  // O(1) - Remove from end
  removeLast(): T | undefined {
    if (!this.tail) return undefined;
    const value = this.tail.value;
    this.removeNode(this.tail);
    return value;
  }

  size(): number {
    return this.length;
  }
}
```

### Circular Linked List
The last node points back to the first node, forming a circle.

```typescript
class CircularLinkedList<T> {
  private head: ListNode<T> | null = null;
  private length: number = 0;

  append(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
      newNode.next = newNode; // Points to itself
    } else {
      let tail = this.head;
      while (tail.next !== this.head) {
        tail = tail.next!;
      }
      tail.next = newNode;
      newNode.next = this.head;
    }
    this.length++;
  }

  // Useful for round-robin scheduling
  rotate(): void {
    if (this.head) {
      this.head = this.head.next;
    }
  }
}
```

## Time Complexity

| Operation | Singly | Doubly | Notes |
|-----------|--------|--------|-------|
| Access by index | O(n) | O(n) | Must traverse from head |
| Search | O(n) | O(n) | Linear traversal |
| Insert at head | O(1) | O(1) | |
| Insert at tail | O(1)* | O(1) | *With tail pointer |
| Insert at middle | O(n) | O(n) | Need to find position first |
| Delete at head | O(1) | O(1) | |
| Delete at tail | O(n) | O(1) | Singly needs prev node |
| Delete at middle | O(n) | O(1)** | **If node ref known |

## Common Linked List Algorithms

**Reverse a Linked List:**
```typescript
function reverseList<T>(head: ListNode<T> | null): ListNode<T> | null {
  let prev: ListNode<T> | null = null;
  let current = head;

  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }

  return prev;
}
```

**Detect Cycle (Floyd's Algorithm):**
```typescript
function hasCycle<T>(head: ListNode<T> | null): boolean {
  if (!head) return false;

  let slow: ListNode<T> | null = head;
  let fast: ListNode<T> | null = head;

  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }

  return false;
}
```

**Find Middle Node:**
```typescript
function findMiddle<T>(head: ListNode<T> | null): ListNode<T> | null {
  if (!head) return null;

  let slow: ListNode<T> | null = head;
  let fast: ListNode<T> | null = head;

  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
  }

  return slow;
}
```

**Merge Two Sorted Lists:**
```typescript
function mergeSortedLists<T>(
  l1: ListNode<T> | null,
  l2: ListNode<T> | null
): ListNode<T> | null {
  const dummy = new ListNode<T>(null as any);
  let current = dummy;

  while (l1 && l2) {
    if (l1.value <= l2.value) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }

  current.next = l1 || l2;
  return dummy.next;
}
```

## Arrays vs Linked Lists

| Aspect | Array | Linked List |
|--------|-------|-------------|
| Memory layout | Contiguous | Scattered |
| Memory overhead | None | Pointer per node |
| Cache performance | Excellent | Poor |
| Random access | O(1) | O(n) |
| Insert/delete at ends | O(1)/O(n) | O(1) |
| Insert/delete middle | O(n) | O(1)* |
| Memory allocation | May need resize | Per element |

*When position is known

## When to Use Linked Lists

**Prefer linked lists when:**
- Frequent insertions/deletions at arbitrary positions
- You don't know the size in advance
- Memory is fragmented (can't allocate contiguous block)
- Implementing stacks, queues, or deques
- Building more complex structures (LRU cache, adjacency lists)

**Prefer arrays when:**
- Need random access by index
- Memory is limited (no pointer overhead)
- Cache performance is critical
- Size is relatively stable
