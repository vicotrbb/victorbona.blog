---
title: "JavaScript Execution Model Call Stack Jobs Microtasks and Event Loop"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/02 JavaScript Execution Model Call Stack Jobs Microtasks and Event Loop.md"
order: 2
---
Purpose: Explain how JavaScript execution, call stacks, jobs, microtasks, Node queues, and libuv event loop phases interact in real Node.js programs.

# JavaScript Execution Model Call Stack Jobs Microtasks and Event Loop

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [01 Node.js Mental Model JavaScript Runtime V8 libuv and OS](/compendium/nodejs-v8-runtime-engineering/node-js-mental-model-javascript-runtime-v8-libuv-and-os), [03 V8 Engine Internals Parsing Ignition TurboFan JIT and Deoptimization](/compendium/nodejs-v8-runtime-engineering/v8-engine-internals-parsing-ignition-turbofan-jit-and-deoptimization), [04 V8 Memory Heap Garbage Collection Shapes and Performance](/compendium/nodejs-v8-runtime-engineering/v8-memory-heap-garbage-collection-shapes-and-performance)

## Core Model

JavaScript execution in Node.js alternates between:

1. Running a synchronous JavaScript stack until it returns or throws.
2. Draining high-priority scheduling queues at Node/V8 checkpoints.
3. Entering native event loop phases where ready callbacks are selected.
4. Calling back into JavaScript with one callback.
5. Repeating while the process has live referenced work.

The event loop does not preempt a running JavaScript function. If a function runs for 800 ms, no timer, socket callback, promise continuation, or close callback runs on that isolate during those 800 ms.

## Vocabulary

| Term | Meaning | Owner |
|---|---|---|
| Call stack | Active JS function frames currently executing | V8 |
| Stack frame | One function invocation state | V8 |
| Job or promise reaction | Continuation of promise behavior | ECMAScript/V8 |
| Microtask queue | Queue for promise reactions and `queueMicrotask` callbacks | V8 |
| Next tick queue | Node-specific queue scheduled by `process.nextTick` | Node.js |
| Macrotask | Informal term for timer, I/O, immediate, close, and similar callbacks | Host runtime |
| Event loop phase | libuv/Node scheduling section for a callback class | libuv/Node.js |
| Turn | One pass or checkpoint of host scheduling | Informal, be precise in incident notes |

Prefer exact names in production debugging: `process.nextTick`, V8 microtask, timer callback, poll callback, check callback, close callback.

## Synchronous Execution

```js
function c() {
  throw new Error("boom");
}

function b() {
  c();
}

function a() {
  b();
}

a();
```

During `c`, the call stack is approximately:

| Top first | Frame |
|---|---|
| 1 | `c` |
| 2 | `b` |
| 3 | `a` |
| 4 | module top level |

Nothing else runs until the stack unwinds. This is why an accidental CPU loop blocks all callbacks in the same isolate.

## Promise Creation Is Not Promise Continuation

```js
console.log("A");

const p = new Promise((resolve) => {
  console.log("B");
  resolve();
});

p.then(() => console.log("D"));

console.log("C");
```

Expected ordering:

```text
A
B
C
D
```

The promise executor runs synchronously. The `.then` reaction is queued as a microtask after the current stack completes.

Footgun: wrapping CPU work in `new Promise` does not move it off the thread.

```js
new Promise((resolve) => {
  // This still blocks the JS thread.
  for (let i = 0; i < 2_000_000_000; i++) {}
  resolve();
});
```

Use `worker_threads`, native offload, a separate process, or a different algorithm for CPU work.

## Node Queue Priority

Official Node docs distinguish `process.nextTick` from the V8 microtask queue. In CommonJS examples, Node drains the next tick queue before the microtask queue at each checkpoint. Node docs also note that ES module evaluation changes observable examples because ES modules are already evaluated as part of microtask processing.

CommonJS example:

```js
const { nextTick } = require("node:process");

Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("microtask"));
nextTick(() => console.log("nextTick"));
console.log("sync");
```

Typical CommonJS ordering:

```text
sync
nextTick
promise
microtask
```

ES module example:

```js
import { nextTick } from "node:process";

Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("microtask"));
nextTick(() => console.log("nextTick"));
console.log("sync");
```

Node docs show ES module ordering can put promise and `queueMicrotask` callbacks before `nextTick` because module evaluation is already happening through the microtask queue.

Production rule: when ordering matters, test the exact module system, Node major version, and entry path.

