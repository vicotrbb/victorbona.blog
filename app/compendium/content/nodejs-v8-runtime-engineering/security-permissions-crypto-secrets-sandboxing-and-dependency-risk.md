---
title: "Security Permissions Crypto Secrets Sandboxing and Dependency Risk"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/16 Security Permissions Crypto Secrets Sandboxing and Dependency Risk.md"
order: 16
---
Purpose: Build a production security field manual for [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering) that connects Node permissions, process boundaries, cryptography, Web Crypto, secrets, sandboxing, dependency supply chain, and operational incident response.

# 16 Security Permissions Crypto Secrets Sandboxing and Dependency Risk

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [16 Security Permissions Crypto Secrets Sandboxing and Dependency Risk](/compendium/nodejs-v8-runtime-engineering/security-permissions-crypto-secrets-sandboxing-and-dependency-risk), [17 Production Operations Deployment Containers Scaling and Runbooks](/compendium/nodejs-v8-runtime-engineering/production-operations-deployment-containers-scaling-and-runbooks), [18 Node.js Ecosystem Frameworks Tooling and Learning Projects](/compendium/nodejs-v8-runtime-engineering/node-js-ecosystem-frameworks-tooling-and-learning-projects), [07 npm pnpm yarn Packages Lockfiles Supply Chain and Monorepos](/compendium/nodejs-v8-runtime-engineering/npm-pnpm-yarn-packages-lockfiles-supply-chain-and-monorepos), [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes), [11 Networking HTTP TLS DNS Sockets Undici and Fetch](/compendium/nodejs-v8-runtime-engineering/networking-http-tls-dns-sockets-undici-and-fetch), [12 Web Platform APIs in Node.js URL Blob Web Streams AbortController and Test Runner](/compendium/nodejs-v8-runtime-engineering/web-platform-apis-in-node-js-url-blob-web-streams-abortcontroller-and-test-runner)

## Security stance

Node.js security is boundary engineering. A service runs untrusted network input through application code, third-party packages, native libraries, OpenSSL, V8, libuv, filesystem APIs, child processes, environment variables, container images, host kernels, and cluster policy. No single Node flag turns this into a sandbox.

Treat these as distinct controls:

| Control | Protects against | Does not protect against |
|---|---|---|
| Input validation | malformed user data reaching business logic | dependency compromise, stolen secrets, host escape |
| Authn and authz | unauthenticated or overprivileged users | SSRF, deserialization bugs, leaked service credentials |
| Node Permission Model | trusted code accidentally using denied resources | malicious code that can exploit the runtime or same-user OS capabilities |
| `node:crypto` and Web Crypto | confidentiality, integrity, signatures, key derivation | bad key management, weak algorithms, replay, side channels in app logic |
| Secret manager | static secrets in repo or image | runtime exfiltration from a compromised process |
| Container isolation | process, filesystem, capability, cgroup boundaries | kernel bugs, overbroad service accounts, hostPath mounts |
| Kubernetes policy | namespace, network, identity, admission, rollout boundaries | application-level injection, bad npm package scripts |
| Supply-chain policy | known vulnerable or unexpected package graph | zero-day package compromise, maintainer takeover |

Security reviews must name the boundary being defended. "Use permissions" is not a threat model. "This image runs as non-root, cannot write outside `/tmp`, cannot open arbitrary outbound sockets, uses read-only root filesystem, and has no package manager in the runtime layer" is a boundary.

## Current source anchors

| Area | Current anchor |
|---|---|
| Permissions | Node.js v26 API docs for `permissions` and CLI `--permission` grants |
| Crypto | Node.js v26 `node:crypto`, Web Crypto, TLS, and OpenSSL-backed APIs |
| Process behavior | Node.js v26 `process` events, `process.exitCode`, POSIX identity APIs, warnings, reports |
| Tests | Node.js v26 `node:test` for test isolation, coverage, randomization, and global setup |
| Supply chain | npm docs for `npm ci`, `npm audit`, provenance, trusted publishing, scripts, SBOM, and threats |
| Release policy | Node.js official releases page for production LTS guidance |

## Threat model layers

