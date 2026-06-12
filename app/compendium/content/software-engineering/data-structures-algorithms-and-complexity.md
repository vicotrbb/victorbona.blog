---
title: "Data Structures Algorithms and Complexity"
collection: "software-engineering"
sourcePath: "Knowledge base/Software Engineering/03 Data Structures Algorithms and Complexity.md"
order: 3
---
# Data Structures Algorithms and Complexity

This note connects algorithmic fundamentals to production engineering decisions. In production systems, algorithms are not only interview exercises. They shape latency, memory pressure, database cost, incident blast radius, scaling limits, and the ability to reason about correctness under load.

## Existing anchors

- [Data Structures/Data Structures](/compendium/data-structures/data-structures)
- [Data Structures/Arrays](/compendium/data-structures/arrays)
- [Data Structures/Linked Lists](/compendium/data-structures/linked-lists)
- [Data Structures/Stacks](/compendium/data-structures/stacks)
- [Data Structures/Queues](/compendium/data-structures/queues)
- [Data Structures/Hash Tables](/compendium/data-structures/hash-tables)
- [Data Structures/Hash Sets](/compendium/data-structures/hash-sets)
- [Data Structures/Binary Trees](/compendium/data-structures/binary-trees)
- [Data Structures/Binary Search Trees](/compendium/data-structures/binary-search-trees)
- [Data Structures/AVL Trees](/compendium/data-structures/avl-trees)
- [Data Structures/Red-Black Trees](/compendium/data-structures/red-black-trees)
- [Data Structures/B-Trees](/compendium/data-structures/b-trees)
- [Data Structures/Heaps](/compendium/data-structures/heaps)
- [Data Structures/Tries](/compendium/data-structures/tries)
- [Data Structures/Segment Trees](/compendium/data-structures/segment-trees)
- [Data Structures/Fenwick Trees](/compendium/data-structures/fenwick-trees)
- [Data Structures/Graphs](/compendium/data-structures/graphs)
- [Data Structures/Bloom Filters](/compendium/data-structures/bloom-filters)
- [Data Structures/Skip Lists](/compendium/data-structures/skip-lists)
- [Data Structures/Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find)
- [Data Structures/LRU Cache](/compendium/data-structures/lru-cache)

## Complexity as an engineering tool

Big O is a starting point. It tells you how an algorithm grows as input size grows, but production engineering also asks what resource is being consumed, where the resource limit is, and whether the system fails gradually or abruptly.

Complexity reasoning is most useful when it is tied to a real workload:

- Number of users, tenants, rows, messages, files, nodes, edges, keys, or partitions.
- Operation mix: reads, writes, deletes, scans, joins, merges, retries, and background maintenance.
- Distribution: uniform, Zipfian, time clustered, tenant skewed, adversarial, or bursty.
- Constraints: p50 latency, p95 latency, p99 latency, memory ceiling, disk budget, network budget, CPU budget, and operational simplicity.
- Failure mode: slow response, memory exhaustion, retry storm, compaction backlog, lock convoy, hot shard, or data loss.

| Complexity signal | What it means in production | Example question |
|---|---|---|
| Time complexity | CPU work per operation or batch. | Does this request loop over every tenant, every row, or only the affected keys? |
| Space complexity | Memory retained during and after the operation. | Does this export stream rows or materialize the whole result set? |
| IO complexity | Disk reads, disk writes, fsyncs, page reads, and seeks. | Does this query use one index seek or scan millions of pages? |
| Network complexity | Number and size of remote calls. | Is this endpoint O(1) database calls or O(n) service calls? |
| Contention complexity | Work amplification caused by shared locks, atomics, queues, or hot keys. | Does adding workers improve throughput or only increase waiting? |
| Tail complexity | Work at p95 and p99, not only average work. | What happens when a tenant has 100x more records than the median tenant? |
| Maintenance complexity | Background work caused by the foreground operation. | Does each write create compaction, reindexing, cache invalidation, or fanout? |

Practical rule: state complexity in the same units that fail in production. "This is O(n)" is less useful than "this allocates one object per row, performs one remote call per row, and blocks the request thread until all calls finish."

