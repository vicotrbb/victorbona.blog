---
title: "Native Addons N-API WASM FFI and Embedding"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/13 Native Addons N-API WASM FFI and Embedding.md"
order: 13
---
Purpose: Field manual for crossing Node.js runtime boundaries with native addons, Node-API, WebAssembly, WASI, experimental FFI, and embedding, grounded in [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering) and connected back to [11 Networking HTTP TLS DNS Sockets Undici and Fetch](/compendium/nodejs-v8-runtime-engineering/networking-http-tls-dns-sockets-undici-and-fetch) plus [12 Web Platform APIs in Node.js URL Blob Web Streams AbortController and Test Runner](/compendium/nodejs-v8-runtime-engineering/web-platform-apis-in-node-js-url-blob-web-streams-abortcontroller-and-test-runner).

# Native Addons N-API WASM FFI and Embedding

Native boundaries are where Node.js stops being "just JavaScript" and becomes a host for C, C++, Rust, Zig, system libraries, WebAssembly modules, and embedded runtimes. These boundaries can unlock performance, legacy integration, hardware access, and portability, but they also bypass much of the safety that makes ordinary Node services operable.

Default decision rule: stay in JavaScript until measurement or integration constraints prove otherwise. When you cross the boundary, design the boundary as a product API with ABI policy, memory ownership, thread rules, error mapping, packaging, observability, and security review.

## Boundary selection

| Need | Prefer | Why | Watch |
|---|---|---|---|
| Stable native addon across Node versions | Node-API | ABI-stable C API independent of V8 details. | Async work, references, and finalizers still need discipline. |
| Ergonomic C++ addon over Node-API | `node-addon-api` | Header-only C++ wrapper around Node-API. | C++ exceptions and wrapper overhead policy. |
| Maximum V8 control | V8 and classic C++ addon APIs | Direct engine integration and advanced object behavior. | ABI churn, isolate/context correctness, worker compatibility. |
| Portable sandboxed compute | WebAssembly | Safe module boundary and multi-language compilation target. | Host calls, memory copies, startup, WASI limitations. |
| POSIX-like WASM program | WASI | Filesystem/env/args/preopen model for WASM apps. | Experimental surface and capability design. |
| Call an existing shared library quickly | `node:ffi` | No compilation step for wrapper addon. | Experimental, unsafe, flag-gated, pointer correctness. |
| Embed Node in another C++ host | C++ embedder API | Put Node event loop and JS runtime inside a larger app. | Lifecycle, libuv loop ownership, platform initialization. |

## Native boundary design checklist

| Area | Questions |
|---|---|
| ABI | Which Node versions and platforms are supported? Is the boundary Node-API or V8-specific? |
| Memory | Who allocates, who frees, and when can JavaScript GC move or release references? |
| Threads | Which thread may call into JS? How do background threads communicate with the main event loop? |
| Errors | How are native status codes mapped to JS exceptions or Result-like objects? |
| Async | Is work executed off the event loop? Is cancellation supported? |
| Packaging | Are binaries prebuilt, compiled at install time, or loaded from system libraries? |
| Security | Can malformed input crash the process or corrupt memory? Is fuzzing required? |
| Observability | Can errors and latency be attributed to native calls? |
| Tests | Are ABI, platform, concurrency, and teardown paths covered? |

## Node-API

Node-API, formerly N-API, is the preferred native addon interface for long-lived packages because it is maintained by Node.js and designed to be ABI-stable across Node versions. It abstracts JavaScript values behind opaque handles and returns status codes for calls.

Core concepts:

| Concept | Meaning |
|---|---|
| `napi_env` | Environment for a Node instance and context. Do not treat it as globally portable. |
| `napi_value` | Opaque handle to a JavaScript value. |
| `napi_status` | Return code from Node-API calls. Always check it. |
| Handle scope | Lifetime boundary for temporary JS handles. |
| Reference | Persistent link to a JS value across calls. Must be released. |
| Finalizer | Native cleanup hook associated with JS object lifetime. |
| Async work | Libuv-backed async operation exposed through Node-API. |
| Thread-safe function | Safe path for native threads to call JS on the correct thread. |

Minimal C addon shape:

```c
#include <node_api.h>

static napi_value Add(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, NULL, NULL);

  double a;
  double b;
  napi_get_value_double(env, args[0], &a);
  napi_get_value_double(env, args[1], &b);

  napi_value result;
  napi_create_double(env, a + b, &result);
  return result;
}

NAPI_MODULE_INIT() {
  napi_value fn;
  napi_create_function(env, "add", NAPI_AUTO_LENGTH, Add, NULL, &fn);
  napi_set_named_property(env, exports, "add", fn);
  return exports;
}
```

