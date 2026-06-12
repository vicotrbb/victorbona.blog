---
title: "Tries"
collection: "data-structures"
sourcePath: "Knowledge base/Data Structures/Tries.md"
order: 21
---
A **Trie** (pronounced "try", from retrieval) is a tree-like data structure used to store and retrieve strings efficiently. Also called a prefix tree, each node represents a character, and paths from root to nodes represent prefixes of stored strings. Tries excel at prefix-based operations.

* **Intent:** Provide efficient storage and retrieval of strings with support for prefix-based queries.
* **Use Cases:** Autocomplete systems, spell checkers, IP routing tables, dictionary implementations, search suggestions, word games (Scrabble, Boggle).
* **Key Properties:**
  - Each node represents one character
  - Root represents empty string
  - Path from root to node = prefix
  - O(k) operations where k = key length
  - Prefix sharing saves space

## Structure

```
Storing: ["cat", "car", "card", "care", "dog"]

        (root)
       /      \
      c        d
      |        |
      a        o
     /|\       |
    t r e      g
      |
      d

Words marked with end-of-word flag at: t, r, d (card), e, g
```

## Implementation

```typescript
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
  // Optional: store additional data
  value?: any;
  // Optional: count for frequency
  count: number = 0;
}

class Trie {
  private root: TrieNode = new TrieNode();

  // O(k) - Insert word
  insert(word: string): void {
    let node = this.root;

    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.count++;
  }

  // O(k) - Search for exact word
  search(word: string): boolean {
    const node = this.findNode(word);
    return node !== null && node.isEndOfWord;
  }

  // O(k) - Check if any word starts with prefix
  startsWith(prefix: string): boolean {
    return this.findNode(prefix) !== null;
  }

  private findNode(str: string): TrieNode | null {
    let node = this.root;

    for (const char of str) {
      if (!node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }

    return node;
  }

  // O(k) - Delete word
  delete(word: string): boolean {
    return this.deleteHelper(this.root, word, 0);
  }

  private deleteHelper(node: TrieNode, word: string, index: number): boolean {
    if (index === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      return node.children.size === 0;
    }

    const char = word[index];
    const child = node.children.get(char);
    if (!child) return false;

    const shouldDeleteChild = this.deleteHelper(child, word, index + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }

  // O(n) - Get all words with given prefix
  getWordsWithPrefix(prefix: string): string[] {
    const result: string[] = [];
    const node = this.findNode(prefix);

    if (node) {
      this.collectWords(node, prefix, result);
    }

    return result;
  }

  private collectWords(node: TrieNode, prefix: string, result: string[]): void {
    if (node.isEndOfWord) {
      result.push(prefix);
    }

    for (const [char, child] of node.children) {
      this.collectWords(child, prefix + char, result);
    }
  }

  // O(n) - Get all words
  getAllWords(): string[] {
    return this.getWordsWithPrefix('');
  }

  // Count words with prefix
  countWordsWithPrefix(prefix: string): number {
    const words = this.getWordsWithPrefix(prefix);
    return words.length;
  }
}

// Usage
const trie = new Trie();
['apple', 'app', 'apricot', 'banana', 'application'].forEach(w => trie.insert(w));

console.log(trie.search('app'));        // true
console.log(trie.search('ap'));         // false
console.log(trie.startsWith('ap'));     // true
console.log(trie.getWordsWithPrefix('app')); // ['app', 'apple', 'application']
```

## Compressed Trie (Radix Tree)

Reduces space by merging chains of single-child nodes:

```typescript
// Standard Trie for ["romane", "romanus", "romulus"]:
// r -> o -> m -> a -> n -> e
//                      └-> u -> s
//               └-> u -> l -> u -> s

// Radix Tree (compressed):
// rom -> an -> e
//         └-> us
//      └-> ulus

class RadixTreeNode {
  children: Map<string, RadixTreeNode> = new Map();
  isEndOfWord: boolean = false;
  prefix: string = '';
}

class RadixTree {
  private root: RadixTreeNode = new RadixTreeNode();

  insert(word: string): void {
    this.insertHelper(this.root, word);
  }

  private insertHelper(node: RadixTreeNode, remaining: string): void {
    if (remaining.length === 0) {
      node.isEndOfWord = true;
      return;
    }

    for (const [edgeKey, child] of node.children) {
      const commonLen = this.commonPrefixLength(edgeKey, remaining);

      if (commonLen > 0) {
        if (commonLen === edgeKey.length) {
          // Edge is prefix of remaining
          this.insertHelper(child, remaining.slice(commonLen));
          return;
        } else {
          // Split the edge
          const newNode = new RadixTreeNode();
          const newChild = new RadixTreeNode();

          newNode.children.set(edgeKey.slice(commonLen), child);
          node.children.delete(edgeKey);
          node.children.set(edgeKey.slice(0, commonLen), newNode);

          if (remaining.length === commonLen) {
            newNode.isEndOfWord = true;
          } else {
            newNode.children.set(remaining.slice(commonLen), newChild);
            newChild.isEndOfWord = true;
          }
          return;
        }
      }
    }

    // No common prefix found, add new edge
    const newNode = new RadixTreeNode();
    newNode.isEndOfWord = true;
    node.children.set(remaining, newNode);
  }

  private commonPrefixLength(a: string, b: string): number {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
    }
    return i;
  }

  search(word: string): boolean {
    return this.searchHelper(this.root, word);
  }

  private searchHelper(node: RadixTreeNode, remaining: string): boolean {
    if (remaining.length === 0) {
      return node.isEndOfWord;
    }

    for (const [edgeKey, child] of node.children) {
      if (remaining.startsWith(edgeKey)) {
        return this.searchHelper(child, remaining.slice(edgeKey.length));
      }
    }

    return false;
  }
}
```