## Complexity beyond Big O

Big O intentionally ignores details that can dominate real systems.

| Dimension | Why it matters | Production example |
|---|---|---|
| Constant factors | A theoretically better algorithm may have a larger fixed cost. | A regex engine, JSON parser, or crypto primitive can dominate an O(n) pass. |
| Cache locality | Sequential memory access is often much faster than pointer chasing. | A sorted array can beat a tree for small or medium read-heavy indexes. |
| Allocation rate | Frequent allocation increases garbage collection, fragmentation, and allocator contention. | Building temporary maps inside every request raises latency under load. |
| Branch prediction | Data-dependent branches can reduce CPU pipeline efficiency. | A tight loop with unpredictable branches may be slower than a branchless version. |
| Vectorization | Contiguous homogeneous data can use SIMD or optimized library paths. | Columnar analytics scans can process many values per CPU instruction. |
| Lock contention | Serialized critical sections cap throughput. | A global cache lock turns a many-core service into a single-lane service. |
| Amortization | Average cost can hide occasional expensive operations. | Hash table resize, LSM compaction, and vector growth create latency spikes. |
| Backpressure | Algorithms that accept work faster than they process it create queues. | A consumer with O(n) per message accumulates lag during bursts. |
| Data skew | Average cardinality hides large tenants and hot keys. | A query fast for most customers times out for the largest customer. |
| Adversarial input | Inputs may be malicious or accidentally worst case. | Poor hash choices can turn expected O(1) into O(n) chains. |

Complexity should be documented with assumptions. For example: "Expected O(1) lookup with a good hash and bounded load factor; worst case O(n) if many keys collide."

## Data structure selection

The right structure follows the dominant operation and the invariant the system must preserve.

| Need | Usually consider | Avoid when |
|---|---|---|
| Fast lookup by exact key | [Data Structures/Hash Tables](/compendium/data-structures/hash-tables), [Data Structures/Hash Sets](/compendium/data-structures/hash-sets) | You need ordered scans, prefix queries, or predictable worst-case latency. |
| Ordered iteration and range queries | [Data Structures/Binary Search Trees](/compendium/data-structures/binary-search-trees), [Data Structures/AVL Trees](/compendium/data-structures/avl-trees), [Data Structures/Red-Black Trees](/compendium/data-structures/red-black-trees), [Data Structures/B-Trees](/compendium/data-structures/b-trees), [Data Structures/Skip Lists](/compendium/data-structures/skip-lists) | You only need membership and memory is tight. |
| Append and indexed access | [Data Structures/Arrays](/compendium/data-structures/arrays) or vectors | Frequent inserts or deletes in the middle dominate. |
| Frequent insert or delete at known nodes | [Data Structures/Linked Lists](/compendium/data-structures/linked-lists) | You need cache locality, random access, or compact memory layout. |
| FIFO work | [Data Structures/Queues](/compendium/data-structures/queues) | Priority, deadline, or fairness ordering is required. |
| LIFO work | [Data Structures/Stacks](/compendium/data-structures/stacks) | Work must preserve arrival order. |
| Top k or next deadline | [Data Structures/Heaps](/compendium/data-structures/heaps) | You need efficient search, delete arbitrary item, or ordered full scan. |
| Prefix lookup | [Data Structures/Tries](/compendium/data-structures/tries) | Keys are long, sparse, and memory is constrained. |
| Interval or prefix sums | [Data Structures/Segment Trees](/compendium/data-structures/segment-trees), [Data Structures/Fenwick Trees](/compendium/data-structures/fenwick-trees) | Data is small enough for direct recomputation or updates are rare. |
| Connectivity | [Data Structures/Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find) | You need shortest paths, deletion of edges, or path reconstruction. |
| Eviction by recency | [Data Structures/LRU Cache](/compendium/data-structures/lru-cache) | Frequency, cost, size, or TTL should dominate eviction. |

Selection checklist:

- What is the invariant: membership, order, priority, connectivity, recency, prefix, uniqueness, or reachability?
- What is the read to write ratio?
- Are keys fixed size or variable size?
- Is the data bounded or unbounded?
- Is iteration order important?
- Is worst-case latency important, or is expected latency acceptable?
- Does the structure live in memory, on disk, across a network, or inside a database index?
- Can the structure be rebuilt, or must every mutation be durable?
- Is concurrent mutation required?

## Production examples

| Scenario | Reasonable choice | Reasoning |
|---|---|---|
| API authorization checks for user permissions | Hash set per user or compressed bitmap per permission domain | Exact membership dominates. Keep checks O(1) or word-level bit operations. |
| Search suggestions by prefix | Trie, compressed trie, or sorted array with binary search range | Prefix lookup is the invariant. Sorted arrays may be simpler and more cache friendly for static dictionaries. |
| Job scheduler by next run time | Min heap or timing wheel | Pop the next deadline quickly. Timing wheels help when deadlines are bucketed. |
| Tenant billing aggregation | Streamed fold plus database index | Avoid materializing all events. Complexity is bounded by scanned events and grouping cardinality. |
| Dependency build order | Graph plus topological sort | Detect cycles and produce an execution order. |
| Cache with bounded memory | LRU, LFU, TinyLFU, or size-aware eviction | Recency alone may be wrong when entries have different costs and sizes. |
| Duplicate detection in a pipeline | Hash set, Bloom filter, or external sort | Exactness, memory budget, and replay semantics determine the choice. |
| Time-series downsampling | Ring buffers, sketches, reservoir sampling, or segment tree | Preserve useful aggregates without storing every raw point forever. |
| Database secondary index | B-Tree or LSM-backed index | Workload decides between range-read friendliness and write amplification tradeoffs. |

## Storage oriented structures

Storage structures optimize for the cost model of disks, SSDs, pages, block caches, write-ahead logs, and background maintenance. The dominant question is often not "how many comparisons" but "how many page reads, page writes, and compactions."

| Structure | Production use |
|---|---|
| B-Tree | Database indexes, filesystem metadata, range queries. |
| LSM Tree | Write-heavy storage, compaction based databases, log structured systems. |
| Bloom Filter | Negative lookup acceleration, storage engine read reduction, cache membership checks. |
| Skip List | Ordered in-memory indexes, memtables, concurrent maps. |
| Hash Table | Caches, lookup tables, joins, dedupe stores. |
| Trie | Prefix search, routing tables, autocomplete, IP matching variants. |
| Heap | Schedulers, timers, priority queues. |
| Graph | Dependency analysis, reachability, planning, workflow systems. |

| Structure | Strengths | Tradeoffs | Operational signals |
|---|---|---|---|
| B-Tree and B+Tree | Ordered keys, range scans, stable read latency, page-oriented layout. | Random writes update pages in place and may split pages. | Page cache hit ratio, index bloat, random IO, fill factor. |
| LSM Tree | High write throughput, sequential writes, good compression, natural write-ahead flow. | Read amplification, write amplification, compaction stalls, tombstone buildup. | Compaction backlog, level sizes, read amplification, write stalls. |
| Log structured file | Append-only writes, simple crash recovery, fast sequential IO. | Requires indexing, garbage collection, and segment cleaning. | Segment count, reclaimable bytes, replay time. |
| Columnar storage | Efficient scans, compression, vectorized analytics. | Point updates are harder, row reconstruction costs more. | Scan throughput, compression ratio, skipped row groups. |
| Inverted index | Text search, tag search, document lookup by term. | Updates and deletes require segment management. | Segment count, merge backlog, postings list size. |
| Bitmap index | Low-cardinality filters, fast set operations. | High-cardinality raw bitmaps can be large without compression. | Bitmap density, compression ratio, filter selectivity. |
| Spatial index | Geospatial and multidimensional lookup. | More complex balancing and query planning. | Bounding box selectivity, false candidate count. |

Storage examples:

- A B-Tree index is often best for "all orders for tenant X between two dates" because it supports ordered range scans.
- An LSM design is often best for "accept many writes per second and tolerate background compaction" because it turns random writes into sequential writes.
- A Bloom filter in an LSM can avoid reading disk files that definitely do not contain a key.
- An inverted index is better than scanning all documents when the query starts with terms rather than primary keys.