The example is intentionally small. Production code must check every `napi_status`, validate argument count and types, and map errors deliberately.

Node-API error pattern:

```c
#define NAPI_CALL(env, call)                                      \
  do {                                                            \
    napi_status status = (call);                                  \
    if (status != napi_ok) {                                      \
      const napi_extended_error_info* info;                       \
      napi_get_last_error_info((env), &info);                     \
      const char* message = info && info->error_message           \
          ? info->error_message                                  \
          : "Node-API call failed";                              \
      napi_throw_error((env), NULL, message);                     \
      return NULL;                                                \
    }                                                             \
  } while (0)
```

Node-API production guidance:

| Concern | Guidance |
|---|---|
| Status checks | Wrap and check every call. Native errors without JS exceptions are debugging pain. |
| Types | Validate JS input before extracting native values. |
| Lifetimes | Keep native pointers behind finalizers or explicit close methods. |
| References | Use persistent references only when necessary and release them. |
| Async | Move CPU or blocking IO off the event loop. |
| Thread callbacks | Use thread-safe functions instead of calling JS from arbitrary native threads. |
| ABI version | Declare supported Node-API version and test the oldest supported Node. |

## node-addon-api

`node-addon-api` is the official C++ wrapper over Node-API. It improves ergonomics but the same lifetime and threading rules remain.

Example shape:

```cpp
#include <napi.h>

Napi::Value Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "expected two numbers").ThrowAsJavaScriptException();
    return env.Null();
  }

  double result = info[0].As<Napi::Number>().DoubleValue()
      + info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(env, result);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add", Napi::Function::New(env, Add));
  return exports;
}

NODE_API_MODULE(addon, Init)
```

Packaging checklist:

| File or setting | Purpose |
|---|---|
| `binding.gyp` | Native build configuration for node-gyp. |
| `prebuild` or package tooling | Optional prebuilt binaries for supported platforms. |
| `engines.node` | Communicates Node support policy. |
| CI matrix | OS, architecture, Node versions, debug/release builds. |
| Runtime load error | Clear message when binary is missing or incompatible. |

## Classic C++ addons and V8-specific APIs

Classic addons use V8, libuv, and internal Node APIs more directly. This can be necessary for deep engine integration, but it binds the addon to V8 and Node internals more tightly than Node-API.

Context-aware addon rules:

- Avoid global static state containing JS references.
- Store per-instance data and pass it to callbacks.
- Assume the addon can be loaded in multiple contexts or worker threads.
- Clean up with environment cleanup hooks or finalizers.
- Do not share V8 handles across isolates.

Use V8-specific addons only when:

- Node-API cannot represent the required behavior.
- The maintenance team can track Node and V8 changes.
- CI tests every supported Node version.
- The addon has strong crash, memory, and concurrency tests.

## Threading and async work

Native code must not block the event loop for expensive CPU work or blocking system calls. Use async work queues, worker threads, native threads, or external services depending on shape.

Thread rules:

| Rule | Reason |
|---|---|
| JS values belong to an environment and thread context. | Direct cross-thread use is unsafe. |
| Use thread-safe functions for native-to-JS callbacks. | They marshal calls onto the correct JS thread. |
| Reference or copy data needed after the JS call returns. | Temporary handles expire. |
| Make cancellation explicit. | Native work will not stop because a JS Promise was abandoned. |
| Release native resources on all paths. | Process lifetime hides leaks until load or tests reveal them. |

Async design options:

| Shape | Use when |
|---|---|
| Node-API async work | Short native job scheduled off event loop. |
| Worker thread plus addon | CPU-heavy JS/native orchestration with isolated JS context. |
| Native thread plus thread-safe function | External library owns callback thread. |
| Child process | Crash isolation matters more than shared memory performance. |
| WASM | Portability and memory isolation matter. |

## WebAssembly in Node.js

WebAssembly is often the cleanest boundary for portable compute. Node exposes the standard `WebAssembly` global. WASM modules run with linear memory and imported host functions.

Good fits:

- Deterministic compute kernels.
- Parsers and codecs compiled from Rust, C, C++, or Zig.
- Plugin-like execution where memory isolation helps.
- Cross-runtime code shared with browsers and edge.

Poor fits:

- Heavy direct OS integration without WASI or host functions.
- Native libraries with complex callback and pointer ownership.
- Tasks dominated by JS-to-WASM boundary crossing.
- Work requiring direct access to Node objects.

