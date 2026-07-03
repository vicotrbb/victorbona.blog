---
title: "V8 Memory Heap Garbage Collection Shapes and Performance"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/04 V8 Memory Heap Garbage Collection Shapes and Performance.md"
order: 4
---
Purpose: Explain V8 heap behavior, garbage collection, object shapes, arrays, memory diagnostics, and production performance tradeoffs in Node.js.

# V8 Memory Heap Garbage Collection Shapes and Performance

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [01 Node.js Mental Model JavaScript Runtime V8 libuv and OS](/compendium/nodejs-v8-runtime-engineering/node-js-mental-model-javascript-runtime-v8-libuv-and-os), [02 JavaScript Execution Model Call Stack Jobs Microtasks and Event Loop](/compendium/nodejs-v8-runtime-engineering/javascript-execution-model-call-stack-jobs-microtasks-and-event-loop), [03 V8 Engine Internals Parsing Ignition TurboFan JIT and Deoptimization](/compendium/nodejs-v8-runtime-engineering/v8-engine-internals-parsing-ignition-turbofan-jit-and-deoptimization)

## Memory In Node Is Not One Number

`process.memoryUsage()` exposes several categories. Treat them separately.

| Field | Meaning | Common source |
|---|---|---|
| `rss` | Resident set size for the process | V8 heap, native memory, stacks, code, shared libraries, buffers, allocator behavior. |
| `heapTotal` | V8 heap space committed for JS heap | JS objects and V8-managed structures. |
| `heapUsed` | V8 heap currently used | live JS object graph plus not-yet-collected garbage. |
| `external` | Memory tied to JS objects but allocated outside V8 heap | Buffers, native addons, ArrayBuffers. |
| `arrayBuffers` | ArrayBuffer and SharedArrayBuffer memory | Buffers, typed arrays, binary payloads. |

Footgun: a service can have stable `heapUsed` and rising `rss` because the pressure is native memory, Buffers, allocator fragmentation, worker stacks, memory-mapped files, or external libraries.

## V8 Heap Mental Model

V8 allocates JavaScript values on a managed heap and garbage collects unreachable objects. The exact spaces evolve, but the durable model is generational:

| Area | Typical contents | Performance meaning |
|---|---|---|
| Young generation | Recently allocated objects | Collected frequently; cheap if most objects die young. |
| Old generation | Objects that survived long enough | Collected less often; expensive if large and fragmented. |
| Large object space | Large allocations | Can behave differently from ordinary small objects. |
| Code and metadata spaces | compiled code, maps, descriptors, internals | Affected by JIT, modules, and runtime structure. |

V8's Orinoco GC work uses parallel, incremental, and concurrent techniques to reduce pauses, but JavaScript still observes pauses and throughput costs.

## Reachability

Garbage collection is based on reachability, not intent.

```js
const cache = new Map();

export function remember(req, result) {
  cache.set(req.id, { req, result, at: Date.now() });
}
```

If nothing removes entries, the objects remain reachable through `cache`. V8 cannot know that old entries are business-dead.

Common roots:

- global variables
- module-level singletons
- active closures
- timers and intervals
- event listeners
- pending promises
- request context stores
- caches and maps
- native handles with JS wrappers

## Generational Hypothesis

Most programs allocate many short-lived objects. V8 optimizes for this:

1. Allocate new objects cheaply in young generation.
2. Collect young generation often.
3. Promote survivors to old generation.
4. Collect old generation less frequently with more expensive algorithms.

Good workload:

```js
function handle(row) {
  const dto = {
    id: row.id,
    price: Number(row.price),
  };
  return JSON.stringify(dto);
}
```

The temporary object can die quickly after serialization.

Risky workload:

```js
const recent = [];

function handle(row) {
  recent.push({
    row,
    snapshot: Buffer.from(JSON.stringify(row)),
    at: Date.now(),
  });
}
```

If `recent` is unbounded, objects survive, promote, and create old-generation pressure.

## GC Costs

| Cost | Shows up as | Cause |
|---|---|---|
| Allocation throughput | CPU overhead | many temporary objects, boxing, string churn. |
| Minor GC | short pauses or CPU | young generation collection. |
| Major GC | longer pauses, CPU, memory plateau | old generation marking, sweeping, compaction. |
| Promotion | old heap growth | objects survive young collections. |
| Fragmentation | rss stays high | heap or native allocator cannot return memory cleanly. |
| Write barriers | CPU overhead | old-to-young references and GC bookkeeping. |

GC is not just "pause time". It also competes for CPU and memory bandwidth.

## Object Shapes

V8 uses hidden classes, also called maps in many V8 discussions, to represent object shape. Shape includes property names and layout details. Objects with the same properties added in the same order can share a hidden class.