## Cache locality

Modern CPUs are fast relative to memory. Data layout can dominate asymptotic complexity for realistic sizes.

| Layout | Good for | Weakness |
|---|---|---|
| Contiguous array | Scans, binary search, vectorization, compact storage. | Middle insertions and deletions require shifting. |
| Array of structs | Row-like access where all fields are used together. | Wastes bandwidth if only one field is read across many records. |
| Struct of arrays | Column-like scans and SIMD. | More awkward when complete objects are frequently accessed. |
| Linked nodes | Stable references and cheap local insertion once position is known. | Pointer chasing, poor locality, per-node allocation overhead. |
| Packed trie or radix tree | Prefix lookup with less pointer overhead than naive trie. | More complex implementation and update logic. |
| Ring buffer | Predictable bounded memory and sequential access. | Fixed capacity and overwrite policy must be explicit. |

Common pattern: a sorted vector plus binary search can outperform a tree for small to medium collections because it has fewer allocations and better locality, even though insertion is O(n). This is especially true when reads dominate writes.

## Memory allocation and ownership

Allocation behavior is part of algorithmic complexity.

| Pattern | Risk | Mitigation |
|---|---|---|
| Allocate per item in a hot loop | High allocator overhead and garbage collection pressure. | Preallocate, reuse buffers, use arenas, batch work. |
| Build whole response in memory | Memory spikes and out-of-memory failures. | Stream results, paginate, use bounded buffers. |
| Store duplicate keys and strings | Hidden memory multiplier. | Intern strings, use references, normalize schemas, compress. |
| Unbounded cache | Slow memory leak disguised as optimization. | Set maximum entries, maximum bytes, TTL, and admission rules. |
| Per-object metadata overhead | Many small objects cost much more than payload size. | Pack data, use arrays, use specialized primitive collections. |
| Fragmented long-lived heap | More memory retained and slower allocation. | Separate lifetimes, pool carefully, compact where runtime allows. |

When choosing a structure, estimate memory as concretely as possible:

- Number of entries.
- Key size.
- Value size.
- Pointer and object overhead.
- Load factor or spare capacity.
- Index overhead.
- Replication factor.
- Cache duplication.

Example: a hash table with 10 million entries is not just the payload. It also includes buckets, pointers, hash metadata, allocator overhead, spare capacity for load factor, and possibly duplicate key storage.

## Concurrent data structures

Concurrent structures add correctness dimensions:

- Linearization point: the instant an operation appears to take effect.
- Progress guarantee: blocking, lock-free, wait-free.
- Memory reclamation: safe deletion while other threads may read.
- Contention behavior: throughput under many writers.
- Fairness: whether some actors starve.

Examples:

- Concurrent queue: producer consumer systems, work stealing, async runtimes.
- Concurrent hash map: shared caches and registries.
- Ring buffer: low latency streams and logging.
- Copy-on-write map: read-heavy configuration snapshots.
- RCU list: read-heavy kernel and infrastructure workloads.

| Structure | Useful when | Watch for |
|---|---|---|
| Mutex-protected map | Simplicity and moderate contention matter more than maximum throughput. | Lock convoying, long critical sections, blocking under callbacks. |
| Sharded map | Many independent keys are updated concurrently. | Hot shards, expensive resize, iteration across shards. |
| Concurrent queue | Producers and consumers run independently. | Backpressure, fairness, memory growth, cancellation semantics. |
| Work-stealing deque | Task schedulers and fork-join workloads. | Subtle correctness and load balancing under uneven tasks. |
| Ring buffer | Bounded low-latency handoff. | Overflow policy, single producer vs multiple producer assumptions. |
| Copy-on-write snapshot | Reads dominate and updates are rare. | Update cost copies large state, stale readers may observe old versions. |
| RCU style structure | Extremely read-heavy systems. | Memory reclamation after readers finish, complex lifecycle reasoning. |
| Lock-free stack or queue | Blocking is unacceptable in a narrow hot path. | ABA problems, memory ordering, reclamation, harder testing. |

Progress terms:

- Blocking: a stalled thread can prevent others from completing.
- Lock-free: at least one thread makes progress even if others stall.
- Wait-free: every operation completes in a bounded number of steps.
- Obstruction-free: a thread makes progress if it eventually runs alone.

Production guidance:

- Prefer simple locks until measurement shows contention is material.
- Keep critical sections small and avoid remote calls while holding locks.
- Make ownership and cancellation explicit for queued work.
- Bound queues or apply backpressure before memory becomes the queue.
- Test under skew, not only equal producer and consumer rates.
- Treat memory ordering bugs as correctness bugs, not performance bugs.

## Probabilistic structures

Probabilistic structures trade exactness for lower memory, lower IO, or bounded latency. They are valuable when the system can tolerate a known error shape.

| Structure | Answers | Error type | Production use |
|---|---|---|---|
| [Data Structures/Bloom Filters](/compendium/data-structures/bloom-filters) | "Might contain key?" | False positives, no false negatives if used correctly. | Avoid unnecessary disk reads or remote lookups. |
| Counting Bloom filter | "Might contain key?" with deletion support | False positives and counter overflow risk. | Membership with removals. |
| Cuckoo filter | "Might contain key?" | False positives, supports deletion. | Compact membership filters. |
| HyperLogLog | "How many distinct items?" | Approximate cardinality. | Unique users, unique IPs, distinct keys at scale. |
| Count-Min Sketch | "How frequent is this item?" | Overestimates counts. | Heavy hitters, abuse detection, traffic analysis. |
| Reservoir sampling | "Representative sample from stream?" | Sampling error. | Observability, debugging, analytics sampling. |
| Quantile sketch | "What is the p95 or p99?" | Approximate quantiles. | Latency telemetry and large metric streams. |

Example decisions:

- Use a Bloom filter to skip a disk lookup when a negative answer is common and false positives only waste work.
- Do not use a Bloom filter when a false positive would grant access, charge money, or claim data exists.
- Use HyperLogLog when exact distinct count would require storing too many identifiers.
- Use Count-Min Sketch when overcounting is acceptable but undercounting is not.

## Graph algorithms

Graphs model dependencies, networks, permissions, workflows, ownership, fraud rings, package trees, and infrastructure topology. Production graph work is usually constrained by graph size, update frequency, and whether queries are online or offline.

| Problem | Algorithm or structure | Use case | Caveat |
|---|---|---|---|
| Reachability | BFS or DFS over [Data Structures/Graphs](/compendium/data-structures/graphs) | Can service A reach service B? | Large graphs need pruning and visited sets. |
| Shortest unweighted path | BFS | Fewest hops in dependency or social graph. | Path count can explode in dense graphs. |
| Shortest weighted path | Dijkstra | Routing, cost-based planning. | Requires non-negative weights. |
| Negative weights | Bellman-Ford | Currency arbitrage style reasoning, constraint systems. | More expensive than Dijkstra. |
| All-pairs shortest path | Floyd-Warshall or repeated Dijkstra | Small dense graphs, precomputed routing. | O(n^3) is impractical for large graphs. |
| Minimum spanning tree | Kruskal or Prim | Network design, clustering, cheap connection sets. | Does not solve shortest path between all pairs. |
| Connectivity | [Data Structures/Disjoint Set (Union-Find)](/compendium/data-structures/disjoint-set-union-find) | Dynamic union of components. | Edge deletion is not handled well. |
| Topological order | Kahn algorithm or DFS | Build systems, migrations, workflow scheduling. | Cycles must be reported clearly. |
| Strongly connected components | Tarjan or Kosaraju | Cycle groups, service dependency clusters. | Component graph should be inspected after condensation. |
| Max flow | Edmonds-Karp, Dinic | Allocation, matching, capacity planning. | Modeling source, sink, and capacities matters more than code cleverness. |

Practical graph modeling:

- Define node identity carefully. A service, deployment, pod, endpoint, and tenant are different nodes.
- Define edge meaning. "Calls", "owns", "depends on", "can access", and "contains" should not be mixed without labels.
- Decide whether edges are directed.
- Decide whether edges are weighted and what the weight means.
- Bound traversal depth for online requests unless full traversal is required.
- Record why a path exists, not only that it exists, when the result drives security or operations.

