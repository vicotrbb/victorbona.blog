---
title: "Production Operations Deployment Containers Scaling and Runbooks"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/17 Production Operations Deployment Containers Scaling and Runbooks.md"
order: 17
---
Purpose: Provide an operations field manual for [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering) covering deployments, production Linux hosts, containers, clusters, scaling, readiness, graceful shutdown, incident runbooks, and the security links to [16 Security Permissions Crypto Secrets Sandboxing and Dependency Risk](/compendium/nodejs-v8-runtime-engineering/security-permissions-crypto-secrets-sandboxing-and-dependency-risk) plus ecosystem choices in [18 Node.js Ecosystem Frameworks Tooling and Learning Projects](/compendium/nodejs-v8-runtime-engineering/node-js-ecosystem-frameworks-tooling-and-learning-projects).

# 17 Production Operations Deployment Containers Scaling and Runbooks

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [16 Security Permissions Crypto Secrets Sandboxing and Dependency Risk](/compendium/nodejs-v8-runtime-engineering/security-permissions-crypto-secrets-sandboxing-and-dependency-risk), [17 Production Operations Deployment Containers Scaling and Runbooks](/compendium/nodejs-v8-runtime-engineering/production-operations-deployment-containers-scaling-and-runbooks), [18 Node.js Ecosystem Frameworks Tooling and Learning Projects](/compendium/nodejs-v8-runtime-engineering/node-js-ecosystem-frameworks-tooling-and-learning-projects), [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes), [11 Networking HTTP TLS DNS Sockets Undici and Fetch](/compendium/nodejs-v8-runtime-engineering/networking-http-tls-dns-sockets-undici-and-fetch), [14 Observability Diagnostics Inspector Tracing Profiling and Core Dumps](/compendium/nodejs-v8-runtime-engineering/observability-diagnostics-inspector-tracing-profiling-and-core-dumps), [15 Performance Engineering Benchmarking Flamegraphs GC and Event Loop Latency](/compendium/nodejs-v8-runtime-engineering/performance-engineering-benchmarking-flamegraphs-gc-and-event-loop-latency)

## Operational stance

Production Node.js is a fleet problem, not a `node server.js` problem. The runtime must receive signals, drain connections, respect cgroup memory, expose health, emit structured logs, report version and build identity, survive dependency failures, and be debuggable without turning an incident into a data leak.

The four operating environments are different:

| Environment | Primary goal | What is real | What is misleading |
|---|---|---|---|
| Local learning machine | understand runtime behavior and APIs | debugger, REPL, test runner, small profiles | CPU limits, DNS, TLS roots, cgroups, load balancer behavior |
| Production Linux host | supervised long-running process | systemd, journald, ulimit, coredumps, kernel TCP state | cluster probes, pod eviction, service mesh policy |
| Production container | reproducible runtime artifact | image layers, PID 1 behavior, cgroups, read-only filesystems | full host tools, mutable installs, local shell assumptions |
| Production cluster | rolling change under load | readiness, liveness, service discovery, autoscaling, network policy | simple process-level debugging, fixed local IPs |

## Release selection

The official Node.js release page says production applications should only use Active LTS or Maintenance LTS releases. Current releases are useful for validating upcoming behavior and using new APIs, but production fleets should treat LTS as the default unless the service has a documented exception and an upgrade rollback plan.

| Choice | Use when | Runbook requirement |
|---|---|---|
| Active LTS | default production services | normal patch cadence |
| Maintenance LTS | stable services near upgrade window | scheduled migration before end of support |
| Current | early API adoption or compatibility testing | explicit owner, rollback, and security monitoring |
| EOL | never for production | emergency upgrade plan |

Runtime metadata to expose:

```js
import process from 'node:process';

export function runtimeInfo() {
  return {
    node: process.version,
    v8: process.versions.v8,
    uv: process.versions.uv,
    openssl: process.versions.openssl,
    modules: process.versions.modules,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
  };
}
```

Expose this in an authenticated diagnostics endpoint or startup log, not a public unauthenticated endpoint.

## Build pipeline

A production build should be reproducible from source, lockfile, build image, and environment.

```text
source checkout
  verify package manager version
  frozen install
  lint
  typecheck
  unit tests
  integration tests
  build
  generate SBOM
  build image
  scan image
  smoke test image
  sign or attest artifact
  deploy by immutable digest
```

| Stage | Failure that should stop deploy |
|---|---|
| install | lockfile drift, registry auth failure, install script failure |
| lint and typecheck | generated code drift, unsafe API, module mismatch |
| tests | unit, integration, contract, migration, and smoke failures |
| build | missing assets, incorrect target, native addon compile error |
| SBOM | missing lockfile or unsupported package graph |
| image scan | critical reachable runtime vulnerability |
| smoke test | process cannot boot, health endpoint fails, signal drain fails |
| deploy | readiness never turns true, error budget burn, migration lock |