| Layer | Example attack | Primary evidence | Primary defense |
|---|---|---|---|
| HTTP boundary | request smuggling, oversized body, header abuse | access logs, reverse proxy logs, packet capture | proxy limits, strict parsers, timeouts |
| Auth boundary | confused deputy, missing tenant check | audit logs, trace attributes, policy decision logs | centralized authorization, deny by default |
| Serialization boundary | prototype pollution, JSON bombs | payload samples, heap growth, errors | schema validation, payload limits, safe merge |
| Filesystem boundary | path traversal, temp file race | denied paths, fs audit logs, exception traces | canonical paths, `mkdtemp`, permissions |
| Process boundary | command injection, inherited env leak | child argv, shell history, env snapshot | no shell, explicit argv, minimal env |
| Network boundary | SSRF, metadata service access | outbound DNS and connect logs | egress allowlist, metadata firewall, `--allow-net` where useful |
| Package boundary | malicious install script | lockfile diff, registry provenance, lifecycle logs | frozen install, script policy, review |
| Native boundary | compromised addon, ABI mismatch | loaded modules, crash dump, `process.versions` | minimize addons, rebuild in CI, image pinning |
| Cluster boundary | overbroad service account | Kubernetes audit log | RBAC, NetworkPolicy, admission controls |

## Node Permission Model

Node's Permission Model is enabled with `--permission`. In current Node v26 docs it is stable, and the docs describe it as a process-based permission system for restricting access to resources such as filesystem, network, child processes, worker threads, native addons, WASI, FFI, and inspector. The same docs warn that it does not provide a malicious-code sandbox. Use it as defense in depth for trusted application code.

### Permission mental model

| Question | Answer |
|---|---|
| Is it default-on? | No. Start Node with `--permission`. |
| What happens without grants? | Access to restricted resources fails with `ERR_ACCESS_DENIED`. |
| Can it restrict reads separately from writes? | Yes, filesystem read and write grants are separate. |
| Can code check permissions? | Yes, `process.permission.has(scope, reference)` is available when enabled. |
| Can code reduce permissions? | Yes, `process.permission.drop(scope, reference)` can remove future access. |
| Does dropping close existing handles? | No. Already open files, sockets, workers, and child processes remain the app's responsibility. |
| Is it a sandbox for untrusted JS? | No. Treat hostile code as requiring process, user, container, VM, or isolate boundaries outside ordinary app execution. |

### Common grants

| Grant | Use | Production caution |
|---|---|---|
| `--allow-fs-read=/app,/etc/ssl/certs` | app files and CA material | avoid `*` unless the process is already strongly isolated |
| `--allow-fs-write=/tmp,/var/run/app` | temp files, sockets, reports | keep logs on stdout where possible |
| `--allow-net=api.internal:443,redis.internal:6379` | outbound clients | pair with cluster egress policy |
| `--allow-child-process` | migrations or controlled subprocesses | forked Node processes can inherit relevant execution args |
| `--allow-worker` | CPU worker pool | not needed for normal network IO |
| `--allow-addons` | native addons | native code is a high-trust boundary |
| `--allow-wasi` | WASI workloads | WASI preopens can expose files |
| `--allow-ffi` plus `--experimental-ffi` | FFI experiments | active-development surface, avoid in high-trust services |
| `--allow-inspector` | debugger and inspector sessions | do not expose inspector in production networks |

Example startup:

```bash
node \
  --permission \
  --allow-fs-read=/app,/etc/ssl/certs \
  --allow-fs-write=/tmp \
  --allow-net=api.internal:443,redis.internal:6379 \
  ./dist/server.mjs
```

Runtime check:

```js
import process from 'node:process';

export function assertStartupPermissions() {
  const required = [
    ['fs.read', '/app'],
    ['fs.write', '/tmp'],
    ['net', 'api.internal:443'],
  ];

  for (const [scope, reference] of required) {
    if (!process.permission?.has(scope, reference)) {
      throw new Error(`missing permission ${scope} ${reference}`);
    }
  }
}
```

Reducing access after startup:

```js
import process from 'node:process';
import { readFile } from 'node:fs/promises';

const privateKey = await readFile('/run/secrets/jwt-key.pem', 'utf8');

process.permission?.drop('fs.read', '/run/secrets/jwt-key.pem');

export { privateKey };
```