Example: instantiate a WASM module.

```js
import { readFile } from 'node:fs/promises';

export async function loadModule(path) {
  const bytes = await readFile(path);
  const module = await WebAssembly.compile(bytes);
  return WebAssembly.instantiate(module, {
    env: {
      log(value) {
        console.log({ value });
      },
    },
  });
}
```

WASM performance checklist:

| Concern | Guidance |
|---|---|
| Boundary calls | Batch data to reduce JS/WASM crossings. |
| Memory copies | Pass offsets and lengths where appropriate; copy only at safe boundaries. |
| Startup | Cache compiled modules when possible. |
| Errors | Map traps and module errors to typed JS errors. |
| Security | Treat host imports as the capability surface. |

## WASI

WASI gives WebAssembly programs POSIX-like access through explicit capabilities such as args, env, and preopened directories. In Node, the `node:wasi` module provides a WASI implementation and requires selecting a WASI version such as `preview1`.

Use WASI when:

- You have a CLI-like WASM artifact.
- The module needs filesystem-like access through preopens.
- You want a capability boundary around allowed paths.

Example:

```js
import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';
import { argv, env } from 'node:process';

const wasi = new WASI({
  version: 'preview1',
  args: argv,
  env,
  preopens: {
    '/work': '/srv/worker/input',
  },
});

const wasm = await WebAssembly.compile(await readFile('./tool.wasm'));
const instance = await WebAssembly.instantiate(wasm, wasi.getImportObject());
wasi.start(instance);
```

WASI footguns:

| Footgun | Consequence |
|---|---|
| Broad preopens | WASM gets more filesystem reach than intended. |
| Passing full environment | Secrets leak into module. |
| Assuming POSIX completeness | WASI preview support is not a full OS. |
| Treating WASM as harmless | Host imports can grant powerful capabilities. |

## Experimental FFI

Node v26 introduced `node:ffi` as an experimental module for loading dynamic libraries and calling native symbols. It is unsafe, gated by `--experimental-ffi`, available only under the `node:` scheme in builds with FFI support, and restricted by the permission model unless `--allow-ffi` is provided.

Use FFI for:

- Internal experiments.
- Thin calls to stable C ABI functions.
- Operational tooling where process crash risk is acceptable.
- Avoiding a compile step for a small trusted integration.

Avoid FFI for:

- Untrusted inputs.
- Complex ownership and callbacks.
- Long-lived public packages that need stable support.
- Security-sensitive service hot paths.

Example shape:

```js
import { dlopen } from 'node:ffi';

using handle = dlopen('./libmath.so', {
  add_i32: {
    arguments: ['i32', 'i32'],
    return: 'i32',
  },
});

console.log(handle.functions.add_i32(20, 22));
```

FFI safety checklist:

| Risk | Guard |
|---|---|
| Wrong signature | Generate bindings from headers or keep a reviewed signature table. |
| Freed memory | Define owner and lifetime for every pointer. |
| Resized backing store | Do not detach, transfer, or resize buffers during native calls. |
| Callback lifetime | Register, reference, unreference, and unregister deliberately. |
| Platform ABI drift | Test OS, architecture, library version, and compiler ABI. |
| Process crash | Isolate risky calls in a worker or child process when possible. |

## Embedding Node and V8

Embedding means a C++ host application creates and runs a Node.js environment instead of launching `node` as the top-level process. This is specialized work for databases, desktop apps, appliances, custom runtimes, or platforms that need JavaScript extensibility.

Embedding concerns:

| Concern | Why it matters |
|---|---|
| V8 platform | V8 needs platform initialization and task scheduling. |
| Isolate | Heap and JS execution live inside an isolate. |
| Context | Global object and built-ins are context-specific. |
| libuv loop | Node async IO depends on event loop integration. |
| Environment | Node environment binds V8, libuv, process state, and modules. |
| Shutdown | Cleanup order matters for handles, microtasks, finalizers, and platform state. |

Embedding is not a plugin system by itself. You still need policy:

- Which modules can user code load?
- How is filesystem and network access restricted?
- How are CPU and memory bounded?
- How are diagnostics captured?
- How are crashes isolated?
- How are V8 and Node upgraded?

## Error mapping

Native errors should become predictable JavaScript errors.