Example CI commands:

```bash
npm ci
npm run lint
npm run typecheck
node --test --test-randomize
npm run build
npm sbom --sbom-format=cyclonedx --json > sbom.cdx.json
```

## Container image shape

The official Node Docker image project recommends running Node directly in `CMD` rather than using `npm start` so the Node process receives exit signals directly. Use multi-stage builds to keep build tools out of the runtime image.

Example Dockerfile:

```Dockerfile
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
CMD ["node", "dist/server.mjs"]
```

Image checklist:

| Control | Reason |
|---|---|
| immutable tag or digest in deployment | avoids surprise rebuilds under same tag |
| `NODE_ENV=production` | many frameworks enable production behavior |
| direct `node` command | clean signal delivery |
| non-root user | reduces filesystem and host blast radius |
| no package manager needed at runtime | smaller attack surface |
| no source maps publicly served | avoid leaking source unless intentionally private |
| read-only root filesystem | catches accidental writes |
| `/tmp` scratch mount | only intentional writable path |
| CA bundle present | outbound TLS works |
| timezone policy explicit | logs and scheduling are predictable |

## Configuration

Configuration should be explicit, typed, validated once at startup, and visible in redacted diagnostics.

```js
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}

function integer(name, fallback) {
  const raw = process.env[name] ?? String(fallback);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`invalid env ${name}`);
  }
  return value;
}

export const config = Object.freeze({
  nodeEnv: required('NODE_ENV'),
  port: integer('PORT', 3000),
  databaseUrl: required('DATABASE_URL'),
  shutdownMs: integer('SHUTDOWN_MS', 30000),
});
```

Rules:

| Rule | Reason |
|---|---|
| validate before listening | fail fast before receiving traffic |
| redact secrets in config dumps | diagnostics are often shared |
| keep config immutable | prevents runtime drift |
| distinguish missing from empty | empty secrets are usually bugs |
| parse numbers and booleans once | string truthiness causes outages |
| include config version | helps correlate deploys |

## Process lifecycle

Node process shutdown is cooperative. `process.on('exit')` handlers can only do synchronous work because the event loop is already ending. Graceful shutdown belongs in signal handlers such as `SIGTERM`.

Minimal HTTP drain:

```js
import http from 'node:http';
import process from 'node:process';

const server = http.createServer(app);
const sockets = new Set();
let shuttingDown = false;

server.on('connection', (socket) => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
});

server.listen(process.env.PORT ?? 3000);

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: 'info', event: 'shutdown_start', signal }));

  server.close((err) => {
    if (err) {
      console.error(JSON.stringify({ level: 'error', event: 'server_close_error', message: err.message }));
      process.exitCode = 1;
    }
  });

  setTimeout(() => {
    for (const socket of sockets) socket.destroy();
    process.exit();
  }, 30_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

Production additions:

| Concern | Add |
|---|---|
| keep-alive drains | stop accepting, close idle, cap active deadline |
| queue workers | stop polling, finish or requeue active jobs |
| database | stop new transactions, close pool after requests drain |
| telemetry | flush spans and logs with short timeout |
| readiness | mark not ready before closing |
| second signal | force exit |

## Health endpoints

Separate liveness from readiness.

| Endpoint | Meaning | Should check |
|---|---|---|
| `/livez` | process should be restarted if false | event loop wedged, fatal internal state |
| `/readyz` | process can receive traffic | startup complete, dependencies needed for requests available |
| `/healthz` | human summary if used | version, uptime, degraded dependencies |

Example:

```js
import { monitorEventLoopDelay } from 'node:perf_hooks';

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();

let ready = false;

export function markReady() {
  ready = true;
}

export function healthHandler(req, res) {
  if (req.url === '/livez') {
    const p99Ms = loopDelay.percentile(99) / 1e6;
    res.writeHead(p99Ms > 5000 ? 500 : 200);
    res.end('ok');
    return;
  }

  if (req.url === '/readyz') {
    res.writeHead(ready ? 200 : 503);
    res.end(ready ? 'ready' : 'not ready');
    return;
  }

  res.writeHead(404);
  res.end();
}
```

Avoid deep dependency checks in liveness. A database outage should not cause every pod to restart.

## Kubernetes deployment posture

Kubernetes docs describe Pods as the unit that carries containers, and resource requests and limits as how CPU and memory needs are declared. For Node services, requests and limits must be aligned with V8 heap, native memory, buffers, and sidecars.

Example deployment shape:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      terminationGracePeriodSeconds: 45
      containers:
        - name: api
          image: registry.example.com/api@sha256:example
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: NODE_OPTIONS
              value: --max-old-space-size=768
          readinessProbe:
            httpGet:
              path: /readyz
              port: 3000
            periodSeconds: 5
            failureThreshold: 2
          livenessProbe:
            httpGet:
              path: /livez
              port: 3000
            periodSeconds: 10
            failureThreshold: 3
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            capabilities:
              drop: ["ALL"]
```