## Queue Selection Table

| API | Queue or phase | Runs before I/O? | Notes |
|---|---|---:|---|
| plain function call | current stack | Yes | Runs now. |
| `process.nextTick(fn)` | Node next tick queue | Usually yes at checkpoints | Can starve I/O if recursive. |
| `Promise.resolve().then(fn)` | V8 microtask queue | Usually before returning to event loop | Portable promise semantics. |
| `queueMicrotask(fn)` | V8 microtask queue | Usually before returning to event loop | Prefer over `nextTick` for portable deferral unless Node-specific priority is needed. |
| `setTimeout(fn, 0)` | timers phase when threshold reached | No exact guarantee | Timer threshold, not deadline. |
| `setImmediate(fn)` | check phase | After poll phase | Often useful after I/O callbacks. |
| I/O callback | poll or pending phase depending on source | No | Selected by event loop readiness/completion. |
| close callback | close callbacks phase | No | Cleanup after handle close. |

## libuv Event Loop Phases In Node

Common Node mental model:

| Phase | Callback class | Production notes |
|---|---|---|
| timers | `setTimeout`, `setInterval` callbacks whose thresholds are reached | Starting with libuv 1.45.0, used by Node.js 20 and later, timers run only after poll rather than both before and after poll. |
| pending callbacks | Some deferred I/O callbacks | Rarely the direct app-level tuning target. |
| idle, prepare | Internal callbacks | Mostly Node internals and native integrations. |
| poll | Retrieve I/O events and execute I/O callbacks | Can block waiting for I/O if no immediate work is ready. |
| check | `setImmediate` callbacks | Runs after poll. Useful for yielding after I/O. |
| close callbacks | close event callbacks | Socket or handle cleanup. |

Microtasks and next ticks are not simply "another libuv phase". Node runs them around callback boundaries and checkpoints.

## Timer Behavior

Timer delay is a minimum threshold, not an exact schedule.

```js
const started = Date.now();

setTimeout(() => {
  console.log(Date.now() - started);
}, 10);

for (let i = 0; i < 2_000_000_000; i++) {}
```

The timer cannot run until the synchronous loop finishes. If the loop takes 700 ms, the timer fires after at least 700 ms.

Timer precision depends on:

- event loop availability
- OS scheduler behavior
- CPU contention
- callback duration
- poll phase behavior
- timer heap and threshold checks
- VM pauses such as GC

## `setTimeout(0)` Versus `setImmediate`

At top level, ordering between `setTimeout(fn, 0)` and `setImmediate(fn)` can be environment-sensitive. Inside an I/O callback, `setImmediate` often runs before a zero-delay timer because it is queued for the check phase after poll.

```js
import { readFile } from "node:fs";

readFile(import.meta.url, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
```

Do not encode business correctness around this ordering unless the surrounding phase is controlled and tested.

## Microtask Starvation

Microtasks run before the runtime returns to ordinary event loop work. Recursive microtasks can starve timers and I/O.

```js
function spin() {
  queueMicrotask(spin);
}

spin();

setTimeout(() => {
  console.log("may never run");
}, 0);
```

`process.nextTick` is even more dangerous for starvation in Node-specific code:

```js
function spin() {
  process.nextTick(spin);
}

spin();
```

Production rule: use microtasks for short consistency boundaries, not unbounded loops, polling systems, retry loops, or high-volume batching.

## Async/Await Desugaring Mental Model

```js
async function load() {
  console.log("A");
  const value = await getValue();
  console.log("B", value);
}
```

Approximate mental model:

1. Run until the first `await`.
2. Convert the awaited value to a promise.
3. Return to caller with a promise from `load`.
4. Resume after `await` in a promise reaction microtask after the awaited promise settles.

This explains why `try/catch` around `await` catches rejection, while `try/catch` around an un-awaited promise does not.

```js
try {
  Promise.reject(new Error("lost"));
} catch {
  // This does not run.
}

try {
  await Promise.reject(new Error("caught"));
} catch (err) {
  console.log(err.message);
}
```

## Backpressure Is Scheduling Plus Capacity

The event loop can schedule callbacks faster than a downstream system can absorb data. Streams, async iterables, queues, and HTTP responses need backpressure.

Bad pattern:

```js
for (const item of hugeList) {
  socket.write(JSON.stringify(item));
}
```

Better pattern:

```js
import { once } from "node:events";

for (const item of hugeList) {
  if (!socket.write(JSON.stringify(item))) {
    await once(socket, "drain");
  }
}
```

