---
title: "Stacks"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Stacks.md"
order: 20
---
A **Stack** is a linear data structure that follows the Last-In-First-Out (LIFO) principle. The last element added is the first one to be removed. Think of it like a stack of plates: you can only add or remove from the top.

* **Intent:** Provide a collection with restricted access where elements are added and removed only from one end (the top).
* **Use Cases:** Function call management (call stack), undo/redo operations, expression parsing and evaluation, backtracking algorithms (DFS, maze solving), syntax parsing (matching parentheses), browser history (back button).
* **Key Operations:**
  - `push(item)` - Add item to top
  - `pop()` - Remove and return top item
  - `peek()/top()` - View top item without removing
  - `isEmpty()` - Check if stack is empty

## Implementation

### Array-based Stack
```typescript
class Stack<T> {
  private items: T[] = [];

  // O(1) amortized - Add to top
  push(item: T): void {
    this.items.push(item);
  }

  // O(1) - Remove from top
  pop(): T | undefined {
    return this.items.pop();
  }

  // O(1) - View top without removing
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}

// Usage
const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.peek());  // 3
console.log(stack.pop());   // 3
console.log(stack.pop());   // 2
console.log(stack.size());  // 1
```

### Linked List-based Stack
```typescript
class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;
  constructor(value: T) { this.value = value; }
}

class LinkedStack<T> {
  private top: ListNode<T> | null = null;
  private length: number = 0;

  // O(1) - Add to top
  push(item: T): void {
    const newNode = new ListNode(item);
    newNode.next = this.top;
    this.top = newNode;
    this.length++;
  }

  // O(1) - Remove from top
  pop(): T | undefined {
    if (!this.top) return undefined;
    const value = this.top.value;
    this.top = this.top.next;
    this.length--;
    return value;
  }

  // O(1) - View top
  peek(): T | undefined {
    return this.top?.value;
  }

  isEmpty(): boolean {
    return this.top === null;
  }

  size(): number {
    return this.length;
  }
}
```

## Time Complexity

| Operation | Array-based | Linked List-based |
|-----------|-------------|-------------------|
| push | O(1)* | O(1) |
| pop | O(1) | O(1) |
| peek | O(1) | O(1) |
| isEmpty | O(1) | O(1) |
| search | O(n) | O(n) |

*Amortized O(1); worst case O(n) when array resizes

## Classic Stack Applications

### Balanced Parentheses
```typescript
function isBalanced(s: string): boolean {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{'
  };

  for (const char of s) {
    if ('([{'.includes(char)) {
      stack.push(char);
    } else if (')]}'. includes(char)) {
      if (stack.isEmpty() || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.isEmpty();
}

console.log(isBalanced("({[]})")); // true
console.log(isBalanced("([)]"));   // false
```

### Evaluate Postfix Expression
```typescript
function evaluatePostfix(expression: string): number {
  const stack = new Stack<number>();
  const tokens = expression.split(' ');

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      stack.push(Number(token));
    } else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(Math.trunc(a / b)); break;
      }
    }
  }

  return stack.pop()!;
}

// "3 4 + 2 *" = (3 + 4) * 2 = 14
console.log(evaluatePostfix("3 4 + 2 *")); // 14
```

### Infix to Postfix Conversion
```typescript
function infixToPostfix(expression: string): string {
  const stack = new Stack<string>();
  const output: string[] = [];
  const precedence: Record<string, number> = {
    '+': 1, '-': 1, '*': 2, '/': 2, '^': 3
  };

  const tokens = expression.match(/\d+|[+\-*/^()]/g) || [];

  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      output.push(token);
    } else if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (!stack.isEmpty() && stack.peek() !== '(') {
        output.push(stack.pop()!);
      }
      stack.pop(); // Remove '('
    } else {
      while (
        !stack.isEmpty() &&
        stack.peek() !== '(' &&
        precedence[stack.peek()!] >= precedence[token]
      ) {
        output.push(stack.pop()!);
      }
      stack.push(token);
    }
  }

  while (!stack.isEmpty()) {
    output.push(stack.pop()!);
  }

  return output.join(' ');
}

console.log(infixToPostfix("3 + 4 * 2")); // "3 4 2 * +"
```

### Depth-First Search (DFS)
```typescript
function dfsIterative(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>();
  const result: number[] = [];
  const stack = new Stack<number>();

  stack.push(start);

  while (!stack.isEmpty()) {
    const node = stack.pop()!;

    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);

    // Add neighbors in reverse order to maintain left-to-right traversal
    const neighbors = graph.get(node) || [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited.has(neighbors[i])) {
        stack.push(neighbors[i]);
      }
    }
  }

  return result;
}
```

### Min Stack (O(1) min operation)
```typescript
class MinStack {
  private stack: number[] = [];
  private minStack: number[] = [];

  push(val: number): void {
    this.stack.push(val);
    const currentMin = this.minStack.length === 0
      ? val
      : Math.min(val, this.minStack[this.minStack.length - 1]);
    this.minStack.push(currentMin);
  }

  pop(): void {
    this.stack.pop();
    this.minStack.pop();
  }

  top(): number {
    return this.stack[this.stack.length - 1];
  }

  getMin(): number {
    return this.minStack[this.minStack.length - 1];
  }
}

const minStack = new MinStack();
minStack.push(3);
minStack.push(5);
minStack.push(2);
minStack.push(1);
console.log(minStack.getMin()); // 1
minStack.pop();
console.log(minStack.getMin()); // 2
```

### Next Greater Element
```typescript
function nextGreaterElements(nums: number[]): number[] {
  const result = new Array(nums.length).fill(-1);
  const stack = new Stack<number>(); // Stack of indices

  for (let i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[stack.peek()!] < nums[i]) {
      result[stack.pop()!] = nums[i];
    }
    stack.push(i);
  }

  return result;
}

console.log(nextGreaterElements([4, 5, 2, 25])); // [5, 25, 25, -1]
```

## The Call Stack

In programming, the **call stack** is how function calls are managed:

```typescript
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// Call stack for factorial(4):
// factorial(4) waits for factorial(3)
//   factorial(3) waits for factorial(2)
//     factorial(2) waits for factorial(1)
//       factorial(1) returns 1
//     factorial(2) returns 2 * 1 = 2
//   factorial(3) returns 3 * 2 = 6
// factorial(4) returns 4 * 6 = 24
```

This is why deep recursion can cause "stack overflow" errors - the call stack has limited size.

## When to Use Stacks

**Use stacks when:**
- You need LIFO access pattern
- Tracking function calls or nested operations
- Parsing expressions or syntax
- Implementing undo functionality
- DFS traversal
- Backtracking algorithms

**Consider alternatives:**
- Need FIFO → [Queues](/compendium/data-structures/queues)
- Need access to both ends → Deque
- Need to access arbitrary elements → [Arrays](/compendium/data-structures/arrays) or [Linked Lists](/compendium/data-structures/linked-lists)
