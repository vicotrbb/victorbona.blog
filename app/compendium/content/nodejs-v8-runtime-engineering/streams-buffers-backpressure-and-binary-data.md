---
title: "Streams Buffers Backpressure and Binary Data"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/09 Streams Buffers Backpressure and Binary Data.md"
order: 9
---
Purpose: Make Node.js streams, buffers, backpressure, encodings, and binary data handling operationally predictable for services that move large data without exhausting memory.

# Streams, Buffers, Backpressure, and Binary Data

Parent map: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering)

Related notes:

- [08 Async Programming Promises Async Await Timers and Cancellation](/compendium/nodejs-v8-runtime-engineering/async-programming-promises-async-await-timers-and-cancellation)
- [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes)

## Why streams matter

Streams are Node's pressure-aware abstraction for incremental data. They let a process handle data sets larger than memory, connect files to sockets, transform data chunk by chunk, and keep producers from outrunning consumers.

The default failure mode of non-streaming code is simple: buffer the world, then crash or stall.

```js
// Bad for large objects or untrusted input.
const body = await fs.promises.readFile(path);
await upload(body);
```

Streaming changes the shape:

```js
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

await pipeline(
  createReadStream("input.log"),
  createGzip(),
  createWriteStream("input.log.gz"),
);
```

`pipeline()` is the production default because it wires errors, closure, and backpressure across the chain.

## Stream kinds

| Kind | Direction | Examples | Implementation method |
| --- | --- | --- | --- |
| Readable | Produces chunks | `fs.createReadStream`, HTTP request body | `_read()` |
| Writable | Consumes chunks | `fs.createWriteStream`, HTTP response | `_write()` |
| Duplex | Reads and writes independently | TCP socket, TLS socket | `_read()` and `_write()` |
| Transform | Reads input and writes transformed output | gzip, CSV parser, hash stream | `_transform()` |

Object mode streams move JavaScript values. Binary streams move `Buffer`, `Uint8Array`, or strings depending on encoding.

## Backpressure

Backpressure is the signal that the downstream consumer cannot safely accept more data right now.

For writable streams:

- `writable.write(chunk)` returns `true` when the internal queue is below its threshold.
- It returns `false` when the producer should pause.
- The writable emits `drain` when it is ready for more.

```js
import { once } from "node:events";

async function writeAll(writable, chunks) {
  for await (const chunk of chunks) {
    if (!writable.write(chunk)) {
      await once(writable, "drain");
    }
  }
  writable.end();
  await once(writable, "finish");
}
```

This is easy to get wrong. Prefer `pipeline()` unless you have a narrow reason to manually wire the flow.

## High water marks

`highWaterMark` is a threshold, not a hard maximum. It influences when streams apply backpressure.

| Context | Meaning | Risk if too low | Risk if too high |
| --- | --- | --- | --- |
| Binary readable | Buffered bytes before pausing pull | More syscalls, lower throughput | More memory per stream |
| Binary writable | Queued bytes before `write()` returns false | Underutilized sink | Memory growth under slow sink |
| Object mode | Buffered object count | Scheduling overhead | Retained object graphs |

Do not tune `highWaterMark` blindly. Measure throughput, memory, and latency with representative payload sizes.

## Pipeline and cancellation

Modern `stream/promises.pipeline()` supports `AbortSignal`. That makes it fit the cancellation model from [08 Async Programming Promises Async Await Timers and Cancellation](/compendium/nodejs-v8-runtime-engineering/async-programming-promises-async-await-timers-and-cancellation).

```js
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

async function compressFile(input, output, { signal }) {
  await pipeline(
    createReadStream(input),
    createGzip(),
    createWriteStream(output),
    { signal },
  );
}
```

Rules:

- Pass the same request or job signal through the whole pipeline.
- If you use async generator transforms, accept and respect the `{ signal }` argument.
- Treat `AbortError` as cancellation, not as a mysterious I/O failure.
- Clean up partial output files when cancellation or write errors occur.

## Async iterator streams

Readable streams are async iterable. This is good for parsing protocols, line readers, and controlled processing.

```js
for await (const chunk of readable) {
  await processChunk(chunk);
}
```