## Time Complexity

| Operation | Trie | Hash Table | BST |
|-----------|------|------------|-----|
| Insert | O(k) | O(k) | O(k log n) |
| Search | O(k) | O(k) | O(k log n) |
| Delete | O(k) | O(k) | O(k log n) |
| Prefix search | O(k + m) | O(n*k) | O(n) |

k = key length, m = matches, n = total words

## Classic Trie Applications

### Autocomplete System
```typescript
class AutocompleteSystem {
  private trie: Trie;
  private frequencies: Map<string, number> = new Map();

  constructor(sentences: string[], times: number[]) {
    this.trie = new Trie();
    for (let i = 0; i < sentences.length; i++) {
      this.trie.insert(sentences[i]);
      this.frequencies.set(sentences[i], times[i]);
    }
  }

  getSuggestions(prefix: string, limit: number = 5): string[] {
    const words = this.trie.getWordsWithPrefix(prefix);

    // Sort by frequency (descending), then alphabetically
    return words
      .sort((a, b) => {
        const freqDiff = (this.frequencies.get(b) || 0) - (this.frequencies.get(a) || 0);
        return freqDiff !== 0 ? freqDiff : a.localeCompare(b);
      })
      .slice(0, limit);
  }

  addSentence(sentence: string): void {
    this.trie.insert(sentence);
    this.frequencies.set(sentence, (this.frequencies.get(sentence) || 0) + 1);
  }
}

const ac = new AutocompleteSystem(
  ['i love you', 'island', 'i love coding', 'ironman'],
  [5, 3, 2, 1]
);
console.log(ac.getSuggestions('i ')); // ['i love you', 'i love coding']
```

### Word Search in Board
```typescript
function findWords(board: string[][], words: string[]): string[] {
  const trie = new Trie();
  words.forEach(w => trie.insert(w));

  const result: Set<string> = new Set();
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r: number, c: number, node: TrieNode, path: string): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (board[r][c] === '#') return; // Visited

    const char = board[r][c];
    const child = node.children.get(char);
    if (!child) return;

    const newPath = path + char;
    if (child.isEndOfWord) {
      result.add(newPath);
    }

    board[r][c] = '#'; // Mark visited

    dfs(r + 1, c, child, newPath);
    dfs(r - 1, c, child, newPath);
    dfs(r, c + 1, child, newPath);
    dfs(r, c - 1, child, newPath);

    board[r][c] = char; // Restore
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Access root's children directly
      dfs(r, c, trie['root'], '');
    }
  }

  return Array.from(result);
}
```

### Longest Common Prefix
```typescript
function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return '';

  const trie = new Trie();
  strs.forEach(s => trie.insert(s));

  let prefix = '';
  let node = trie['root'];

  while (node.children.size === 1 && !node.isEndOfWord) {
    const [char, child] = node.children.entries().next().value;
    prefix += char;
    node = child;
  }

  return prefix;
}

console.log(longestCommonPrefix(['flower', 'flow', 'flight'])); // 'fl'
```

### Replace Words (Dictionary)
```typescript
function replaceWords(dictionary: string[], sentence: string): string {
  const trie = new Trie();
  dictionary.forEach(root => trie.insert(root));

  return sentence.split(' ').map(word => {
    let node = trie['root'];
    let prefix = '';

    for (const char of word) {
      if (!node.children.has(char) || node.isEndOfWord) {
        break;
      }
      node = node.children.get(char)!;
      prefix += char;
    }

    return node.isEndOfWord ? prefix : word;
  }).join(' ');
}

console.log(replaceWords(
  ['cat', 'bat', 'rat'],
  'the cattle was rattled by the battery'
)); // 'the cat was rat by the bat'
```

### IP Routing Table (Longest Prefix Match)
```typescript
class IPRouter {
  private root: TrieNode = new TrieNode();

  addRoute(prefix: string, nextHop: string): void {
    // prefix format: "192.168.1.0/24"
    const [ip, maskLen] = prefix.split('/');
    const binary = this.ipToBinary(ip).slice(0, parseInt(maskLen));

    let node = this.root;
    for (const bit of binary) {
      if (!node.children.has(bit)) {
        node.children.set(bit, new TrieNode());
      }
      node = node.children.get(bit)!;
    }
    node.value = nextHop;
  }

  lookup(ip: string): string | null {
    const binary = this.ipToBinary(ip);
    let node = this.root;
    let lastMatch: string | null = null;

    for (const bit of binary) {
      if (node.value) {
        lastMatch = node.value;
      }
      if (!node.children.has(bit)) {
        break;
      }
      node = node.children.get(bit)!;
    }

    if (node.value) lastMatch = node.value;
    return lastMatch;
  }

  private ipToBinary(ip: string): string {
    return ip.split('.')
      .map(octet => parseInt(octet).toString(2).padStart(8, '0'))
      .join('');
  }
}
```

## Space Optimization

```
Standard Trie for ASCII:
- 128 pointers per node (most null)
- Memory: O(n * k * 128)

Optimizations:
1. Hash Map children: O(n * k * avg_children)
2. Radix Tree: Merge chains
3. Array-based: Fixed alphabet size
4. Double-Array Trie: Compact representation
```

## When to Use Tries

**Use tries when:**
- Need prefix-based search
- Building autocomplete systems
- Implementing spell checkers
- IP routing (longest prefix match)
- Word games

**Consider alternatives:**
- Exact match only → [Hash Tables](/compendium/data-structures/hash-tables)
- Sorted iteration needed → [Binary Search Trees](/compendium/data-structures/binary-search-trees)
- Memory constrained → Radix Tree or [Hash Tables](/compendium/data-structures/hash-tables)
- Fuzzy matching needed → BK-tree (not covered)