This reduces future reads. It does not erase the key from memory. Store key material in `KeyObject` where possible, avoid logging it, rotate it, and design compromise response.

### Permission footguns

| Footgun | Why it hurts | Safer posture |
|---|---|---|
| `--allow-fs-read=*` in production | turns filesystem read control into documentation | grant explicit paths |
| `--allow-net=*` in services that parse URLs | SSRF blast radius stays broad | grant exact upstream hosts and ports |
| treating `--permission` as a sandbox | hostile code can use same-user or runtime escape paths | isolate with OS users, containers, VM, or separate service |
| starting with `npm start` in container | npm may affect signal handling and adds another executable surface | `CMD ["node", "dist/server.mjs"]` |
| granting child processes for one script | every command injection bug becomes more powerful | avoid shell, use explicit argv, isolate scripts |
| granting worker threads casually | workers share process trust and may share memory | use for CPU work only, not untrusted code |
| relying on `drop()` for revocation | open handles remain usable | close handles before dropping |
| using environment variables as sole secret control | any compromised process can read its own env | use workload identity and short-lived secret fetch where possible |

## Sandboxing untrusted code

Untrusted code should not run in the same Node process as production secrets. `vm`, dynamic `import()`, workers, ESM loaders, and permission flags are not enough by themselves for hostile code.

| Requirement | Minimum viable boundary |
|---|---|
| run student code on a laptop | disposable local container with no host mounts except scratch |
| run customer plugins in SaaS | separate process under separate OS user, no secrets, egress denied by default |
| run arbitrary code at scale | sandbox service using gVisor, Firecracker, Kata, or equivalent VM-grade isolation |
| run WASM extensions | capability-based WASI preopens, no inherited secrets, CPU and memory quotas |
| run build scripts | ephemeral CI worker, network policy, read-only source checkout after install |

Bad pattern:

```js
import vm from 'node:vm';

vm.runInNewContext(userCode, { console });
```

Better architecture:

```text
API service
  validates request
  writes job to queue
  sends no production secret

Sandbox worker
  runs as different OS user
  read-only image
  no service account token
  no default egress
  CPU, memory, pid, and wall-clock limits
  writes result to bounded scratch path
```

Sandbox checklist:

| Control | Local learning machine | Production Linux host | Production container | Production cluster |
|---|---|---|---|---|
| identity | local user | dedicated Unix user per trust class | non-root UID | distinct service account |
| filesystem | temp directory | chroot or dedicated workdir | read-only root, scratch volume | no hostPath, limited emptyDir |
| network | disabled or loopback | firewall or netns | no default outbound | NetworkPolicy and egress proxy |
| process | manual cleanup | cgroup or systemd limits | pid limit | pod security and runtime class |
| secrets | none | no inherited env | no mounted secrets | projected token disabled where not needed |
| cleanup | delete temp dir | systemd cleanup | container exit removes state | TTL jobs and volume cleanup |

## Filesystem security

Filesystem bugs in Node services usually come from path joins, temp file handling, upload extraction, and permission confusion.

### Path traversal guard

```js
import path from 'node:path';

const root = '/srv/app/uploads';

export function resolveUploadPath(userPath) {
  const resolved = path.resolve(root, userPath);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error('path escapes upload root');
  }

  return resolved;
}
```

Rules:

| Rule | Reason |
|---|---|
| resolve against an absolute root | avoids current-working-directory surprises |
| compare canonical prefixes carefully | `/srv/app/uploads2` must not match `/srv/app/uploads` |
| never trust uploaded archive paths | zip slip is a path traversal variant |
| create temp directories with secure APIs | avoid predictable names and symlink races |
| handle `ENOENT`, `EACCES`, and `EPERM` at use time | pre-checks can race before use |

## Process and shell security

Avoid shell execution for user-controlled values.

Bad:

```js
import { exec } from 'node:child_process';

exec(`convert ${userFile} out.png`);
```

Better:

```js
import { spawn } from 'node:child_process';

const child = spawn('convert', [safeInputPath, 'out.png'], {
  shell: false,
  env: {
    PATH: '/usr/bin:/bin',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
```