Memory rule of thumb:

| Component | Counts toward container memory |
|---|---|
| V8 old space | yes |
| young generation | yes |
| Buffers and external memory | yes |
| native addon memory | yes |
| stacks and code pages | yes |
| OpenSSL allocations | yes |
| sidecar memory | separate container, same pod scheduling pressure |

Set `--max-old-space-size` below the container memory limit so there is headroom for external memory and native overhead. If the limit is 1 GiB, a 768 MiB old-space cap may still be too high for buffer-heavy services.

## Scaling

Node's single JavaScript thread makes the scaling axis explicit.

| Bottleneck | First scale action | Later action |
|---|---|---|
| JavaScript CPU | more processes or pods | worker pool for isolated CPU path |
| event loop blocking | remove sync code | isolate heavy route or queue |
| DB latency | connection pool and query tuning | read replicas or cache |
| outbound API | timeout, retry, circuit breaker | queue, bulkhead, provider quota |
| memory | fix retention, cap caches | larger pod only after evidence |
| libuv threadpool | tune `UV_THREADPOOL_SIZE` for crypto/fs/zlib workload | move work to dedicated service |
| network sockets | keep-alive and agent limits | load balancer and kernel tuning |

Use horizontal scaling for independent request concurrency. Use worker threads for CPU-bound JavaScript. Use cluster or multiple processes when process isolation and multi-core use on one host matters. In Kubernetes, prefer multiple pods over in-process cluster unless there is a clear host-level reason.

## Connection pools

| Pool | Common failure | Guardrail |
|---|---|---|
| database | every pod opens max connections and overwhelms DB | calculate max pool per pod times replicas |
| HTTP client | unbounded sockets to upstream | configure agent or Undici dispatcher limits |
| Redis | reconnect storm | jittered backoff and max retry budget |
| worker threads | too many workers for CPU | fixed pool near available cores |
| libuv threadpool | crypto and fs starve each other | measure queueing before raising size |

Pool sizing example:

```text
database max connections: 300
reserved for admin and migrations: 30
available for app: 270
max pods during rollout: 12
safe pool per pod: floor(270 / 12) = 22
chosen pool per pod: 20
```

## Timeouts, retries, and backpressure

Every outbound call should have a timeout. Every retry should have a budget. Every queue should have a max depth or admission policy.

| Layer | Control |
|---|---|
| inbound HTTP | header timeout, request timeout, body size limit |
| route handler | per-request deadline propagated by AbortSignal |
| outbound HTTP | connect and response timeout |
| database | statement timeout and pool acquisition timeout |
| queue | visibility timeout and dead-letter policy |
| retries | exponential backoff with jitter and max attempts |
| circuit breaker | fail fast during dependency outage |

Example fetch with deadline:

```js
export async function fetchJson(url, { timeoutMs = 3000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`upstream ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

## Logging

Cluster logging should survive container crashes and node loss. Kubernetes docs describe cluster-level logging as separate storage and lifecycle independent of nodes, pods, or containers. Node services should write structured logs to stdout and stderr, then let the platform collect them.

Log fields:

| Field | Reason |
|---|---|
| timestamp | ordering across systems |
| level | filtering |
| message or event | human and machine meaning |
| request id | single request correlation |
| trace id | distributed tracing |
| user or tenant id | authorization and impact analysis |
| route or operation | aggregate by behavior |
| duration ms | latency |
| status code | outcome |
| version and pod | deploy correlation |

Avoid:

| Avoid | Why |
|---|---|
| secrets | logs are widely replicated |
| full request bodies | PII and cost |
| unbounded objects | circular refs, huge logs |
| multi-line stack blobs without structure | hard parsing |
| per-request debug logs by default | cost and noise |

## Deployment strategies

| Strategy | Use when | Risk |
|---|---|---|
| rolling update | normal stateless service | slow error detection can affect many users |
| blue-green | fast rollback and immutable environments | double capacity and state compatibility |
| canary | high-risk behavior change | needs metrics and traffic routing |
| feature flag | decouple deploy from release | stale flags become complexity |
| shadow traffic | compare behavior without user impact | privacy and side effects must be controlled |

Pre-deploy checklist:

| Check | Evidence |
|---|---|
| migrations backward compatible | old and new app can run together |
| readiness gate works | new pod does not receive traffic before warmup |
| graceful shutdown works | old pod drains before kill |
| dashboards updated | new version, saturation, errors, latency |
| rollback command known | exact artifact digest or previous release |
| runbook linked | on-call can act without source archaeology |