| Native condition | JS mapping |
|---|---|
| Invalid argument | `TypeError` with parameter name and expected shape. |
| Domain error | Custom `Error` subclass with code. |
| System error | Error with `code`, `errno`, `syscall`, and path or address when safe. |
| Resource closed | Idempotent close or `ERR_RESOURCE_CLOSED` style error. |
| Cancellation | AbortError-compatible error when driven by `AbortSignal`. |
| Panic or invariant failure | Convert if recoverable; otherwise crash fast with report. |

Avoid returning mixed shapes such as sometimes `null`, sometimes `false`, sometimes exception. Native boundary APIs are hard enough to debug without ambiguous failure contracts.

## Security and reliability

Native boundary review checklist:

| Area | Review |
|---|---|
| Input validation | Lengths, encodings, integer ranges, null pointers, enum ranges. |
| Memory safety | Bounds checks, ownership, double free, use after free, finalizer ordering. |
| Thread safety | Race conditions, JS callbacks from native threads, shared globals. |
| Event loop | Blocking calls, long CPU loops, sync filesystem, hidden locks. |
| Supply chain | Prebuilt binaries, install scripts, system libraries, provenance. |
| Sandbox | WASI preopens, FFI allow list, worker or child process isolation. |
| Observability | Native call latency, error codes, crash reports, heap snapshots. |
| Fuzzing | Parsers and binary input boundaries fuzzed outside Node and through JS API. |

Operational controls:

- Enable diagnostic reports for crashes in production environments.
- Keep symbol files for native builds.
- Test with sanitizers in CI for native code.
- Run stress tests that load and unload addons repeatedly.
- Verify worker thread behavior if the package can be imported in workers.
- Document platform support explicitly.

## Troubleshooting

| Symptom | Likely cause | First check |
|---|---|---|
| `MODULE_NOT_FOUND` for `.node` binary | Build artifact missing or wrong path. | Package files, install output, platform tuple. |
| `Module did not self-register` | ABI mismatch or bad initializer. | Node version, Node-API version, addon macro. |
| Crash after callback | JS called from wrong thread or stale reference. | Thread-safe function usage and reference lifecycle. |
| Works on main thread, fails in worker | Not context-aware or uses unsafe globals. | Addon initialization and per-instance data. |
| Memory grows after tests | References or native resources not released. | Finalizers, close methods, heap snapshots. |
| WASI cannot read file | Missing or wrong preopen mapping. | WASI config and module path expectations. |
| FFI crashes immediately | Wrong signature or pointer type. | Header definition, calling convention, return type. |
| Embedder hangs on shutdown | Active handles or wrong cleanup order. | libuv handles, environment teardown, pending microtasks. |

## Decision examples

| Scenario | Good choice | Reason |
|---|---|---|
| Image codec with mature C library and high throughput | Node-API addon or child process wrapper | Performance and library reuse justify native code; crash isolation may matter. |
| Small call to system library in internal tool | Experimental FFI | Fast integration if process crash risk is acceptable. |
| User-supplied compute plugin | WASM plus narrow host imports | Stronger capability boundary than native addon. |
| Existing Rust parser used by browser and Node | WASM or Node-API through napi-rs | Choose based on boundary call cost and packaging needs. |
| Need to expose JS scripting inside a C++ application | Embed Node | Host owns lifecycle and can integrate event loop deliberately. |

## Related notes

- [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering)
- [11 Networking HTTP TLS DNS Sockets Undici and Fetch](/compendium/nodejs-v8-runtime-engineering/networking-http-tls-dns-sockets-undici-and-fetch)
- [12 Web Platform APIs in Node.js URL Blob Web Streams AbortController and Test Runner](/compendium/nodejs-v8-runtime-engineering/web-platform-apis-in-node-js-url-blob-web-streams-abortcontroller-and-test-runner)
- <span className="compendium-external-reference" title="Vault-only reference">09 Unsafe Rust and the Rust Memory Model</span>
- <span className="compendium-external-reference" title="Vault-only reference">14 FFI Embedded WebAssembly and Interop</span>
- [Software Engineering/09 Security and Supply Chain](/compendium/software-engineering/security-and-supply-chain)

## Official reference anchors checked

- Node.js v26.3.0 Node-API: https://nodejs.org/api/n-api.html
- Node.js v26.3.0 C++ addons: https://nodejs.org/api/addons.html
- Node.js v26.3.0 experimental FFI: https://nodejs.org/api/ffi.html
- Node.js v26.3.0 WASI: https://nodejs.org/api/wasi.html
- Node.js v26.3.0 C++ embedder API: https://nodejs.org/api/embedding.html
- V8 embedding guide: https://v8.dev/docs/embed