Stable:

```js
function makePoint(x, y) {
  return { x, y, label: null };
}
```

Unstable:

```js
function makePoint(x, y, label) {
  const point = {};
  point.x = x;
  if (label) point.label = label;
  point.y = y;
  return point;
}
```

Why it matters:

- property access can be compiled as shape check plus fixed offset
- inline caches are more effective with stable shapes
- many shapes at one site can become megamorphic
- adding and deleting properties can push objects toward slower storage

See [03 V8 Engine Internals Parsing Ignition TurboFan JIT and Deoptimization](/compendium/nodejs-v8-runtime-engineering/v8-engine-internals-parsing-ignition-turbofan-jit-and-deoptimization) for how shape feedback affects optimization.

## Named Properties And Elements

V8 distinguishes named properties from indexed elements.

| Kind | Example | Internal direction |
|---|---|---|
| Named property | `user.email` | hidden class plus property storage or dictionary-like path. |
| Indexed element | `items[0]` | elements backing store optimized for array-like access. |

Arrays are not just objects with numeric keys from a performance perspective. Dense arrays, sparse arrays, integer arrays, double arrays, and object arrays can take different paths.

Good:

```js
const values = [];
for (let i = 0; i < input.length; i++) {
  values.push(input[i].score);
}
```

Risky:

```js
const values = [];
values[100_000] = 1;
values[0] = "not a number";
delete values[100_000];
```

## Hidden Class Footguns

| Pattern | Problem | Alternative |
|---|---|---|
| Adding fields conditionally | many shapes | initialize all expected fields with `null`, `false`, or default values. |
| Different construction orders | shape divergence | centralize constructors or factory functions. |
| `delete obj.field` on hot objects | can degrade property storage | set to `undefined` or create a new object if semantic deletion is required. |
| Dynamic property bags | dictionary-like behavior | use `Map` for truly dynamic keys. |
| Mixing records and maps | weak optimization and unclear semantics | choose record-like objects for fixed fields, `Map` for arbitrary keys. |
| Proxies on hot objects | blocks ordinary assumptions | keep proxies at boundaries and convert to plain data inside hot paths. |

## Cache Design

Unbounded caches are one of the most common Node memory leaks.

Bad:

```js
const byUser = new Map();

export function getUser(id) {
  if (!byUser.has(id)) {
    byUser.set(id, loadUser(id));
  }
  return byUser.get(id);
}
```

Better:

```js
const byUser = new Map();
const maxEntries = 10_000;

export function rememberUser(id, user) {
  if (byUser.size >= maxEntries) {
    const oldestKey = byUser.keys().next().value;
    byUser.delete(oldestKey);
  }
  byUser.set(id, {
    id: user.id,
    email: user.email,
    plan: user.plan,
  });
}
```

This is a simple FIFO-like sketch, not a universal cache design. Production caches need explicit policy: maximum entries, maximum bytes, TTL, eviction metrics, hit rate, and failure behavior.

## Closures Retain Objects

```js
function register(req, emitter) {
  emitter.on("done", () => {
    console.log(req.headers.authorization);
  });
}
```

The listener retains `req` until removed or until `emitter` is collected. If `emitter` is long-lived, every request can be retained.

Safer:

```js
function register(req, emitter) {
  const requestId = req.id;
  emitter.once("done", () => {
    console.log(requestId);
  });
}
```

Retain only what is needed, remove listeners, and prefer `once` when the event is one-shot.

## Buffers And External Memory

Node `Buffer` instances are backed by memory outside ordinary JS object storage, though they are reachable through JS wrappers.

Risk patterns:

- buffering complete uploads before validation
- holding response bodies in memory for retries
- base64 expansion
- converting Buffer -&gt; string -&gt; Buffer repeatedly
- storing binary payloads in caches
- ignoring stream backpressure
- retaining small slices of large backing buffers

Use streams and explicit byte limits for network-facing data.

```js
let bytes = 0;
const limit = 10 * 1024 * 1024;

for await (const chunk of req) {
  bytes += chunk.length;
  if (bytes > limit) {
    throw new Error("payload too large");
  }
}
```

## Weak References

`WeakMap` is useful when metadata should not keep an object alive.

```js
const meta = new WeakMap();

export function annotate(obj, value) {
  meta.set(obj, value);
}
```

Use weak references for ownership semantics, not as a substitute for cache policy. Weak cleanup timing is intentionally nondeterministic.

## Memory Diagnostics

| Need | Tool |
|---|---|
| Quick process view | `process.memoryUsage()` |
| Heap object retention | heap snapshot |
| Allocation churn | allocation profile |
| GC activity | `--trace-gc` in staging or local repro |
| CPU plus GC | CPU profile and GC logs together |
| Native or external memory | rss, external, arrayBuffers, native profiler, addon review |
| Liveness leak | active resources and heap roots |

