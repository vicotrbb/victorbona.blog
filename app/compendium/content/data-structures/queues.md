---
title: "Queues"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Queues.md"
order: 16
---
A **Queue** is a linear data structure that follows the First-In-First-Out (FIFO) principle. The first element added is the first one to be removed. Think of it like a line at a store: people join at the back and leave from the front.

* **Intent:** Provide a collection where elements are added at one end (rear) and removed from the other end (front), maintaining insertion order.
* **Use Cases:** Task scheduling, BFS traversal, print job spooling, message queues, request handling, buffering, CPU scheduling, call center systems.
* **Key Operations:**
  - `enqueue(item)` - Add item to rear
  - `dequeue()` - Remove and return front item
  - `front()/peek()` - View front item without removing
  - `isEmpty()` - Check if queue is empty

## Types of Queues

### Simple Queue (FIFO)
```typescript
class Queue<T> {
  private items: T[] = [];
  private frontIndex: number = 0;

  // O(1) - Add to rear
  enqueue(item: T): void {
    this.items.push(item);
  }

  // O(1) amortized - Remove from front
  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.frontIndex];
    this.frontIndex++;

    // Cleanup when half the array is empty
    if (this.frontIndex > this.items.length / 2) {
      this.items = this.items.slice(this.frontIndex);
      this.frontIndex = 0;
    }
    return item;
  }

  // O(1) - View front
  front(): T | undefined {
    return this.items[this.frontIndex];
  }

  isEmpty(): boolean {
    return this.frontIndex >= this.items.length;
  }

  size(): number {
    return this.items.length - this.frontIndex;
  }
}

// Usage
const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);
console.log(queue.dequeue()); // 1
console.log(queue.front());   // 2
```

### Circular Queue (Ring Buffer)
Fixed-size queue that wraps around, avoiding the need to shift elements.

```typescript
class CircularQueue<T> {
  private items: (T | undefined)[];
  private front: number = 0;
  private rear: number = -1;
  private count: number = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.items = new Array(capacity);
  }

  enqueue(item: T): boolean {
    if (this.isFull()) return false;
    this.rear = (this.rear + 1) % this.capacity;
    this.items[this.rear] = item;
    this.count++;
    return true;
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.front];
    this.items[this.front] = undefined;
    this.front = (this.front + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek(): T | undefined {
    return this.items[this.front];
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  size(): number {
    return this.count;
  }
}

// Usage - useful for bounded buffers
const buffer = new CircularQueue<string>(3);
buffer.enqueue("a");
buffer.enqueue("b");
buffer.enqueue("c");
console.log(buffer.enqueue("d")); // false (full)
console.log(buffer.dequeue());    // "a"
console.log(buffer.enqueue("d")); // true (space available)
```

### Deque (Double-Ended Queue)
Allows insertion and removal at both ends.

```typescript
class Deque<T> {
  private items: T[] = [];

  // O(1) - Add to front
  addFront(item: T): void {
    this.items.unshift(item);
  }

  // O(1) amortized - Add to rear
  addRear(item: T): void {
    this.items.push(item);
  }

  // O(n) - Remove from front
  removeFront(): T | undefined {
    return this.items.shift();
  }

  // O(1) - Remove from rear
  removeRear(): T | undefined {
    return this.items.pop();
  }

  peekFront(): T | undefined {
    return this.items[0];
  }

  peekRear(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}
```

### Priority Queue
Elements are dequeued based on priority, not insertion order. See [Heaps](/compendium/data-structures/heaps) for efficient implementation.

```typescript
class PriorityQueue<T> {
  private items: { value: T; priority: number }[] = [];

  // O(n) - Insert maintaining sorted order
  enqueue(value: T, priority: number): void {
    const item = { value, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  // O(1) - Remove highest priority (lowest number)
  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }

  peek(): T | undefined {
    return this.items[0]?.value;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Usage
const pq = new PriorityQueue<string>();
pq.enqueue("low priority task", 3);
pq.enqueue("high priority task", 1);
pq.enqueue("medium priority task", 2);
console.log(pq.dequeue()); // "high priority task"
console.log(pq.dequeue()); // "medium priority task"
```

**Note:** For production use, implement priority queues with [Heaps](/compendium/data-structures/heaps) for O(log n) operations.

### Linked List Queue
```typescript
class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

class LinkedQueue<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length: number = 0;

  // O(1) - Add to rear
  enqueue(item: T): void {
    const newNode = new ListNode(item);
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  // O(1) - Remove from front
  dequeue(): T | undefined {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.length--;
    return value;
  }

  front(): T | undefined {
    return this.head?.value;
  }

  isEmpty(): boolean {
    return this.head === null;
  }

  size(): number {
    return this.length;
  }
}
```