Anti-pattern: running recursive graph traversal inside every request without a maximum depth, cache, or precomputed closure. This often becomes a latency incident when the graph grows or cycles appear.

## Streaming algorithms

Streaming algorithms process data one item at a time with bounded memory. They are used when data is too large, too fast, or too continuous to load fully.

| Goal | Technique | Production example |
|---|---|---|
| Running aggregate | Fold with accumulator | Sum bytes per tenant in a log stream. |
| Sliding window count | Ring buffer, deque, or windowed buckets | Requests per minute for rate limiting. |
| Approximate distinct count | HyperLogLog | Unique devices per day. |
| Heavy hitters | Count-Min Sketch plus heap | Top abusive IPs in a high-volume stream. |
| Approximate quantiles | Quantile sketch | p99 latency without storing every sample. |
| Sampling | Reservoir sampling | Keep representative examples for debugging. |
| Deduplication | Hash set, Bloom filter, or windowed state | Drop duplicate events within 24 hours. |
| Stream join | Windowed state by key | Match payment event and fulfillment event. |

Streaming design questions:

- Is event time or processing time authoritative?
- How late can events arrive?
- What is the window: tumbling, sliding, session, or global?
- Is state bounded by count, time, key cardinality, or disk?
- Are results exact or approximate?
- What happens on replay?
- Are operations idempotent?
- How are checkpoints and offsets committed?

Example: a rate limiter that stores every request timestamp forever has unbounded memory. A fixed-size ring of per-second buckets gives O(1) update and bounded memory for a fixed window, with known resolution loss.

## Algorithmic design patterns

- Divide and conquer.
- Dynamic programming.
- Greedy algorithms.
- Backtracking.
- Graph traversal.
- Shortest path.
- Topological sort.
- Union find for connectivity.
- Approximation and probabilistic algorithms.
- Streaming algorithms with bounded memory.

| Pattern | Useful for | Production caution |
|---|---|---|
| Divide and conquer | Sorting, search, parallel processing. | Recursive overhead and merge memory can dominate. |
| Dynamic programming | Overlapping subproblems and optimal substructure. | Tables can become large. Compress state when possible. |
| Greedy | Local choices that are provably sufficient. | Needs proof or strong domain argument. Greedy scheduling can be unfair. |
| Backtracking | Constraint search. | Explodes exponentially without pruning and limits. |
| Branch and bound | Optimization with pruning. | Worst case can still be exponential. |
| Graph traversal | Reachability and dependency reasoning. | Requires visited sets and cycle handling. |
| Union find | Incremental connectivity. | Does not naturally support edge deletion. |
| Binary search on answer | Monotonic feasibility problems. | Requires a true monotonic predicate. |
| Two pointers | Ordered arrays and window problems. | Input ordering assumptions must be explicit. |
| Sliding window | Bounded recent history. | Late events and out-of-order streams complicate semantics. |
| Memoization | Cache repeated work. | Cache key correctness, memory bounds, and invalidation matter. |

## Interview vs production differences

Interviews often compress the problem until the main algorithmic idea is visible. Production expands the problem until all resource and correctness edges are visible.

| Interview framing | Production framing |
|---|---|
| Input fits in memory. | Input may exceed memory and must be streamed, paginated, indexed, or partitioned. |
| Single process. | Work may span services, queues, databases, caches, and retries. |
| Average case is enough. | Tail latency and worst tenants matter. |
| Simple data types. | Objects have serialization, schema evolution, ownership, and validation cost. |
| One correct answer. | There may be tradeoffs between correctness, freshness, cost, simplicity, and operability. |
| No failures. | Disk, network, dependency, and process failures are part of the algorithm. |
| No concurrency. | Threads, async tasks, transactions, and distributed actors race. |
| Clean input. | Input may be malformed, malicious, duplicated, late, or skewed. |
| Big O dominates. | Constants, locality, allocation, and IO often dominate. |