Hardening:

| Control | Implementation |
|---|---|
| no shell | `spawn(command, args, { shell: false })` |
| fixed executable | absolute path or controlled `PATH` |
| bounded output | stream and cap stdout and stderr |
| timeout | kill child after deadline |
| no inherited secrets | pass minimal `env` |
| no broad permissions | avoid `--allow-child-process` unless required |

## Crypto mental model

Use `node:crypto` for Node-native OpenSSL-backed cryptography and `crypto.webcrypto.subtle` for Web Crypto compatibility. Prefer boring, reviewed constructions over hand-rolled protocols.

| Need | Prefer | Avoid |
|---|---|---|
| random identifiers | `randomUUID()` or `randomBytes()` | `Math.random()` |
| password hashing | Argon2id via vetted package or `scrypt` when available | raw SHA-256, fast HMAC, unsalted hashes |
| API token hashing | HMAC or keyed hash plus constant-time compare | plaintext tokens in database |
| symmetric encryption | AEAD such as AES-GCM or ChaCha20-Poly1305 where supported | CBC without authentication |
| signatures | Ed25519, ECDSA P-256, RSA-PSS where policy allows | RSA PKCS#1 v1.5 for new designs |
| key exchange | TLS or vetted protocol library | custom Diffie-Hellman protocol |
| secret comparison | `timingSafeEqual` with same-length buffers | `===` on secrets |

### Password hashing example

```js
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, {
    N: 1 << 15,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt$32768$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, encoded) {
  const [scheme, n, r, p, saltB64, keyB64] = encoded.split('$');
  if (scheme !== 'scrypt') return false;

  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scryptAsync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
```

Production notes:

| Concern | Guidance |
|---|---|
| work factor | benchmark on production-like hardware and keep login p99 acceptable |
| denial of service | rate limit login attempts and cap concurrent hashing |
| migration | store algorithm and parameters with the hash |
| rotation | rehash on successful login when policy changes |
| memory | scrypt and Argon2 consume memory by design |

### AEAD encryption example

```js
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const algorithm = 'aes-256-gcm';

export function encryptJson(key, value, aad) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));

  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptJson(key, envelope, aad) {
  const decipher = createDecipheriv(algorithm, key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString('utf8'));
}
```

Footguns:

| Footgun | Consequence |
|---|---|
| IV reuse with same key in GCM | catastrophic confidentiality and integrity failure |
| encryption without authentication | attackers can tamper with ciphertext |
| decrypting before authenticating | oracle-style bugs and confusing errors |
| storing keys beside ciphertext | compromise gets both lock and key |
| logging decrypted payloads | secrets bypass encryption entirely |
| swallowing auth tag failures | corruption or attack is treated as normal data |

## Web Crypto in Node

Web Crypto is useful when code must share cryptographic primitives with browser or edge runtimes. It is promise-based and uses `CryptoKey` objects rather than Node `KeyObject` APIs.

| Use Web Crypto when | Use `node:crypto` when |
|---|---|
| sharing code with browsers | integrating with OpenSSL-backed Node APIs |
| implementing standards that specify Web Crypto | streaming hashes or ciphers are needed |
| using `SubtleCrypto` key import and export formats | using Node certificates, TLS, or legacy APIs |
| running in browser-shaped runtimes | performance and operational compatibility are Node-only |

Example HMAC:

```js
const enc = new TextEncoder();

export async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Buffer.from(signature).toString('base64url');
}
```

## TLS and certificates

Node TLS is built on OpenSSL. Application code should usually let a reverse proxy or service mesh terminate public TLS, but services still need correct outbound TLS.

| Scenario | Guidance |
|---|---|
| public HTTP API | terminate TLS at ingress or load balancer, preserve client identity headers carefully |
| service-to-service | use mTLS through mesh or explicit TLS with pinned CA where required |
| outbound vendor API | rely on OS or image CA bundle, monitor expiry errors |
| private CA | mount CA bundle read-only and grant read permission if using Permission Model |
| local development | use local CA tooling, do not disable verification in shared code |

Do not ship `NODE_TLS_REJECT_UNAUTHORIZED=0`. It converts certificate failure into silent trust.