## Database migrations

Safe migration sequence:

```text
expand schema
deploy code that writes old and new or tolerates both
backfill
switch reads
stop old writes
contract schema
```

Footguns:

| Footgun | Outage pattern |
|---|---|
| app deploy and destructive migration together | old pods crash during rolling update |
| long lock in migration | p99 latency spike and connection pileup |
| migration in every pod startup | race or repeated work |
| no migration timeout | stuck deploy blocks rollout |
| no rollback story | partial schema state traps the service |

## Runbook template

```text
Service:
Owner:
Dashboard:
Logs:
Trace query:
SLO:
Dependencies:
Rollback command:
Feature flags:
Recent deploy command:

Symptoms:
First checks:
Containment:
Diagnosis:
Recovery:
Verification:
Escalation:
Post-incident notes:
```

Every runbook should have commands, not only prose. Every command should state whether it is read-only or mutating.

## Incident runbooks

### High CPU

| Step | Action |
|---|---|
| confirm | CPU saturation, throttling, request rate, version |
| correlate | deploy, traffic mix, dependency outage |
| profile | CPU profile or sampling profiler on one replica |
| contain | scale horizontally if event loop still makes progress |
| mitigate | disable feature flag or roll back |
| verify | p99 latency, event loop delay, CPU per request |

Common causes:

| Cause | Evidence |
|---|---|
| sync JSON or regex path | hot function in profile |
| compression in app | zlib CPU and response route |
| log serialization | logger stack in profile |
| crypto hash burst | libuv and CPU pressure |
| bad retry loop | high outbound attempt count |

### High memory or OOMKilled

| Step | Action |
|---|---|
| confirm | RSS, heapUsed, external, container limit |
| identify | V8 heap versus external memory |
| capture | heap snapshot only if safe for PII |
| contain | rollback or reduce traffic |
| tune | old-space cap only after identifying memory class |
| verify | stable RSS plateau and GC behavior |

Troubleshooting:

| Signal | Interpretation |
|---|---|
| heapUsed climbs with object count | JavaScript retention |
| RSS climbs but heap stable | Buffer, native, OpenSSL, allocator, fragmentation |
| OOM with low average memory | spike, burst, or limit too tight |
| GC pauses rise | allocation churn or heap pressure |
| old-space near cap | increase only if workload legitimately needs it |

### Event loop latency

| Step | Action |
|---|---|
| confirm | `monitorEventLoopDelay` p99, request latency |
| inspect | CPU profile and route correlation |
| search | sync APIs, large JSON, regex, compression |
| contain | shift traffic or disable path |
| fix | move CPU work to worker, stream, or queue |

### Dependency outage

| Step | Action |
|---|---|
| identify | which upstream, error class, timeout class |
| contain | circuit breaker, disable feature, serve cache |
| reduce | lower retry attempts and concurrency |
| communicate | status page or internal incident channel |
| recover | restore normal retry and cache after provider healthy |

### Bad deploy

| Step | Action |
|---|---|
| detect | error rate, latency, readiness failures |
| stop | pause rollout |
| rollback | deploy previous digest |
| verify | compare SLO and logs to baseline |
| preserve | keep failed version logs and image digest |
| follow up | regression test and deploy guard |

## Troubleshooting table

| Symptom | First checks | Likely fix |
|---|---|---|
| pod never ready | config validation, dependency check, startup logs | separate readiness from deep dependency checks |
| pod restarts during deploy | liveness too aggressive, boot slower than probe | add startup probe or adjust thresholds |
| `SIGTERM` loses requests | app exits before drain | implement graceful shutdown and readiness flip |
| image works locally, fails in cluster | user, CA, DNS, env, read-only filesystem | reproduce with same image and env |
| p99 spikes after scale-out | DB pool multiplied by replicas | lower per-pod pool |
| CPU throttled despite low average | limit too low for bursts | adjust CPU requests and limits based on p99 |
| memory OOM before heap cap | external memory or native overhead | lower old-space cap or fix buffers |
| logs missing after crash | local file logs | write to stdout and use cluster logging |
| rollback fails | migration not backward compatible | expand-contract migration discipline |

## Production acceptance checklist

| Area | Required evidence |
|---|---|
| build | frozen install, tests, artifact digest |
| runtime | LTS Node version or documented exception |
| image | non-root, direct Node command, no dev deps |
| config | startup validation and redaction |
| health | separate live and ready endpoints |
| signals | graceful shutdown tested |
| resources | memory and CPU requests and limits based on measurement |
| observability | logs, metrics, traces, version labels |
| security | secrets not in image, egress controlled, dependency scan |
| scaling | pool math accounts for max rollout replicas |
| runbook | high CPU, memory, dependency outage, bad deploy |