Interview skill is still useful. It provides vocabulary and baseline reasoning. Production skill adds measurement, workload modeling, safety limits, and maintainable implementation.

## Correctness before cleverness

Algorithmic choices should be justified by workload:

- Access pattern.
- Mutation frequency.
- Cardinality.
- Distribution.
- Latency objective.
- Memory budget.
- Concurrency model.
- Durability requirement.

Avoid optimizing a data structure before naming the invariant it protects.

Correctness questions:

- What must always be true before and after each operation?
- What happens if the process crashes mid-operation?
- What happens if the same message is processed twice?
- What happens if two writers update the same key at once?
- Is stale data acceptable?
- Can the operation be retried safely?
- Is the result exact, approximate, or best effort?
- How is a partial result detected?

## Anti-patterns

| Anti-pattern | Why it fails | Better approach |
|---|---|---|
| N plus 1 queries | Network and database round trips grow with result count. | Batch, prefetch, join, or use a data loader. |
| Full table scan in request path | Latency grows with database size. | Add an index, precompute, paginate, or move to background job. |
| Unbounded in-memory aggregation | Memory grows with input and can crash the process. | Stream, spill to disk, use bounded sketches, or partition. |
| Sorting when selection is enough | O(n log n) work for top k. | Use a heap or selection algorithm. |
| Global lock around hot map | Throughput collapses under concurrency. | Shard, reduce critical section, or use immutable snapshots. |
| Linked list for general collections | Poor cache locality and high allocation overhead. | Use arrays, vectors, deques, or intrusive lists only when justified. |
| Recursive traversal without depth or visited checks | Stack overflow, cycles, and repeated work. | Use iterative traversal, visited set, and explicit limits. |
| Cache without invalidation strategy | Serves stale or inconsistent data. | Define TTL, versioning, dependency invalidation, or write-through semantics. |
| Hashing untrusted input without protection | Collision attacks can degrade performance. | Use hardened hash functions, caps, and request limits. |
| Approximate structure in authorization path | False positives or approximation can violate correctness. | Use exact checks for security and money movement. |

## Measurement and validation

Complexity claims should be verified with representative data.

| Validation method | Finds |
|---|---|
| Unit tests | Invariants, boundary cases, exact behavior. |
| Property tests | Unexpected inputs and invariant violations. |
| Benchmarks | CPU, allocation, throughput, and scaling curves. |
| Load tests | Queueing, contention, remote dependency limits. |
| Profiling | Hot functions, allocation sites, lock waits. |
| Tracing | Network fanout, retries, dependency latency. |
| Production metrics | Tail latency, memory growth, cache hit ratio, compaction, backpressure. |

Useful benchmark inputs:

- Empty, one item, and small collections.
- Median production size.
- Large tenant or largest known partition.
- Skewed keys.
- Duplicate-heavy input.
- Already sorted input.
- Reverse sorted input.
- Random input.
- Malformed or adversarial input.

## Decision records for algorithm choices

For important choices, record:

- Workload assumptions.
- Data size now and expected data size later.
- Chosen structure or algorithm.
- Alternatives considered.
- Complexity in CPU, memory, IO, and network terms.
- Correctness invariant.
- Failure mode.
- Observability signals.
- Reason the decision should be revisited.

Example:

| Field | Example |
|---|---|
| Problem | Track recently seen event IDs for deduplication. |
| Workload | 50,000 events per second, duplicates usually arrive within 10 minutes. |
| Choice | Time-windowed hash sets rotated by minute. |
| Complexity | Expected O(1) lookup and insert, bounded memory by retention window and event rate. |
| Alternative | Bloom filter. |
| Why not alternative | False positives would drop valid events, which is not acceptable. |
| Revisit when | Event rate or retention window increases beyond memory budget. |

## Related notes

- [01 Engineering Fundamentals](/compendium/software-engineering/engineering-fundamentals)
- [04 Databases Storage and Transactions](/compendium/software-engineering/databases-storage-and-transactions)
- [06 Caching Queues and Streaming](/compendium/software-engineering/caching-queues-and-streaming)
- [11 Performance Capacity and Cost](/compendium/software-engineering/performance-capacity-and-cost)