But writing to a sink inside a loop must still honor backpressure.

```js
import { once } from "node:events";

for await (const chunk of readable) {
  if (!writable.write(transform(chunk))) {
    await once(writable, "drain");
  }
}
writable.end();
```

If the transform is mostly mechanical, `pipeline()` is clearer and less error-prone.

## Buffers

`Buffer` is Node's binary byte container. It is a subclass of `Uint8Array` with Node-specific methods for encodings, integer reads and writes, slicing, and pooling.

| Constructor | Initializes memory | Use case |
| --- | --- | --- |
| `Buffer.from(string, encoding)` | Encodes known data | Text to bytes |
| `Buffer.from(array)` | Copies values | Small explicit bytes |
| `Buffer.from(arrayBuffer)` | Views existing memory | Interop with Web APIs |
| `Buffer.alloc(size)` | Zero-filled | Safe new output buffer |
| `Buffer.allocUnsafe(size)` | Not zero-filled | Performance path only when fully overwritten |
| `Buffer.concat(buffers, totalLength)` | Copies buffers into one | Protocol frames and final assembly |

Security rule: never expose or serialize bytes from `Buffer.allocUnsafe()` unless every byte has been overwritten.

```js
const header = Buffer.alloc(8);
header.writeUInt32BE(payload.length, 0);
header.writeUInt32BE(0x01, 4);
```

## Slices, views, and copies

Buffer APIs often create views over the same memory rather than copies.

```js
const packet = Buffer.from("abcdef");
const view = packet.subarray(0, 3);
view[0] = 0x5a;
console.log(packet.toString()); // "Zbcdef"
```

Production guidance:

- Use `subarray()` for zero-copy parsing while the parent buffer is still owned and immutable.
- Use `Buffer.from(view)` when data must outlive the parent buffer or be isolated from mutation.
- Avoid retaining a tiny slice of a huge buffer in long-lived structures. It can keep the larger allocation alive.
- Document ownership when passing buffers across module boundaries.

## Encodings

Binary and text are different domains. A `Buffer` has bytes; a string has characters. UTF-8 characters can span multiple bytes and can be split across chunks.

| Task | Correct tool | Footgun |
| --- | --- | --- |
| Decode whole known UTF-8 payload | `buffer.toString("utf8")` | Using wrong encoding |
| Decode streaming text | `TextDecoder` with streaming or `StringDecoder` | Splitting multibyte characters |
| Encode string | `Buffer.from(text, "utf8")` | Assuming length equals byte length |
| Count bytes | `Buffer.byteLength(text, "utf8")` | Using `text.length` |
| Parse binary protocol | `readUInt*`, `readInt*`, `readBigUInt*` | Endianness mismatch |

```js
const text = "cafe";
const bytes = Buffer.from(text, "utf8");
console.log(text.length);
console.log(bytes.length);
```

Even when the numbers match for ASCII, build code as if they will not.

## Transform stream example

```js
import { Transform } from "node:stream";

class LinePrefixer extends Transform {
  constructor(prefix) {
    super();
    this.prefix = Buffer.from(prefix);
    this.leftover = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    try {
      const data = Buffer.concat([this.leftover, chunk]);
      const parts = data.toString("utf8").split("\n");
      this.leftover = Buffer.from(parts.pop() ?? "");
      for (const line of parts) {
        this.push(Buffer.concat([
          this.prefix,
          Buffer.from(line),
          Buffer.from("\n"),
        ]));
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    if (this.leftover.length > 0) {
      this.push(Buffer.concat([this.prefix, this.leftover]));
    }
    callback();
  }
}
```

The example is intentionally small, but it shows the mechanics: retain incomplete data, push only complete frames, and report errors through the callback.

## File and process streaming

Streams are the natural boundary between this note and [10 Filesystem Processes Signals Workers Cluster and Child Processes](/compendium/nodejs-v8-runtime-engineering/filesystem-processes-signals-workers-cluster-and-child-processes).

| Source or sink | Stream API | Notes |
| --- | --- | --- |
| File read | `fs.createReadStream(path)` | Honors backpressure from downstream |
| File write | `fs.createWriteStream(path)` | Watch `finish` and `error` |
| Child stdout | `child.stdout` | Drain it or the child can block |
| Child stdin | `child.stdin` | Honor `write()` return value |
| HTTP request | `req` readable | Enforce size limits |
| HTTP response | `res` writable | Handle client disconnect |

