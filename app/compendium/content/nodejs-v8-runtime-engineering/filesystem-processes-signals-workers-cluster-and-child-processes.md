---
title: "Filesystem Processes Signals Workers Cluster and Child Processes"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/10 Filesystem Processes Signals Workers Cluster and Child Processes.md"
order: 10
---
Purpose: Connect Node.js runtime engineering to operating-system boundaries: filesystem APIs, libuv threadpool pressure, processes, signals, worker threads, cluster, and child process supervision.

# Filesystem, Processes, Signals, Workers, Cluster, and Child Processes

Parent map: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering)

Related notes:

- [08 Async Programming Promises Async Await Timers and Cancellation](/compendium/nodejs-v8-runtime-engineering/async-programming-promises-async-await-timers-and-cancellation)
- [09 Streams Buffers Backpressure and Binary Data](/compendium/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data)

## Boundary map

This area is where JavaScript meets the host system. Bugs here tend to be operational: stuck shutdowns, saturated threadpools, partial files, orphaned children, zombie workers, signal handlers that prevent exit, and memory blowups from buffered process output.

| Boundary | Primary APIs | Best for | Main risk |
| --- | --- | --- | --- |
| Filesystem | `node:fs`, `node:fs/promises` | Files, directories, metadata, streams | Threadpool and platform differences |
| Process object | `node:process` | argv, env, signals, exit code, cwd | Global mutable state |
| Signals | `process.on("SIGTERM")` | Graceful shutdown | Handler removes default exit behavior |
| Worker threads | `node:worker_threads` | CPU-bound JS in same process | Shared memory and lifecycle leaks |
| Cluster | `node:cluster` | Multiple Node processes sharing ports | Operational complexity |
| Child processes | `node:child_process` | External commands and process isolation | Shell injection, buffering, orphaning |

## Filesystem API families

| Family | Shape | Use when | Avoid when |
| --- | --- | --- | --- |
| Callback fs | Error-first callbacks | Legacy integration or hot paths avoiding promises | New application code can prefer promises |
| Promise fs | `await fs.promises.*` or `node:fs/promises` | Most application filesystem operations | Very high volume without concurrency control |
| Sync fs | `readFileSync`, `statSync` | Startup config, CLI one-off work | Request path or server event loop |
| Stream fs | `createReadStream`, `createWriteStream` | Large files and incremental I/O | Small metadata operations |
| Watch fs | `fs.watch`, `fs.promises.watch` | Best-effort change notification | Correctness-critical replication |

Most callback and promise filesystem APIs use libuv's threadpool, except watchers. That means a service can accidentally make unrelated filesystem, DNS, crypto, or zlib work slower by flooding the pool.

## libuv threadpool pressure

libuv's threadpool is global to the process and shared. The default size is 4. It can be changed at process startup with `UV_THREADPOOL_SIZE`, up to libuv's documented maximum.

Do not treat the threadpool as an infinite I/O engine.

| Pattern | Failure mode | Safer design |
| --- | --- | --- |
| `Promise.all(files.map(readFile))` over thousands of files | Threadpool queue and memory spike | Bounded concurrency |
| Large `crypto.pbkdf2` batch plus fs traffic | fs latency spike | Isolate CPU crypto or enlarge pool with measurement |
| Recursive directory crawl with unbounded stats | Slow everything | Queue and batch |
| Massive zlib work in request path | Event loop ok, pool saturated | Worker pool or external service |

```js
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

async function mapLimit(items, limit, worker) {
  const results = [];
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function listRegularFiles(dir) {
  const names = await readdir(dir);
  const entries = await mapLimit(names, 16, async (name) => {
    const path = join(dir, name);
    const info = await stat(path);
    return info.isFile() ? path : null;
  });
  return entries.filter(Boolean);
}
```

## Filesystem correctness patterns

### Atomic replace

Write to a temporary file in the same directory, flush when durability matters, then rename.

```js
import { open, rename, rm } from "node:fs/promises";

async function writeFileAtomically(path, data) {
  const temp = `${path}.${process.pid}.tmp`;
  let handle;

  try {
    handle = await open(temp, "w");
    await handle.writeFile(data);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temp, path);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}
```

Atomic rename semantics are filesystem-dependent, but same-directory rename is the normal local-filesystem pattern.

### Stream large files

Use [09 Streams Buffers Backpressure and Binary Data](/compendium/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data) for large file movement. `readFile()` is fine for bounded config or small payloads. It is not fine for untrusted multi-gigabyte uploads.

### Avoid check-then-act races

```js
// Racy: file can change between access and open.
await fs.access(path);
const content = await fs.readFile(path);
```

Prefer performing the operation and handling the error.