The second version lets the producer respect the writable buffer. It does not make the work free; it prevents unbounded memory growth and reduces latency collapse.

## Event Loop Delay Versus Event Loop Utilization

| Metric | Meaning | Useful for |
|---|---|---|
| Event loop delay | How late the loop is in observing scheduled checkpoints | Detecting blocking callbacks, long GC pauses, CPU spikes. |
| Event loop utilization | Fraction of time the loop was active instead of idle | Understanding saturation versus waiting. |
| CPU profile | Where CPU time is spent | Finding hot JS or native frames. |
| Async resource traces | Which async resources exist and trigger callbacks | Request context and leak debugging. |

High delay with high CPU usually points at CPU-bound JS, synchronous native work, expensive serialization, logging, or GC pressure.

High delay with low CPU can indicate external blocking in native code, OS scheduling issues, container throttling, or measurement artifacts.

## Production Patterns

| Need | Pattern | Why |
|---|---|---|
| Run after current stack but before user observes sync completion | `queueMicrotask` | Portable microtask semantics. |
| Preserve legacy Node callback API async behavior | sometimes `process.nextTick` | Use sparingly because priority can starve I/O. |
| Yield after I/O callback | `setImmediate` | Enters check phase after poll. |
| Retry later without tight loop | `setTimeout` with jitter and cap | Gives I/O and other timers room. |
| Break long CPU loop | chunk with `setImmediate` or use worker | Lets loop process I/O between chunks, or removes CPU from main isolate. |
| Protect p99 latency | bound concurrency and measure event loop delay | Prevents queues from becoming hidden memory and latency. |

## Troubleshooting Ordering Bugs

1. Confirm Node version.
2. Confirm CommonJS versus ES module.
3. Reduce to a single file.
4. Log top-level sync, `nextTick`, promise, `queueMicrotask`, timer, immediate, and I/O callback ordering.
5. Add one variable at a time: top-level await, dynamic import, worker, stream, native addon.
6. Do not rely on old diagrams that predate Node.js 20 timer behavior.

Minimal probe:

```js
import { readFile } from "node:fs";
import { nextTick } from "node:process";

console.log("sync");

nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
queueMicrotask(() => console.log("queueMicrotask"));
setTimeout(() => console.log("timeout 0"), 0);
setImmediate(() => console.log("immediate"));

readFile(new URL(import.meta.url), () => {
  console.log("io");
  setTimeout(() => console.log("io timeout 0"), 0);
  setImmediate(() => console.log("io immediate"));
});
```

Run it as the same module type your service uses.

## Troubleshooting Latency

| Observation | Likely cause | Next move |
|---|---|---|
| Timer callbacks are late | Long JS callback, GC, CPU throttle, native blocking | event loop delay, CPU profile, GC trace. |
| I/O callbacks arrive in bursts | Poll completions, pool completions, downstream bursts | per-dependency latency and queue depth. |
| Promise continuations dominate | Too much microtask chaining | reduce chaining, batch with macrotask yielding. |
| Process has low throughput but high CPU | CPU-bound JS or serialization | profile, worker offload, algorithm change. |
| Process has low throughput and low CPU | awaiting external systems, pool saturation, locks | trace async boundaries and dependency timings. |
| Memory climbs during slow consumer | missing backpressure | inspect writable return values and queue sizes. |

## Field Rules

- A callback runs to completion unless it throws or exits the process.
- `await` yields only at await points. It does not interrupt CPU work before the await.
- Promise callbacks are microtasks, not libuv poll callbacks.
- `process.nextTick` is Node-specific and can outrank promise work in CommonJS checkpoints.
- The libuv thread pool is finite shared capacity.
- Timers are thresholds and can be delayed by other work.
- `setImmediate` is tied to the check phase after poll.
- Recursive microtasks and next ticks are production hazards.
- Use measurements, not mental diagrams, when debugging p99 behavior.

## Source Anchors Checked

- Node.js v26.3.0 `process` docs for `queueMicrotask` versus `process.nextTick`: https://nodejs.org/api/process.html
- Node.js v26.3.0 globals docs for `queueMicrotask`: https://nodejs.org/api/globals.html
- Node.js official event loop guide, including Node.js 20 and libuv 1.45.0 timer behavior: https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick
- libuv design overview for loop phases and polling: https://docs.libuv.org/en/v1.x/design.html