## Size limits

Streaming does not remove the need for explicit limits.

```js
async function readLimited(readable, maxBytes) {
  const chunks = [];
  let total = 0;

  for await (const chunk of readable) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new Error(`payload too large: ${total} bytes`);
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks, total);
}
```

Use this pattern sparingly. If the next step can stream, keep streaming.

## Common footguns

| Footgun | Symptom | Safer pattern |
| --- | --- | --- |
| Ignoring `write()` return value | Memory grows under slow clients | Await `drain` or use `pipeline()` |
| Manual `.pipe()` chain without error handling | Hung or half-closed streams | Use `pipeline()` |
| `Buffer.allocUnsafe()` for response bytes | Data leak risk | `Buffer.alloc()` or fully overwrite |
| `chunk.toString()` per chunk for UTF-8 protocol | Corrupted multibyte characters | Streaming decoder |
| `text.length` as byte count | Truncated or oversized frames | `Buffer.byteLength()` |
| Retaining subarray of huge buffer | Unexpected memory retention | Copy small retained slice |
| Unbounded `Buffer.concat()` loop | Quadratic copying and memory spikes | Track chunks, concat once, or stream |
| No request body limit | Memory or disk exhaustion | Limit bytes before parsing |
| Transform ignores callback errors | Pipeline never fails correctly | `callback(error)` or destroy stream |

## Troubleshooting stream incidents

| Symptom | First checks | Likely cause |
| --- | --- | --- |
| RSS grows with slow clients | Writable queue lengths, write return values | Backpressure ignored |
| Pipeline hangs after abort | Async generator signal handling | Transform did not observe signal |
| Output file is corrupt after failure | Partial file cleanup | Missing atomic write pattern |
| Child process appears stuck | stdout and stderr consumers | Pipe buffer full |
| Unicode replacement characters | Chunk boundary decoding | Split multibyte sequence |
| High CPU in transform | Per-byte JavaScript loops | Batch chunks or move CPU work |
| High latency on upload | highWaterMark and downstream speed | Sink pressure or remote bottleneck |

## Production patterns

### Atomic streaming write

```js
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";

async function writeStreamAtomically(source, destination, { signal }) {
  const temp = `${destination}.${process.pid}.tmp`;
  try {
    await pipeline(source, createWriteStream(temp), { signal });
    await rename(temp, destination);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}
```

### Bounded frame parser

```js
function readFrame(buffer) {
  if (buffer.length < 4) return null;
  const length = buffer.readUInt32BE(0);
  if (length > 1_000_000) throw new Error("frame too large");
  if (buffer.length < 4 + length) return null;
  return {
    frame: buffer.subarray(4, 4 + length),
    rest: buffer.subarray(4 + length),
  };
}
```

### Streamed child process

```js
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";

async function gzipFile(inputStream, outputStream, { signal }) {
  const gzip = spawn("gzip", ["-c"], {
    stdio: ["pipe", "pipe", "inherit"],
    signal,
  });

  await Promise.all([
    pipeline(inputStream, gzip.stdin, { signal }),
    pipeline(gzip.stdout, outputStream, { signal }),
  ]);
}
```

## Production checklist

- Use `pipeline()` for multi-stream flows.
- Pass cancellation signals through pipelines.
- Enforce byte limits at trust boundaries.
- Treat buffers as owned or borrowed and document which.
- Avoid `allocUnsafe()` unless overwrite is mechanically guaranteed.
- Decode streaming text with a streaming decoder.
- Respect `write()` and `drain` when manually writing.
- Consume child process stdout and stderr.
- Clean partial files after failed pipelines.
- Measure memory per concurrent stream, not just total throughput.

## Official docs checked

- Node stream: https://nodejs.org/api/stream.html
- Node buffer: https://nodejs.org/api/buffer.html
- Node events: https://nodejs.org/api/events.html
- Node filesystem streams: https://nodejs.org/api/fs.html
- Node child process streams: https://nodejs.org/api/child_process.html
