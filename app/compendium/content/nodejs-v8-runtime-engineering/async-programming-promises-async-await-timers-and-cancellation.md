---
title: "Async Programming Promises Async Await Timers and Cancellation"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/08 Async Programming Promises Async Await Timers and Cancellation.md"
order: 8
---
Purpose: Build a production mental model for Node.js async control flow: promises, async functions, event loop turns, timers, cancellation, and the failure modes that appear when these pieces are composed under load.

# Async Programming, Promises, Async Await, Timers, and Cancellation

Parent map: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering)

Related notes:

- [09 Streams Buffers Backpressure and Binary Data](/compendium/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data)
- [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes)

## Operating model

Node.js async programming is not "parallel JavaScript." It is a coordination model over:

| Layer | What it owns | Common APIs | Production failure shape |
| --- | --- | --- | --- |
| V8 microtasks | Promise reactions and `queueMicrotask()` callbacks | `await`, `.then()`, `.catch()`, `.finally()` | Starves timers and I/O if recursively filled |
| Node next tick queue | Node-specific callbacks that run before promise microtasks in many boundaries | `process.nextTick()` | Can starve the event loop harder than promises |
| libuv event loop | Timers, poll, check, close callbacks, async I/O readiness | `setTimeout`, `setImmediate`, sockets, fs callbacks | Latency spikes when callbacks do CPU work |
| libuv threadpool | Offloaded blocking-ish native operations | fs, selected crypto, zlib, DNS `getaddrinfo` | Pool saturation makes unrelated operations slow |
| OS and kernel | Readiness, signals, process scheduling, filesystem behavior | epoll, kqueue, IOCP, POSIX signals | Platform-specific edge cases |

The main JavaScript thread advances by running one callback, draining relevant microtasks, then returning to the event loop. Any callback that does CPU work, synchronous I/O, JSON parsing of huge payloads, or recursive microtask scheduling prevents other callbacks from running.

## Promise fundamentals

A promise is a state machine for one eventual result. It is not a task scheduler by itself. The underlying operation starts because some API started it, not because a promise exists.

| State | Meaning | What handlers see |
| --- | --- | --- |
| Pending | No result yet | Nothing runs yet |
| Fulfilled | Completed with a value | `then` and `await` resume with value |
| Rejected | Completed with a reason | `catch` or `try/catch` receives reason |
| Settled | Fulfilled or rejected | `finally` runs either way |

Field rules:

- Every promise chain must have an ownership boundary for errors: `await` inside `try/catch`, return the promise to a caller that awaits it, or deliberately attach `.catch()`.
- A floating promise is a background task. Treat it like a spawned process: track it, cancel it, log failures, and define shutdown behavior.
- `Promise.all()` is fail-fast for the aggregate result, but it does not cancel sibling work. Use `AbortSignal` if sibling work must stop.
- `Promise.allSettled()` is for batch accounting. It is not a substitute for deciding which failures are recoverable.
- `Promise.race()` does not cancel losers. It only picks the first settled result.
- `Promise.any()` ignores rejections until all inputs reject, then throws `AggregateError`.

## Async and await

`async` functions always return promises. `await` unwraps a promise-like value and yields back to the host so other microtasks and event loop work can continue later.

```js
async function loadUserProfile(userId, { signal }) {
  const user = await fetchUser(userId, { signal });
  const settings = await fetchSettings(user.tenantId, { signal });
  return { user, settings };
}
```

Sequential awaits are correct when step 2 depends on step 1. They are accidental latency when the work is independent.

```js
async function slowIndependentWork(id) {
  const profile = await fetchProfile(id);
  const permissions = await fetchPermissions(id);
  return { profile, permissions };
}

async function fasterIndependentWork(id) {
  const [profile, permissions] = await Promise.all([
    fetchProfile(id),
    fetchPermissions(id),
  ]);
  return { profile, permissions };
}
```

Production guidance:

- Put independent I/O in bounded parallel groups, not unbounded `map(async ...)`.
- Keep CPU work out of callbacks and promise reactions. Move heavy computation to [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes) when it cannot be chunked.
- Preserve causality in errors by wrapping with `cause`.
- Do not mix callback and promise completion for the same operation unless the API explicitly supports it.
- Use `finally` for cleanup that must run after success or failure, but do not hide the original failure by throwing a cleanup error without care.