## Secrets

Secrets are runtime capabilities. They should not exist in source control, package artifacts, images, logs, stack traces, telemetry attributes, heap snapshots, or diagnostic reports unless explicitly redacted.

| Secret type | Preferred delivery | Rotation posture |
|---|---|---|
| database password | secret manager or workload identity | rotate with connection drain |
| JWT signing key | KMS or mounted secret file | key id and overlapping verification window |
| npm publish credential | trusted publishing OIDC | avoid long-lived token |
| third-party API token | secret manager env or file | short TTL if provider supports it |
| TLS private key | certificate manager or ingress secret | automated renewal |
| encryption key | KMS envelope encryption | rotate data key plan |

Environment variables are convenient but leaky:

| Leak path | Mitigation |
|---|---|
| crash reports | redact reports, restrict report generation |
| process listings | avoid passing secrets as argv |
| logs | central redaction and structured logging discipline |
| child processes | pass minimal `env` |
| support bundles | scrub before upload |
| test snapshots | block secret-shaped fixtures |

## Dependency risk

npm packages are code execution surfaces. Installing, building, importing, and running can all execute third-party code.

| Stage | Risk | Control |
|---|---|---|
| dependency selection | typosquatting, dependency confusion, abandoned package | package review, internal registry scopes |
| install | lifecycle scripts execute | disable scripts where possible, isolate CI |
| lock update | compromised transitive version | small PRs, lockfile diff review, audit |
| build | native addon compile or postinstall fetch | no network during build after fetch phase |
| runtime import | malicious behavior in app process | least privilege, permissions, egress policy |
| publish | stolen npm token | trusted publishing and provenance |

### Frozen install

```bash
npm ci
npm audit --audit-level=high
npm sbom --sbom-format=cyclonedx --json > sbom.cdx.json
```

For production images:

```bash
npm ci
npm run build
npm prune --omit=dev
```

or use a multi-stage build where the final image receives only built artifacts, production dependencies, `package.json`, lockfile, and required assets.

### Lockfile review

| Diff signal | Review question |
|---|---|
| new package with similar name | typo or dependency confusion? |
| new install script | why does install need code execution? |
| tarball URL changed | registry or source changed? |
| many transitive bumps | did a broad range update hide risk? |
| native addon added | are build tools and ABI stable? |
| license changed | legal or distribution impact? |
| maintainer or repository changed | takeover or ownership transition? |

### Trusted publishing and provenance

For packages you publish, prefer npm trusted publishing from supported CI providers. Current npm docs describe trusted publishing as OIDC-based and note that it avoids long-lived npm tokens. npm provenance lets consumers see where and how a package was built.

Operational rules:

| Rule | Reason |
|---|---|
| prefer trusted publisher over npm token | reduces secret lifetime and storage |
| protect release workflow path | OIDC trust only helps if workflow changes are reviewed |
| require branch protection | prevents unreviewed release code |
| pin release action versions | reduces workflow dependency drift |
| publish from clean CI | avoids developer machine state |
| verify package contents before publish | `npm pack --dry-run` catches accidental files |

## Application security patterns

### Input validation

Validate at the boundary and preserve typed data internally.

```js
const userIdPattern = /^[a-zA-Z0-9_-]{3,64}$/;

export function parseUserId(value) {
  if (typeof value !== 'string' || !userIdPattern.test(value)) {
    throw Object.assign(new Error('invalid user id'), { statusCode: 400 });
  }
  return value;
}
```

Boundary checklist:

| Input | Checks |
|---|---|
| JSON body | max size, content type, schema, unknown fields |
| query string | arrays, repeated keys, type coercion |
| headers | size, canonical casing, trust proxy rules |
| upload | file size, type sniffing, storage path, antivirus where required |
| URL | protocol allowlist, host allowlist, DNS rebinding risk |
| webhook | raw body signature, timestamp skew, replay cache |

### SSRF controls

```js
const allowedHosts = new Set(['api.stripe.com', 'api.github.com']);

export function parseOutboundUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('https required');
  if (!allowedHosts.has(url.hostname)) throw new Error('host denied');
  if (url.username || url.password) throw new Error('embedded credentials denied');
  return url;
}
```