Snapshot workflow:

1. Capture baseline after warmup.
2. Apply representative load.
3. Force a quiet period.
4. Capture second snapshot.
5. Compare retained objects, not just allocated objects.
6. Follow retaining paths to roots.

Do not diagnose a leak from one rising graph during warmup. Confirm retention after GC opportunities and quiet periods.

## GC Trace Use

Local or staging:

```sh
node --trace-gc app.js
```

What to look for:

| Signal | Interpretation |
|---|---|
| frequent minor collections | high allocation churn. |
| old-space growth | survivors are accumulating. |
| long major collections | old heap is large, fragmented, or expensive to mark. |
| memory drops after major GC | pressure may be garbage, not leak. |
| memory does not drop | retained graph or native memory. |

Trace output changes across V8 versions. Use it as evidence with the exact Node version.

## Heap Limits

Node inherits V8 heap limit behavior and exposes V8 flags such as `--max-old-space-size`.

Increasing the old-space limit can be valid for large batch jobs, but it is not a leak fix. It can:

- delay OOM
- increase GC pause risk
- increase container memory pressure
- hide unbounded retention
- reduce pod density

Production rule: raise heap limits only with a memory budget and a retention explanation.

## Production Memory Patterns

| Pattern | Healthy version |
|---|---|
| Request state | scoped to request, released after response. |
| Caches | bounded by entries and bytes, with metrics. |
| Streams | respect backpressure and maximum payload sizes. |
| Event listeners | removed or `once` when lifecycle ends. |
| AsyncLocalStorage | store minimal identifiers, not large request objects. |
| Metrics buffers | flush and bound queues. |
| Logs | avoid retaining full payloads and errors indefinitely. |
| Workers | terminate unused workers and budget per-worker heap. |

## Troubleshooting: Heap OOM

1. Record Node version, flags, container memory limit, and traffic shape.
2. Capture `process.memoryUsage()` periodically.
3. Check whether `heapUsed`, `external`, `arrayBuffers`, or only `rss` rises.
4. Take heap snapshots before and after load.
5. Compare retained objects and retaining paths.
6. Inspect caches, listeners, pending promises, queues, and AsyncLocalStorage.
7. Check large Buffers and external memory.
8. Reproduce with lower load but same code path.
9. Fix retention or bound the structure.
10. Adjust heap size only after retention is understood.

## Troubleshooting: GC Latency

| Observation | Likely cause | Fix direction |
|---|---|---|
| many short pauses | allocation churn | reduce temporary objects, batch work, avoid unnecessary parsing/stringifying. |
| occasional long pauses | old generation collection | reduce long-lived graph, bound caches, avoid promotion. |
| GC CPU high | allocation rate too high | streaming, reuse carefully, simpler data path. |
| memory high but GC not reclaiming | retained graph | heap snapshot retaining paths. |
| rss high after heap drops | native memory or allocator behavior | inspect Buffers, addons, workers, fragmentation. |

## Data Shape And Memory

Object layout can affect both speed and memory.

Stable record-like objects:

```js
function makeMetric(name, value, tags) {
  return {
    name,
    value,
    tags,
    timestamp: Date.now(),
  };
}
```

Dynamic bag:

```js
function makeMetric(name, value, tags) {
  const metric = { name, value };
  for (const [key, tagValue] of Object.entries(tags)) {
    metric[key] = tagValue;
  }
  return metric;
}
```

If `tags` are arbitrary, prefer explicit `tags` as a nested object or `Map`, and keep the outer metric shape stable.

## Field Rules

- Memory leaks are reachable object graphs, not objects V8 forgot.
- High allocation can hurt latency even without a leak.
- Buffers and native allocations can dominate rss outside `heapUsed`.
- Stable object shapes help both JIT and memory layout.
- Dense arrays are different from sparse object-like arrays.
- `delete` is a semantic tool, not a hot-path performance tool.
- Weak references do not replace explicit lifecycle management.
- Heap size flags are capacity controls, not correctness fixes.
- Always pair memory graphs with traffic, GC, and deploy timelines.

## Source Anchors Checked

- V8 general docs for heap and garbage collection overview: https://v8.dev/docs
- V8 "Trash talk: the Orinoco garbage collector": https://v8.dev/blog/trash-talk
- V8 "Fast properties in V8": https://v8.dev/blog/fast-properties
- V8 "Pointer Compression in V8": https://v8.dev/blog/pointer-compression
- Node.js v26.3.0 process memory APIs: https://nodejs.org/api/process.html