## Microtasks, next ticks, and starvation

Promise reactions are microtasks. `queueMicrotask()` also schedules microtasks. Node's `process.nextTick()` is even more aggressive: it is intended for small compatibility callbacks, not general scheduling.

```js
function badForever() {
  Promise.resolve().then(badForever);
}

function alsoBadForever() {
  process.nextTick(alsoBadForever);
}
```

These loops can prevent timers and I/O from progressing. If you need to yield to the event loop, prefer `setImmediate()` or `timers/promises.scheduler.yield()` where available.

## Timer APIs

Node timers are global, but `node:timers` and `node:timers/promises` make ownership explicit.

| API | Phase or behavior | Best use |
| --- | --- | --- |
| `setTimeout(fn, ms)` | Runs after at least `ms`, subject to event loop load | Delays, deadlines, retries |
| `setInterval(fn, ms)` | Repeats after delay windows | Simple periodic jobs with overlap protection |
| `setImmediate(fn)` | Runs after I/O callbacks in the check phase | Yielding after current poll work |
| `queueMicrotask(fn)` | Runs before returning to event loop | Tiny follow-up work after current stack |
| `timers/promises.setTimeout(ms, value, options)` | Promise delay with optional signal | Awaitable sleeps and deadlines |
| `timers/promises.scheduler.yield()` | Awaitable cooperative yield | Let I/O and timers breathe in long async loops |

Timer precision is not a real-time guarantee. A 50 ms timeout runs no earlier than roughly 50 ms, but it can run much later if the event loop is busy.

```js
import { setTimeout as sleep } from "node:timers/promises";

async function retryWithBackoff(operation, { signal, attempts = 5 }) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation({ signal });
    } catch (error) {
      if (signal.aborted || attempt === attempts) throw error;
      const delay = Math.min(1000, 50 * 2 ** (attempt - 1));
      await sleep(delay, undefined, { signal });
    }
  }
}
```

## Ref and unref

By default, active `Timeout` and `Immediate` objects keep the process alive. `unref()` says "do not keep the event loop alive just for this handle."

```js
const timeout = setTimeout(() => {
  console.error("cleanup did not finish before deadline");
}, 30_000);

timeout.unref();
```

Use `unref()` for watchdogs, telemetry flush deadlines, cache refreshes, and idle cleanup. Do not use it for work that must complete before exit.

## `setInterval` without overlap

Intervals do not understand async callback completion. If the callback takes longer than the interval, calls can overlap.

```js
let running = false;

const timer = setInterval(async () => {
  if (running) return;
  running = true;
  try {
    await refreshCache();
  } finally {
    running = false;
  }
}, 10_000);

timer.unref();
```

For critical jobs, prefer an explicit loop:

```js
import { setTimeout as sleep } from "node:timers/promises";

async function runPeriodicJob({ signal }) {
  while (!signal.aborted) {
    const started = Date.now();
    await refreshCache({ signal });
    const elapsed = Date.now() - started;
    await sleep(Math.max(0, 10_000 - elapsed), undefined, { signal });
  }
}
```

## Cancellation model

`AbortController` and `AbortSignal` are the standard cancellation vocabulary across modern Node APIs. Cancellation is cooperative: calling `abort()` asks participating APIs to stop. It does not magically kill arbitrary JavaScript work already running on the main thread.

| Primitive | Role | Notes |
| --- | --- | --- |
| `new AbortController()` | Owns the cancellation decision | Pass only `signal` to callees |
| `controller.abort(reason)` | Marks signal as aborted and notifies listeners | Prefer meaningful reasons |
| `AbortSignal.timeout(ms)` | Creates a signal that aborts after a delay | Good for local deadlines |
| `AbortSignal.any(signals)` | Creates a signal that aborts when any input aborts | Good for combining caller cancellation and deadline |
| `signal.throwIfAborted()` | Fast fail before doing work | Use at operation boundaries |

```js
async function withTimeout(promiseFactory, ms, parentSignal) {
  const timeoutSignal = AbortSignal.timeout(ms);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, timeoutSignal])
    : timeoutSignal;

  signal.throwIfAborted();
  return promiseFactory({ signal });
}
```

Cancellation contract for your own functions:

- Accept an options object with `{ signal }`.
- Call `signal.throwIfAborted()` before starting expensive work.
- Pass `signal` to child APIs that support it.
- For custom async loops, check `signal.aborted` between awaits and chunks.
- Remove abort listeners or use `{ once: true }` to avoid listener leaks.
- Reject with an abort-shaped error rather than pretending the operation succeeded.

## Deadlines and budgets

Timeouts should be part of a propagated budget, not random constants at every layer.

```js
async function handleRequest(req) {
  const requestDeadline = AbortSignal.timeout(2_000);
  const user = await readUser(req.params.id, { signal: requestDeadline });
  const result = await calculateResponse(user, { signal: requestDeadline });
  return result;
}
```

Better systems pass a single request signal through database calls, HTTP calls, stream pipelines, and child processes. See [09 Streams Buffers Backpressure and Binary Data](/compendium/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data) for stream pipeline cancellation and [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes) for child process cancellation.

## Bounded concurrency

Unbounded concurrency turns one request into a denial of service against the same process.

```js
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, run),
  );

  return results;
}
```

Choose limits from downstream capacity, not CPU count alone:

| Work type | Limit signal |
| --- | --- |
| Database queries | Connection pool size and query cost |
| HTTP API calls | Rate limits, remote latency, retry budget |
| Filesystem reads | libuv threadpool size and disk behavior |
| CPU transforms | Worker count and memory pressure |
| Stream fanout | Backpressure and writable high water marks |

## Error handling

Use structured error boundaries. Do not rely on process-wide handlers for normal control flow.

```js
async function main() {
  const controller = new AbortController();
  installSignalHandlers(controller);

  await startServer({ signal: controller.signal });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

`unhandledRejection` and `uncaughtException` are last-resort observability hooks. They are not recovery mechanisms for corrupted application state.

## Common footguns

| Footgun | Symptom | Safer pattern |
| --- | --- | --- |
| `array.forEach(async item =&gt; ...)` | Caller does not wait | Use `for...of`, `Promise.all`, or bounded concurrency |
| Missing `.catch()` on background promise | Delayed unhandled rejection | Track task and attach error handler |
| `Promise.race([op, timeout])` without cancellation | Timed-out work keeps running | Race plus `AbortController` |
| Long `then` chain with CPU work | Event loop lag | Worker thread or chunked yielding |
| Recursive `process.nextTick()` | Process appears hung | Use `setImmediate` for yielding |
| `setInterval(async () =&gt; ...)` | Overlapping jobs | Guard, queue, or explicit loop |
| Catching and returning defaults everywhere | Silent data corruption | Classify errors and preserve causes |
| New timeout at every layer | Requests exceed real SLO anyway | Propagate one deadline signal |

## Troubleshooting async incidents

| Symptom | First checks | Likely cause |
| --- | --- | --- |
| Timers firing late | Event loop delay, CPU profile, sync APIs | CPU-bound callback or synchronous I/O |
| Process will not exit | Active handles, timers, servers, sockets | Ref'ed timer or open resource |
| Work continues after client disconnect | Signal propagation, stream pipeline, child process options | Missing cancellation |
| Memory grows during batch | In-flight promise count, retained closures | Unbounded concurrency |
| Intermittent `AbortError` | Deadline budget, parent signal, retry logic | Correct cancellation or too-short timeout |
| High p99 latency under fs load | Threadpool saturation, disk metrics | Too many fs operations or crypto jobs |

## Production checklist

- Every request gets a deadline signal.
- Every externally visible async operation accepts `{ signal }`.
- Background tasks are named, tracked, cancellable, and observed.
- Parallelism is bounded at service edges.
- Timers that should not keep the process alive call `unref()`.
- Timer callbacks are idempotent and overlap-safe.
- `Promise.all()` groups are paired with cancellation when partial failure should stop siblings.
- Process-level rejection handlers log and crash or drain intentionally.
- Event loop delay is measured in production.
- Heavy CPU work is moved to worker threads or child processes described in [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes).

## Official docs checked

- Node timers: https://nodejs.org/api/timers.html
- Node globals, `AbortController`, and `AbortSignal`: https://nodejs.org/api/globals.html
- Node events: https://nodejs.org/api/events.html
- Node streams and pipeline cancellation: https://nodejs.org/api/stream.html
- libuv threadpool: https://docs.libuv.org/en/v1.x/threadpool.html