Production SSRF defense is layered:

| Layer | Control |
|---|---|
| app | parse URL once and allowlist hostname |
| DNS | block metadata and private ranges where possible |
| network | egress proxy or NetworkPolicy |
| runtime | `--allow-net` exact host grants where practical |
| cloud | disable metadata v1, require hop limit and tokens |

## Security testing

Use the built-in test runner for security invariants when it is enough. Current Node docs include `node --test`, process-level test isolation by default, coverage, global setup, watch mode, and randomization. Randomized test order is useful for detecting state leakage.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUploadPath } from '../src/path-policy.mjs';

test('upload paths cannot escape root', () => {
  assert.throws(() => resolveUploadPath('../secrets.env'), /escapes/);
});

test('absolute paths cannot escape root', () => {
  assert.throws(() => resolveUploadPath('/etc/passwd'), /escapes/);
});
```

CI examples:

```bash
node --test --test-randomize
node --test --experimental-test-coverage
npm audit --audit-level=high
npm sbom --sbom-format=cyclonedx --json > sbom.cdx.json
```

## Incident response

### Suspected leaked secret

| Step | Action |
|---|---|
| contain | revoke or rotate credential immediately |
| scope | search logs, traces, crash reports, support bundles |
| preserve | save relevant audit logs and deployment versions |
| eradicate | remove source of leak and add regression test |
| recover | redeploy, verify new credential use, monitor failures |
| learn | document trigger, detection gap, and rotation time |

### Suspected dependency compromise

| Step | Action |
|---|---|
| freeze | stop automated dependency updates and publishes |
| identify | compare lockfile, installed tree, and package tarball |
| isolate | rebuild in clean CI without caches |
| inspect | review install scripts and package contents |
| rotate | rotate secrets exposed to affected build or runtime |
| replace | pin safe version, fork, or remove package |
| report | follow vendor and registry security process |

### Unexpected `ERR_ACCESS_DENIED`

| Symptom | Likely cause | Fix |
|---|---|---|
| app cannot read its entrypoint | missing `--allow-fs-read` for app path | grant `/app` or exact dist path |
| TLS calls fail reading CA | CA bundle path denied | grant CA bundle read path |
| image works locally but not in cluster | different working directory or mounted path | log `process.cwd()` and resolve absolute grants |
| tests fail under permissions | child test processes need inherited grants | run exact test command under intended flags |
| worker creation fails | missing `--allow-worker` | grant only if workers are required |
| network fails by host | grant mismatch on host or port | normalize target host and port |

## Production checklist

| Area | Minimum production posture |
|---|---|
| runtime version | Active LTS or Maintenance LTS for production unless knowingly running Current |
| app user | non-root, dedicated identity |
| filesystem | read-only root where possible, explicit writable dirs |
| network | inbound through proxy, outbound allowlist |
| secrets | no secrets in image, repo, logs, or argv |
| crypto | no custom algorithms, authenticated encryption, strong randomness |
| dependencies | frozen install, lockfile review, audit, SBOM |
| install scripts | minimized and isolated |
| permissions | `--permission` for defense in depth where compatible |
| diagnostics | redaction for reports, profiles, logs, and traces |
| incident response | rotation runbook and dependency rollback runbook |

## Troubleshooting table

| Symptom | First checks | Common fix |
|---|---|---|
| `ERR_OSSL_EVP_UNSUPPORTED` | algorithm, OpenSSL version, Node version | migrate weak algorithm or configure provider policy only with security review |
| JWT verification flaps | clock skew, key id, rotated key cache | overlap keys and respect `kid` |
| password login p99 spike | scrypt cost, CPU throttling, concurrency | tune work factor and rate limit |
| heap snapshot contains secrets | secret stored as string, report workflow broad | use key handles where possible and restrict diagnostics |
| npm audit flood | severity, reachability, dev versus prod path | triage known reachable risks first |
| install script phones home | package postinstall | block, replace, or isolate package |
| production cannot write temp files | read-only root or denied permission | write only to mounted scratch path |
| webhook signature invalid | raw body parsing changed | verify against raw bytes before JSON parsing |