```js
try {
  const content = await fs.readFile(path, "utf8");
  return content;
} catch (error) {
  if (error.code === "ENOENT") return null;
  throw error;
}
```

## Process object

`process` is global process state. Read from it freely, mutate it deliberately.

| Property or method | Use | Footgun |
| --- | --- | --- |
| `process.env` | Configuration | Values are strings, global, and inherited by children |
| `process.argv` | CLI args | Shell quoting already happened before Node sees args |
| `process.cwd()` | Relative path base | Can change with `chdir()` |
| `process.exitCode` | Planned exit status | Lets event loop drain |
| `process.exit()` | Immediate exit | Can truncate logs and stdout |
| `process.kill(pid, signal)` | Send signal | Name is misleading: it sends, not always kills |
| `process.resourceUsage()` | Runtime counters | Interpret per platform |

Prefer `process.exitCode = 1` and returning from `main()` over `process.exit(1)` in servers and CLIs that need cleanup.

## Signals and graceful shutdown

Node emits signal events when the process receives POSIX-style signals. Signals are not available inside worker threads. On non-Windows platforms, `SIGINT` and `SIGTERM` have default handlers that exit with `128 + signal number`; installing a listener removes that default exit behavior.

```js
function installSignalHandlers(controller) {
  let shuttingDown = false;

  async function handle(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`received ${signal}, shutting down`);
    controller.abort(new Error(signal));

    const watchdog = setTimeout(() => {
      console.error("forced shutdown after grace period");
      process.exit(1);
    }, 30_000);
    watchdog.unref();
  }

  process.once("SIGINT", handle);
  process.once("SIGTERM", handle);
}
```

Shutdown sequence:

1. Stop accepting new work.
2. Abort request and job signals from [08 Async Programming Promises Async Await Timers and Cancellation](/compendium/nodejs-v8-runtime-engineering/async-programming-promises-async-await-timers-and-cancellation).
3. Let in-flight stream pipelines finish or abort with cleanup.
4. Stop workers and child processes.
5. Close servers, sockets, database pools, and file handles.
6. Set `process.exitCode` and let the process drain.

## Child processes

`node:child_process` starts external programs or new Node processes.

| API | Shell? | Output handling | Use case |
| --- | --- | --- | --- |
| `spawn(command, args, options)` | No by default | Streams | Long-running or large-output commands |
| `exec(command, options, cb)` | Yes | Buffers stdout and stderr | Small shell commands with trusted input |
| `execFile(file, args, options, cb)` | No by default | Buffers stdout and stderr | Small direct executable calls |
| `fork(module, args, options)` | New Node process with IPC | Message channel plus stdio | Node child worker process |
| Sync variants | Depends | Blocks event loop | Startup scripts and one-off CLIs |

Use `spawn()` for production command execution unless you specifically need shell features.

```js
import { spawn } from "node:child_process";

function runCommand(command, args, { signal, cwd, env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      signal,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code, signalCode) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`command failed: ${command}`);
        error.code = code;
        error.signal = signalCode;
        error.stderr = stderr;
        reject(error);
      }
    });
  });
}
```

For large output, do not concatenate strings. Pipe streams as described in [09 Streams Buffers Backpressure and Binary Data](/compendium/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data).

## Shell injection

`exec()` sends a string to a shell. Shell metacharacters are interpreted.

```js
// Dangerous with user input.
exec(`tar -czf ${archive} ${userPath}`);

// Safer direct args.
spawn("tar", ["-czf", archive, userPath]);
```

Rules:

- Prefer `spawn(file, args)` or `execFile(file, args)`.
- Never concatenate untrusted input into shell commands.
- Pass a minimal `env` to children when secrets are not required.
- Set `cwd` explicitly for commands that depend on relative paths.
- Use `signal` or timeout supervision.
- Drain stdout and stderr or inherit them.

## `exec` buffer limits

`exec()` and `execFile()` buffer output. Node's `maxBuffer` option caps stdout and stderr bytes; exceeding it terminates the child and truncates output. This is a byte limit, so multibyte encodings matter.

Use `spawn()` for commands that can produce unbounded output.

## Detached children

Detached children can outlive the parent. This is sometimes useful for supervisors and sometimes an orphan factory.

```js
const child = spawn(process.execPath, ["worker.js"], {
  detached: true,
  stdio: "ignore",
});
child.unref();
```

Only detach when you have an external lifecycle owner, logs, and cleanup.

## Worker threads

Worker threads run JavaScript in parallel within the same process. They are useful for CPU-intensive JavaScript. They usually do not help I/O-intensive work because Node's native async I/O is already efficient.

```js
import { Worker } from "node:worker_threads";

export function runCpuJob(workerData, { signal }) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./cpu-worker.js", import.meta.url), {
      workerData,
    });

    signal?.addEventListener("abort", () => {
      worker.terminate().catch(() => {});
    }, { once: true });

    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`worker stopped with ${code}`));
    });
  });
}
```