## Time Complexity

| Operation | Array Queue | Circular Queue | Linked Queue |
|-----------|-------------|----------------|--------------|
| enqueue | O(1)* | O(1) | O(1) |
| dequeue | O(1)* | O(1) | O(1) |
| peek | O(1) | O(1) | O(1) |
| isEmpty | O(1) | O(1) | O(1) |

*Amortized; may involve cleanup/resize

## Classic Queue Applications

### Breadth-First Search (BFS)
```typescript
function bfs(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>();
  const result: number[] = [];
  const queue = new Queue<number>();

  queue.enqueue(start);
  visited.add(start);

  while (!queue.isEmpty()) {
    const node = queue.dequeue()!;
    result.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.enqueue(neighbor);
      }
    }
  }

  return result;
}

// Example graph: 1 -> [2, 3], 2 -> [4], 3 -> [4]
const graph = new Map([
  [1, [2, 3]],
  [2, [4]],
  [3, [4]],
  [4, []]
]);
console.log(bfs(graph, 1)); // [1, 2, 3, 4]
```

### Level Order Tree Traversal
```typescript
interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];

  const result: number[][] = [];
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);

  while (!queue.isEmpty()) {
    const levelSize = queue.size();
    const currentLevel: number[] = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.dequeue()!;
      currentLevel.push(node.value);

      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
```

### Task Scheduler / Round Robin
```typescript
interface Task {
  id: string;
  remainingTime: number;
}

function roundRobinScheduler(tasks: Task[], quantum: number): string[] {
  const queue = new Queue<Task>();
  const executionOrder: string[] = [];

  for (const task of tasks) {
    queue.enqueue({ ...task });
  }

  while (!queue.isEmpty()) {
    const task = queue.dequeue()!;
    const executionTime = Math.min(quantum, task.remainingTime);

    executionOrder.push(`${task.id}(${executionTime}ms)`);
    task.remainingTime -= executionTime;

    if (task.remainingTime > 0) {
      queue.enqueue(task);
    }
  }

  return executionOrder;
}

const tasks = [
  { id: "A", remainingTime: 5 },
  { id: "B", remainingTime: 3 },
  { id: "C", remainingTime: 7 }
];
console.log(roundRobinScheduler(tasks, 2));
// ["A(2ms)", "B(2ms)", "C(2ms)", "A(2ms)", "B(1ms)", "C(2ms)", "A(1ms)", "C(2ms)", "C(1ms)"]
```

### Sliding Window Maximum (using Deque)
```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  const deque: number[] = []; // Store indices

  for (let i = 0; i < nums.length; i++) {
    // Remove indices outside window
    while (deque.length && deque[0] < i - k + 1) {
      deque.shift();
    }

    // Remove smaller elements (they won't be maximum)
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }

    deque.push(i);

    // Add to result once window is full
    if (i >= k - 1) {
      result.push(nums[deque[0]]);
    }
  }

  return result;
}

console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3));
// [3, 3, 5, 5, 6, 7]
```

## Message Queues in Distributed Systems

In distributed systems, message queues (like RabbitMQ, Apache Kafka, AWS SQS) use queue concepts for:

- **Decoupling**: Producers and consumers operate independently
- **Load balancing**: Multiple consumers process from same queue
- **Resilience**: Messages persist if consumers are down
- **Rate limiting**: Control processing speed

```typescript
// Conceptual producer-consumer pattern
class MessageQueue<T> {
  private queue = new Queue<T>();
  private subscribers: ((message: T) => void)[] = [];

  publish(message: T): void {
    this.queue.enqueue(message);
    this.processNext();
  }

  subscribe(handler: (message: T) => void): void {
    this.subscribers.push(handler);
  }

  private processNext(): void {
    if (this.queue.isEmpty() || this.subscribers.length === 0) return;

    const message = this.queue.dequeue()!;
    // Round-robin to subscribers
    const handler = this.subscribers.shift()!;
    this.subscribers.push(handler);
    handler(message);
  }
}
```

## When to Use Queues

**Use queues when:**
- Need FIFO processing order
- Task scheduling and job processing
- BFS graph traversal
- Buffering between producer and consumer
- Rate limiting or throttling
- Managing requests in order

**Choose queue type based on:**
- Simple FIFO → Standard Queue
- Fixed size buffer → Circular Queue
- Need both ends → Deque
- Process by importance → Priority Queue (use [Heaps](/compendium/data-structures/heaps))
