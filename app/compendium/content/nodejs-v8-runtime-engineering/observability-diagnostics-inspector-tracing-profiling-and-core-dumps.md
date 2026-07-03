---
title: "Observability Diagnostics Inspector Tracing Profiling and Core Dumps"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/14 Observability Diagnostics Inspector Tracing Profiling and Core Dumps.md"
order: 14
---
Purpose: Build a production diagnostic playbook for Node.js services that connects [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [15 Performance Engineering Benchmarking Flamegraphs GC and Event Loop Latency](/compendium/nodejs-v8-runtime-engineering/performance-engineering-benchmarking-flamegraphs-gc-and-event-loop-latency), diagnostics channels, async context, inspector sessions, trace events, diagnostic reports, heap snapshots, CPU profiles, and native core dumps into one evidence-first workflow.

# 14 Observability Diagnostics Inspector Tracing Profiling and Core Dumps

## Operating model

Node.js diagnostics are strongest when each tool is treated as a different camera angle, not as a replacement for the others. Logs tell what application code believed was happening. Metrics tell how often and how severely it happened. Traces tell request causality across async boundaries. Inspector profiles tell where V8 and JavaScript spent CPU or retained heap. Trace events expose runtime timelines for libuv, V8, async hooks, and Node categories. Diagnostic reports snapshot process state. Core dumps preserve native memory after a hard abort.

Use this decision path:

| Symptom | First evidence | Deep evidence | Last resort |
|---|---|---|---|
| Slow endpoint | Request histogram, trace span, event loop delay | CPU profile, trace events | Native profile or core if process wedges |
| Memory growth | RSS, heap used, external memory, allocation rate | Heap snapshot, heap profile, diagnostic report | Core dump with llnode or native debugger |
| Crash | Error log, exit code, diagnostic report | Core dump, native stack, fatal error report | Reproduce under debug build |
| Context loss | Trace parent gaps, missing request ID | AsyncLocalStorage probes, diagnostics_channel spans | Async hooks investigation |
| Event loop stall | perf_hooks histogram, blocked request spans | CPU profile, sync I/O trace, flamegraph | Core if stuck in native code |
| Library black box | diagnostics_channel subscription | OpenTelemetry instrumentation wrapper | Inspector breakpoint in staging |

The field rule: start low overhead and always capture a timestamp, Node version, process ID, container ID, release SHA, command line, and clock source. A profile without the deployment identity is often only trivia.

## Instrumentation layers

| Layer | Node primitive | Production use | Risk |
|---|---|---|---|
| Correlation context | AsyncLocalStorage from `node:async_hooks` | Request IDs, tenant IDs, trace correlation | Leaking context with `enterWith()` or custom async boundaries |
| Library diagnostics | `node:diagnostics_channel` | Publish structured events without hard dependency on telemetry vendors | Synchronous subscriber cost |
| Manual telemetry | OpenTelemetry API | Spans, metrics, logs around business operations | SDK must initialize before instrumented modules |
| Runtime metrics | `node:perf_hooks`, `process.memoryUsage()`, `v8.getHeapStatistics()` | Service SLOs and saturation signals | High cardinality labels and noisy intervals |
| Inspector | `node:inspector` and DevTools protocol | CPU profiles, heap snapshots, protocol automation | Security exposure and runtime overhead |
| Trace events | `node:trace_events` or CLI flags | Runtime timelines visible in Chrome trace viewer | Large files and category noise |
| Reports | `process.report` and report CLI flags | Crash and hang snapshots | Sensitive environment and network metadata unless excluded |
| Core dumps | OS core plus Node flags | Native post-mortem when process aborts | Huge artifacts with secrets and memory contents |

## Diagnostics channel as the library seam

`diagnostics_channel` is the right API when a library wants to publish diagnostic data without depending on OpenTelemetry, a logger, or a metrics backend. Channel names should be stable, documented, and namespaced by package or subsystem. Message shape is part of the library contract.

```js
// payment-diagnostics.mjs
import diagnosticsChannel from 'node:diagnostics_channel';
import { performance } from 'node:perf_hooks';

const paymentAttempt = diagnosticsChannel.channel('acme.payment.attempt');

export async function chargeCard(input, gateway) {
  const start = performance.now();
  const message = {
    gateway: gateway.name,
    currency: input.currency,
    amount_minor: input.amountMinor,
  };

  if (paymentAttempt.hasSubscribers) {
    paymentAttempt.publish({ ...message, phase: 'start', time_ms: start });
  }

  try {
    const result = await gateway.charge(input);
    if (paymentAttempt.hasSubscribers) {
      paymentAttempt.publish({
        ...message,
        phase: 'end',
        status: result.status,
        duration_ms: performance.now() - start,
      });
    }
    return result;
  } catch (error) {
    if (paymentAttempt.hasSubscribers) {
      paymentAttempt.publish({
        ...message,
        phase: 'error',
        error_name: error.name,
        duration_ms: performance.now() - start,
      });
    }
    throw error;
  }
}
```

Subscriber pattern:

```js
// telemetry-bootstrap.mjs
import diagnosticsChannel from 'node:diagnostics_channel';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('payment-diagnostics');

diagnosticsChannel.subscribe('acme.payment.attempt', (message) => {
  if (message.phase !== 'end' && message.phase !== 'error') return;

  const span = tracer.startSpan('payment.gateway.charge', {
    attributes: {
      'payment.gateway': message.gateway,
      'payment.currency': message.currency,
      'payment.amount_minor': message.amount_minor,
      'payment.duration_ms': message.duration_ms,
    },
  });

  if (message.phase === 'error') {
    span.setStatus({ code: SpanStatusCode.ERROR, message: message.error_name });
  }

  span.end();
});
```

Production guidance:

| Practice | Why it matters |
|---|---|
| Create channels once at module top level | Dynamic channel lookup in hot code adds avoidable overhead and weakens naming discipline |
| Check `hasSubscribers` before building expensive messages | It avoids allocation and serialization work when telemetry is disabled |
| Keep messages plain data | Subscribers may run in a different release or process shape than the publisher expects |
| Publish only bounded metadata | Do not put request bodies, tokens, SQL text with literals, or customer secrets into diagnostic messages |
| Document versioned message schemas | Telemetry consumers break when a field silently changes type or unit |

Footguns:

| Footgun | Failure mode | Fix |
|---|---|---|
| Subscriber throws | Publisher path fails because subscribers run synchronously | Wrap subscriber code and treat telemetry errors as telemetry failures |
| Heavy message assembly before `hasSubscribers` | Instrumentation changes latency even when unused | Guard before expensive work |
| Per-request channel names | Cardinality explosion and memory churn | Encode request data in messages, not channel names |
| Mixing units | Profiles show milliseconds while histograms use nanoseconds | Put unit suffixes in field names |

## TracingChannel for operation lifecycles

`diagnostics_channel.tracingChannel(name)` groups lifecycle channels for a single operation. It is useful for bridge instrumentation that wants start, end, async start, async end, and error semantics without hardcoding five independent names.

```js
import diagnosticsChannel from 'node:diagnostics_channel';

const renderTrace = diagnosticsChannel.tracingChannel('acme.template.render');

export function renderTemplate(template, data) {
  return renderTrace.traceSync(() => {
    return template.render(data);
  }, {
    template_name: template.name,
    key_count: Object.keys(data).length,
  });
}
```

Use `TracingChannel` for reusable operation boundaries. Use plain channels for one-way events such as cache invalidation, retry scheduled, connection created, or feature flag evaluated.

## Async context and trace correlation

Modern Node async context tracking should prefer stable `AsyncLocalStorage` for request-scoped values. Low-level `async_hooks.createHook()` remains powerful but has safety and performance risks. Use it for diagnostics experiments and framework internals, not as the default app-level context primitive.

```js
// request-context.mjs
import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';

export const requestContext = new AsyncLocalStorage();

export function withRequestContext(req, res, next) {
  const context = {
    request_id: req.headers['x-request-id'] || crypto.randomUUID(),
    route: req.route?.path || req.url,
    started_at_ms: Date.now(),
  };
  requestContext.run(context, next);
}

export function log(fields) {
  const context = requestContext.getStore();
  console.log(JSON.stringify({ ...context, ...fields }));
}
```

Context troubleshooting:

| Symptom | Likely cause | Probe |
|---|---|---|
| Request ID disappears after queue callback | Custom queue did not preserve async context | Wrap task execution in `AsyncResource` or capture with `AsyncLocalStorage.snapshot()` |
| All requests share one context | `enterWith()` used in a shared event handler | Prefer `run()` around a request boundary |
| Trace parent missing in manual span | SDK initialized too late or active context absent | Log active span before and after the boundary |
| Worker thread has no context | Async IDs and context are per thread | Propagate trace and request fields in worker messages |
| Context survives after request | Long-lived promise or timer retained request store | Cancel timers and avoid storing large objects in the context |

OpenTelemetry context propagation depends on a context manager. In normal Node applications the SDK usually installs one, but custom setups must ensure a context manager is enabled before spans are created. Initialize instrumentation before application modules, commonly with `node --import ./instrumentation.mjs app.js` on supported Node versions.

## OpenTelemetry bridge discipline

For applications, initialize the SDK. For libraries, depend only on the OpenTelemetry API and let the host application choose SDK, exporters, sampling, and resources.

```js
// instrumentation.mjs
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', async () => {
  await sdk.shutdown();
  process.exit(0);
});
```

Operational checklist:

| Check | Expected state |
|---|---|
| Bootstrap order | Instrumentation file loads before app imports HTTP, database, queue, and RPC clients |
| Resource identity | `service.name`, `service.version`, deployment environment, instance ID, and region are set |
| Sampling policy | Head sampling is explicit for high-volume services |
| Propagation | Incoming and outgoing trace headers are tested at service boundaries |
| Shutdown | SDK flushes before process exit during rolling deploys |
| Cardinality | User ID, URL with IDs, SQL literals, and raw error messages are not metric labels |

Footgun: default all-span sampling is useful while learning but expensive at production scale. Set the sampling policy deliberately before a high-traffic rollout.

## Inspector surfaces

The inspector exposes V8 and runtime state through the Chrome DevTools Protocol. It can be used interactively with `--inspect` or programmatically with `node:inspector`.

| Mode | Command or API | Use |
|---|---|---|
| Interactive debug | `node --inspect app.js` | Breakpoints, heap snapshots, live inspection |
| Break on start | `node --inspect-brk app.js` | Startup bugs and module initialization |
| Programmatic CPU profile | `node:inspector/promises` `Profiler.start` and `Profiler.stop` | Short profiles around a controlled workload |
| Programmatic heap snapshot | `HeapProfiler.takeHeapSnapshot` | Capture retainers during staged leak reproduction |
| Production emergency | Bind inspector only to loopback or an isolated debug endpoint | Short diagnostic window with access controls |

Programmatic CPU profile:

```js
import { Session } from 'node:inspector/promises';
import fs from 'node:fs';

export async function captureCpuProfile(path, fn) {
  const session = new Session();
  session.connect();
  try {
    await session.post('Profiler.enable');
    await session.post('Profiler.start');
    const result = await fn();
    const { profile } = await session.post('Profiler.stop');
    fs.writeFileSync(path, JSON.stringify(profile));
    return result;
  } finally {
    session.disconnect();
  }
}
```

Programmatic heap snapshot:

```js
import { Session } from 'node:inspector/promises';
import fs from 'node:fs';

export async function writeInspectorHeapSnapshot(path) {
  const session = new Session();
  const fd = fs.openSync(path, 'w');

  session.connect();
  session.on('HeapProfiler.addHeapSnapshotChunk', (message) => {
    fs.writeSync(fd, message.params.chunk);
  });

  try {
    await session.post('HeapProfiler.takeHeapSnapshot');
  } finally {
    session.disconnect();
    fs.closeSync(fd);
  }
}
```

Security rules:

| Rule | Reason |
|---|---|
| Never expose inspector publicly | Inspector can evaluate code and inspect secrets |
| Avoid long-lived production inspector sessions | Profiles, heap snapshots, and console object retention can change process behavior |
| Capture artifacts to encrypted storage | Profiles and dumps may contain PII, tokens, SQL strings, and environment values |
| Prefer time-boxed debug pods or replicas | Keep normal fleet instances predictable |

## Trace events

Trace events produce Chrome trace compatible timelines. They are valuable when a CPU profile alone cannot answer why work happened in a particular order.

CLI capture:

```bash
node \
  --trace-events-enabled \
  --trace-event-categories node.perf,node.async_hooks,v8 \
  --trace-event-file-pattern 'trace-${pid}-${rotation}.json' \
  server.mjs
```

Programmatic capture:

```js
import { createTracing, getEnabledCategories } from 'node:trace_events';

const tracing = createTracing({
  categories: ['node.perf', 'node.async_hooks', 'v8'],
});

tracing.enable();
console.log(getEnabledCategories());

setTimeout(() => {
  tracing.disable();
}, 30_000);
```

Trace event use cases:

| Use case | Categories | Notes |
|---|---|---|
| Async causality | `node.async_hooks` | High volume in busy services |
| Runtime performance | `node.perf` | Useful with perf_hooks marks and measures |
| V8 behavior | `v8` | Correlate GC and compilation with latency |
| Startup analysis | `node.bootstrap`, `v8` | Compare cold starts across releases |

Troubleshooting:

| Problem | Cause | Fix |
|---|---|---|
| Trace file too large | Too many categories or too long a window | Use a short capture window and narrow categories |
| No useful app labels | Only runtime events were captured | Add perf marks, diagnostics_channel messages, or trace spans around app operations |
| Timeline hard to read | Multiple processes write overlapping files | Include `${pid}` in the file pattern |

## Diagnostic reports

Diagnostic reports are JSON snapshots of process state. They are useful during crashes, fatal errors, hangs, and manual incident capture.

Enable report generation:

```bash
node \
  --report-on-fatalerror \
  --report-uncaught-exception \
  --report-on-signal \
  --report-signal=SIGUSR2 \
  --report-dir=/var/log/node-reports \
  --report-exclude-env \
  --report-exclude-network \
  server.mjs
```

Manual capture:

```js
import fs from 'node:fs';

export function writeIncidentReport(reason) {
  const safeReason = reason.replace(/[^a-z0-9_.-]/gi, '_').slice(0, 80);
  const path = `/var/log/node-reports/report-${process.pid}-${safeReason}.json`;
  process.report.writeReport(path);
  fs.chmodSync(path, 0o600);
  return path;
}
```

Report reading guide:

| Section | What to inspect |
|---|---|
| Header | Node version, command line, platform, report trigger |
| JavaScript stack | The active stack when the report was created |
| Native stack | C++ and runtime frames, useful for native add-ons |
| Heap statistics | Heap limit, used heap, available heap |
| Resource usage | CPU time, RSS, page faults, file descriptors |
| libuv handles | Active timers, TCP handles, async resources |
| Environment variables | Usually exclude in production artifacts |

Reports are not heap snapshots. They summarize memory and handles but do not show object retainer paths. If the problem is a JavaScript leak, move from report to heap snapshot. If the process aborts in native code, move from report to core dump.

## V8 heap snapshots and heap profiles

`v8.writeHeapSnapshot()` writes a heap snapshot for the current isolate. It is synchronous, can block the event loop, and can require memory roughly proportional to the live heap. That makes it dangerous under memory pressure.

```js
import v8 from 'node:v8';
import fs from 'node:fs';

export function captureHeapSnapshot(label) {
  const path = v8.writeHeapSnapshot(`/var/log/node-heap/${label}-${process.pid}.heapsnapshot`);
  fs.chmodSync(path, 0o600);
  return path;
}
```

Production guidance:

| Scenario | Safer approach |
|---|---|
| Suspected slow leak | Capture snapshots on a canary at low traffic before and after growth |
| Near OOM | Prefer diagnostic report and external memory metrics first |
| Worker thread leak | Trigger snapshots per worker, not only from the main thread |
| Sensitive tenant data | Encrypt artifact storage and enforce short retention |
| Huge heap | Use heap sampling or isolate a replica with a smaller workload |

Heap snapshot workflow:

1. Capture a baseline after warmup.
2. Run a known workload.
3. Capture a second snapshot.
4. Compare retained size and object counts by constructor.
5. Inspect dominators and retaining paths.
6. Validate with a fixed build under the same workload.

## Core dumps

Core dumps are for post-mortem debugging when JavaScript level artifacts are insufficient, especially fatal native crashes, aborts, C++ add-ons, corrupted heap, illegal instruction, or a process stuck below JavaScript.

Node flags and OS setup:

```bash
ulimit -c unlimited

node \
  --abort-on-uncaught-exception \
  --report-on-fatalerror \
  --report-dir=/var/log/node-reports \
  server.mjs
```

Container notes:

| Concern | Production answer |
|---|---|
| Core file location | Configure host or container runtime core pattern deliberately |
| File size | Expect large files, often near process virtual memory size |
| Secrets | Treat cores as highly sensitive artifacts |
| Symbols | Preserve Node binary, native add-on builds, source maps, and release metadata |
| Runtime limits | Ensure `ulimit`, security profile, and writable dump path allow capture |

Native post-mortem checklist:

1. Record Node version, exact binary, container image digest, and architecture.
2. Preserve the core, executable, native add-ons, and generated reports together.
3. Inspect native stack with `lldb`, `gdb`, or platform debugger.
4. If using llnode, match the Node and V8 version closely.
5. Correlate crash time with OTel traces, logs, kernel messages, and deployment events.

## Incident recipes

### Recipe: unexplained p99 spike

1. Confirm p99 increase in request histogram.
2. Check event loop delay histogram and event loop utilization from [15 Performance Engineering Benchmarking Flamegraphs GC and Event Loop Latency](/compendium/nodejs-v8-runtime-engineering/performance-engineering-benchmarking-flamegraphs-gc-and-event-loop-latency).
3. Capture a 30 second CPU profile on one hot replica.
4. Capture trace events with `node.perf` and `v8` if CPU profile shows runtime noise.
5. Compare spans for slow and normal requests.
6. Look for sync I/O, JSON serialization, regex backtracking, compression, crypto, large GC pauses, and hot promise churn.

### Recipe: production memory leak

1. Split RSS, heap used, external, and array buffers.
2. If heap grows, capture staged heap snapshots.
3. If external grows, inspect buffers, native add-ons, compression, TLS, image processing, and WASM.
4. Capture diagnostic report when memory crosses threshold.
5. For fatal OOM, enable report-on-fatalerror and consider core dump on a canary only.
6. Validate fix with allocation rate, retained objects, and steady-state RSS after warmup.

### Recipe: trace context breaks at queue boundary

1. Log current trace ID before enqueue.
2. Inject W3C trace context into the message metadata.
3. Extract context in the consumer before creating the consumer span.
4. Use AsyncLocalStorage for process-local request metadata.
5. If using a custom in-process queue, preserve context with AsyncResource or `AsyncLocalStorage.snapshot()`.

### Recipe: process hangs but does not crash

1. Send report signal if enabled.
2. Capture active handles and resource usage from the report.
3. Capture CPU profile if the event loop is still running.
4. Use trace events around suspected categories if reproducible.
5. If frozen below JavaScript, use OS debugger or core capture.

## Production artifact policy

| Artifact | Sensitivity | Retention | Access |
|---|---|---|
| Logs | Medium to high | Short by default, longer for audit streams | Service and incident responders |
| Traces | Medium | Sampling and retention by SLO value | Engineers for owning service |
| CPU profiles | High | Incident window only | Limited responders |
| Heap snapshots | Very high | Short, encrypted | Explicit approval |
| Diagnostic reports | High | Incident window only | Limited responders |
| Core dumps | Critical | Short, encrypted, heavily audited | Small debug group |

Do not ship diagnostic artifacts to general log pipelines unless they have been scrubbed and size bounded. A heap snapshot can contain request bodies, tokens, session cookies, SQL strings, private keys, and user data.

## Cross-links

- Root map: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering)
- Performance playbook: [15 Performance Engineering Benchmarking Flamegraphs GC and Event Loop Latency](/compendium/nodejs-v8-runtime-engineering/performance-engineering-benchmarking-flamegraphs-gc-and-event-loop-latency)
- This note feeds incident evidence into benchmarking, flamegraphs, GC analysis, and event loop latency work.

## Official reference anchors checked

- Node.js diagnostics_channel API: https://nodejs.org/api/diagnostics_channel.html
- Node.js asynchronous context tracking and async_hooks docs: https://nodejs.org/api/async_context.html and https://nodejs.org/api/async_hooks.html
- Node.js perf_hooks API: https://nodejs.org/api/perf_hooks.html
- Node.js inspector API: https://nodejs.org/api/inspector.html
- Node.js trace events API: https://nodejs.org/api/tracing.html
- Node.js diagnostic report API: https://nodejs.org/api/report.html
- Node.js V8 API: https://nodejs.org/api/v8.html
- Node.js CLI diagnostic and profiling flags: https://nodejs.org/api/cli.html
- OpenTelemetry JavaScript instrumentation, context, propagation, resources, and sampling docs: https://opentelemetry.io/docs/languages/js/