Worker selection:

| Use worker threads when | Use child processes when |
| --- | --- |
| CPU-bound JS needs parallelism | You need process isolation |
| Memory sharing helps | Native crash isolation matters |
| Startup cost must be lower | Different executable or permissions are needed |
| You can control module code | You run external commands |

Production worker guidance:

- Use a pool, not one worker per request.
- Bound queue length.
- Propagate cancellation and deadlines.
- Transfer large `ArrayBuffer` objects instead of copying when ownership can move.
- Use `SharedArrayBuffer` only with clear synchronization.
- Monitor worker exits and recreate intentionally.

## Cluster

`node:cluster` creates multiple Node processes that can share server ports. It is stable, but many deployments now prefer an external process manager, container orchestrator, or load balancer.

Use cluster when:

- You need multi-process CPU utilization inside one host-level Node service.
- The operational environment does not already provide process replication.
- You can supervise worker exits and understand sticky-session needs.

Avoid cluster when:

- Containers, systemd, Kubernetes, or a process manager already own replication.
- You need mostly CPU offload inside one process; use worker threads.
- You need strong isolation between tenants; use separate processes or services.

## Supervision matrix

| Workload | Primitive | Reason |
| --- | --- | --- |
| Large file copy | fs streams and `pipeline()` | Backpressure and low memory |
| Many small metadata reads | `fs/promises` with limit | Threadpool protection |
| CPU JSON transform | worker thread pool | Parallel JS without shell |
| ImageMagick command | `spawn()` | External binary and streamed output |
| Shell script with trusted input | `exec()` | Shell features needed |
| Long-lived service replica | orchestrator or cluster | Process-level parallelism |
| Graceful shutdown | process signals plus abort signals | Cooperative drain |

## Troubleshooting

| Symptom | First checks | Likely cause |
| --- | --- | --- |
| `SIGTERM` received but process never exits | Signal handler, open handles, timers | Handler removed default exit and did not drain |
| fs promises slow during crypto work | Threadpool queue, `UV_THREADPOOL_SIZE`, CPU | Shared libuv pool saturation |
| Child command hangs | stdout and stderr consumers | Pipe buffer full |
| CLI truncates output | `exec` `maxBuffer` | Buffered child output exceeded limit |
| Logs missing on failure | `process.exit()` path | Immediate exit before flush |
| Worker memory grows | Pool queue, retained messages, transfer strategy | Unbounded jobs or copies |
| Cluster restarts loop | worker exit code, startup config, port binding | Bad config or crash on boot |
| Partial files after abort | temp file cleanup, atomic write path | Cancellation without cleanup |

## Common footguns

| Footgun | Consequence | Safer pattern |
| --- | --- | --- |
| Sync fs in request path | Event loop stalls | Async fs or stream |
| Unbounded fs `Promise.all` | Threadpool and memory pressure | Bounded concurrency |
| `process.exit()` in library code | Caller cannot clean up | Throw or set exitCode at app edge |
| Signal handler without forced deadline | Infinite shutdown | Watchdog timer with `unref()` |
| `exec()` with user input | Shell injection | `spawn()` with args |
| Ignoring child stderr | Deadlock or lost diagnostics | Drain or inherit stderr |
| One worker per request | Startup and memory pressure | Worker pool |
| Cluster plus orchestrator replication without plan | Double supervision complexity | Pick one owner |
| Retrying child process forever | Resource exhaustion | Backoff and circuit breaker |

## Production checklist

- Filesystem operations in request paths are async, streamed, or bounded.
- Large files are moved with streams and `pipeline()`.
- Atomic writes clean temp files on failure.
- `UV_THREADPOOL_SIZE` changes are measured and set before process start.
- Signal handlers abort work and define a hard grace deadline.
- Application exits through `process.exitCode` unless immediate termination is intentional.
- Child process execution avoids shell strings for untrusted input.
- Child stdout and stderr are drained, inherited, or piped.
- Child output buffering has explicit byte limits when using `exec` or `execFile`.
- Worker threads are pooled, supervised, and cancellable.
- Cluster usage has one clear supervisor and restart policy.
- Shutdown tests cover `SIGINT`, `SIGTERM`, active streams, active children, and active workers.

## Official docs checked

- Node fs: https://nodejs.org/api/fs.html
- Node process and signals: https://nodejs.org/api/process.html
- Node worker threads: https://nodejs.org/api/worker_threads.html
- Node cluster: https://nodejs.org/api/cluster.html
- Node child process: https://nodejs.org/api/child_process.html
- libuv threadpool: https://docs.libuv.org/en/v1.x/threadpool.html
