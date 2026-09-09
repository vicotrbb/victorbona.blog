# Five Article Topics for Victor Bona's Blog

The recommended return to the blog is a sequence about efficient software: choosing when computation happens, reading less data, rejecting unnecessary work, controlling work in flight, and organizing memory. Three articles use geospatial systems as their central example. Two broaden the sequence into data processing and computer architecture.

Start with **A File Can Replace Your Tile Server: The Engineering Behind PMTiles**. It offers the clearest visual demonstration, introduces a subject underrepresented in the existing blog, and connects naturally to its established interest in infrastructure tradeoffs. The strongest follow-up is the GeoParquet article, which moves from displaying data to querying it.

The intended audience is experienced software engineers who understand APIs, databases, and basic complexity analysis but may be unfamiliar with GIS. Each article should introduce only the geospatial vocabulary its example needs. The recommendations are editorial judgments, rather than predictions of traffic or search demand.

## Editorial fit and selection

The local archive contains 34 English MDX posts and a Portuguese translation in a separate directory. The newest English post is dated June 16, 2026, leaving an 84-day gap to September 8. These are repository observations, not independent verification of the public site's publication state.

The recent articles emphasize operational reasoning: deployment status, reconciliation, durable execution, recovery, and evidence during incidents. Earlier posts introduce concurrency, Node.js optimization, abstractions, and a small search engine. The strongest continuation would preserve the recent articles' concrete engineering arguments while adding more measured demonstrations.

The project catalog supplies useful connections. DataTide provides context for a discussion of concurrent data processing; SQLTemple provides a connection to query plans; E-Navigator provides a possible pipeline example; and Locus provides a connection to memory ownership and careful benchmarking. The catalog is evidence that these subjects belong to the portfolio. It does not independently verify the implementations or performance claims in those other repositories.

There is also meaningful overlap to manage. The compendium already has a reference chapter on streams and backpressure. The proposed pipeline article therefore needs a workload, an overload experiment, and a memory accounting model that go beyond explaining the stream API. Likewise, the memory article should develop a concrete experiment beyond the existing essay on abstraction costs.

The five selections were favored for technical depth, distinctness from existing posts, accessible primary sources, a feasible demonstration, and a question narrow enough to resolve in one article. No audience analytics or keyword-volume data were available; the ranking reflects editorial fit and execution potential.

| Recommended order | Working title | Central question | Target length | Preparation burden |
| --- | --- | --- | --- | --- |
| 1 | A File Can Replace Your Tile Server: The Engineering Behind PMTiles | When can an indexed archive replace a dynamic tile-serving path? | 2,300–2,600 words | Moderate: a small map and network trace |
| 2 | Stop Reading the Whole Dataset: GeoParquet, Spatial Locality, and Query Pruning | How much work can storage layout remove before geometry processing starts? | 2,500–2,800 words | Moderate: controlled file variants and query measurements |
| 3 | Fast Spatial Queries Without Losing Correctness | How do we reject most candidates while preserving every real match? | 2,400–2,700 words | Moderate: geometry fixtures and result-set comparisons |
| 4 | Designing Data Pipelines That Stay Within a Memory Budget | What happens when producers remain faster than consumers? | 2,200–2,600 words | Low to moderate: deterministic producer and slow sink |
| 5 | Why O(n) Code Can Still Be Slow: Data Layout and the Memory Hierarchy | Why do equal-complexity loops behave differently on actual hardware? | 2,400–2,800 words | Moderate to high: careful benchmark controls |

The site's `getReadingTime` function uses 200 whitespace-separated words per minute and rounds upward. The ranges above yield roughly 11–14 displayed minutes, leaving room for short code examples. Code tokens also affect that estimate. Actual reading time should be checked separately because inspecting a diagram or understanding SQL takes longer than scanning prose.

## 1. A File Can Replace Your Tile Server: The Engineering Behind PMTiles

**Argument.** A stable map layer can move tile preparation into a build step and serve the result from an indexed archive. The interesting engineering decision is the division between preparation and request-time work, including the updates and queries that still require a service.

**Opening scenario.** A small application needs a map of buildings or infrastructure. Before adding a spatial database and a tile service to its runtime, follow one browser request into a PMTiles archive. Show how the reader locates the tile and fetches its bytes without downloading the complete file.

PMTiles is a single-file format for a tile pyramid, with clients fetching relevant portions through HTTP range requests. It is read-only in the sense that modifying the archive requires rewriting the file. Those two properties establish the article's central tradeoff: inexpensive distribution of prepared data versus the cost and timing of rebuilding it.[^1]

The version 3 specification offers enough computer science for a substantial explanation. The archive contains a header, directories, metadata, and tile data; tile identifiers follow cumulative positions on Hilbert curves. This supports a discussion of locality, indexing, and turning a logical tile address into a byte range.[^2] Overture's Explorer is an independent example of the architecture: its documentation describes a MapLibre application backed by PMTiles archives generated from Overture releases.[^3]

**Why it fits this blog.** The existing infrastructure writing already asks what a product actually needs to operate. This article applies that judgment to geospatial delivery and adds a visible result readers can inspect. It can cross-link to “Why I Decided to Go Baremetal” for operational ownership and “Over-Engineering” for choosing infrastructure, without repeating either argument.

**Suggested structure, about 2,500 words:**

1. **The map requirement and the runtime it seems to imply, 250 words.** Specify a public, periodically updated layer and viewport-based display.
2. **A tile pyramid in one file, 450 words.** Explain zoom/x/y, directories, offsets, and why locality matters. Use one archive-layout diagram.
3. **One pan operation through the network, 550 words.** Trace metadata lookup and tile ranges; distinguish requested bytes, transferred bytes, and decoded tiles.
4. **The build and release workflow, 500 words.** Prepare tiles, validate the archive, publish a versioned object, and update the map's reference. Explain how that publication design supports rollback.
5. **Where a service remains useful, 500 words.** Frequent edits, arbitrary filtering, access control, request latency, and cache behavior.
6. **A decision rule, 250 words.** Relate update frequency and query flexibility to the choice of a prepared archive, a service, or both.

**Proposed demonstration.** Use a small, pinned public building-footprint extract, preferably a familiar Brazilian city. Generate a single map layer and record a repeatable pan-and-zoom sequence. Show the archive size, cold-session requests, repeat-session requests, bytes transferred, and time until the chosen viewport finishes displaying. Keep the layer, styling, zoom sequence, browser, and network conditions fixed. A comparison with a tile service is optional; the article already works if the trace explains the mechanism clearly.

The original contribution should be the annotated request trace and the update workflow. A generic installation tutorial would undersell the topic. If a comparison is included, separate archive-generation time from serving time, and include both rather than letting precomputation disappear from the accounting.

**Limits to preserve.** A static archive does not provide arbitrary spatial queries or transactional editing. Fewer application components do not guarantee lower latency: Protomaps separately documents CDN and tile-serving deployments with different caching and performance characteristics.[^4] Test range support and cache behavior in the actual serving path. For a dataset prepared with geometry simplification, explain that the displayed geometry may differ from its analytical source.

**Scope boundary.** Keep the article about vector-tile delivery. Give COGs a brief analogy at most; raster processing, routing, and a survey of every map format would exceed the available reading time.

## 2. Stop Reading the Whole Dataset: GeoParquet, Spatial Locality, and Query Pruning

**Argument.** A selective query can become faster by arranging data so the reader can prove large portions irrelevant. The decisive variables are the physical layout, available statistics, and what the chosen engine actually uses.

**Opening scenario.** Find buildings intersecting a small area inside a much larger dataset. The answer is small, but a naïve path still reads, decodes, and filters substantial unrelated data. Keep the question identical while changing the layout of the input.

GeoParquet 1.1 defines optional per-row bounding-box covering metadata that can support filtering through row-group and page statistics. It distinguishes that covering from a single bounding box for the whole file, and explicitly limits the described covering technique for antimeridian-crossing geometries.[^5] The article should turn those distinctions into a picture of what a query can skip at each level.

GDAL exposes practical controls for this experiment: spatial sorting, row-group size, and covering-box creation. Its documentation also records the costs of sorting, including temporary storage and additional processing. Smaller row groups trade finer filtering for greater metadata and processing overhead.[^6] Parquet's optional page index adds another possible skipping level, but its presence does not establish that every engine will use it.[^7]

**Why it fits this blog.** This is the strongest intersection of geospatial data, data processing, and efficiency among the recommendations. It gives the existing performance discussion a more rigorous question: how many bytes and rows did the implementation avoid touching? SQLTemple provides a natural authorial connection to execution-plan inspection, without needing a product walkthrough.

**Suggested structure, about 2,700 words:**

1. **A small answer inside a large file, 250 words.** Define the dataset, query polygon, and exact meaning of “intersects.”
2. **How a reader skips work, 500 words.** Explain column projection, row groups, min/max statistics, and optional page indexes.
3. **Why geography needs locality, 500 words.** Compare shuffled and spatially grouped records. Distinguish a file extent from per-feature covering boxes.
4. **The controlled experiment, 700 words.** Run identical queries against matched variants and present bytes, rows, runtime, and preparation cost.
5. **Where the effect disappears, 450 words.** Wide queries, weak spatial clustering, large geometries, unsupported pushdown, and network latency.
6. **A layout decision readers can apply, 300 words.** Choose organization from the expected query shape and the cost of rebuilding data.

**Proposed demonstration.** Take one fixed Overture building extract and preserve its IDs and geometries in every variant. Overture documents querying its cloud-hosted GeoParquet with DuckDB, making it a practical source of realistic input.[^8] Start with a two-by-two comparison: shuffled versus spatially sorted order, each with covering boxes enabled versus disabled. Hold geometry encoding, codec, row-group target, selected columns, and engine version fixed. Then vary row-group size only for the more effective arrangement.

Run a small rectangular query, an irregular polygon query, and a broad query. Compare explicit bounding-box candidate filtering followed by the exact predicate with the engine's ordinary spatial-predicate plan. Inspect what pruning is actually performed. Match full result-ID sets against the baseline; equal counts alone can conceal different results.

For local reads, record elapsed time, memory, file size, and available scan metrics. For remote reads, additionally record transferred bytes and request counts. Treat the local and remote experiments separately. Persist the exact release, subset boundaries, tool versions, and preparation commands so changing upstream data cannot explain the result.

**Original contribution.** Make the main figure show identical queries touching different fractions of the input. Add a deliberately unfavorable wide query so the article explains the limit of the optimization. DuckDB's own discussion of sorting and zone maps supports the mechanism, but its reported speedups should not become the article's headline.[^9]

**Limits to preserve.** A file format can enable an optimization without causing an engine to apply it. A bounding-box match remains a candidate for an irregular polygon query. The GeoParquet homepage currently points to a 2.0.0 release candidate; explicitly pin the demonstration to a tested format version instead of presenting 1.1 as the latest release.[^10] Keep compression benefits separate from pruning benefits.

**Scope boundary.** Keep the main path to GeoParquet, one writer, and one query engine. A broad CSV-versus-Parquet-versus-database contest would introduce too many uncontrolled variables.

## 3. Fast Spatial Queries Without Losing Correctness

**Argument.** Efficient spatial search often has two stages: cheaply produce a conservative candidate set, then evaluate the required spatial relationship. The first stage must retain every possible match, and the second must implement the intended boundary semantics.

**Opening scenario.** Assign point observations to service areas. The straightforward implementation checks every point against every polygon. An optimization reduces the work, but now points near boundaries are missing or assigned differently. The article explains how to reason about both speed and correctness.

DuckDB's engineering account of spatial joins describes the move from nested-loop evaluation through bounding-box filtering to a dedicated spatial join operator that constructs an R-tree. It provides a concrete implementation of cheap rejection followed by more expensive spatial testing.[^11] Use this as supporting material for the general algorithm, rather than reproducing that article's benchmark.

H3 makes the correctness discussion especially valuable. Its ordinary `polygonToCells` operation selects cells according to their centers. Consequently, using that selection as an exact substitute for point-in-polygon classification can both admit points outside a polygon and miss points inside boundary-crossing cells. That consequence is an inference from the documented containment rule, and should be demonstrated with explicit fixtures.[^12]

**Why it fits this blog.** This topic turns the blog's concern with evidence into a computational question: what does a fast answer actually prove? It also brings algorithms back into the blog after the earlier vector-space search-engine article. A reader can understand the problem with a few polygons before seeing database machinery.

**Suggested structure, about 2,600 words:**

1. **The deceptively simple join, 250 words.** Establish the point-to-area question and the reference result.
2. **The all-pairs cost, 350 words.** Show O(nm) candidate comparisons and explain why complex polygons make each comparison costly.
3. **Cheap rejection and R-trees, 550 words.** Draw bounding boxes, candidate sets, and exact refinement. Explain that overlapping boxes can degrade selectivity.
4. **The boundary trap, 500 words.** Use an H3 example and a point on a polygon edge. Define the required inclusion rule.
5. **Correctness and performance together, 650 words.** Compare result sets, candidate counts, build cost, and execution time on uniform and clustered inputs.
6. **A reusable invariant, 300 words.** Every true match must survive candidate generation; refinement can remove false positives but cannot recover discarded true matches.

**Proposed demonstration.** Use a deterministic synthetic set of points and polygons. Include a polygon with a hole, a narrow corridor, a concave shape, a shared boundary, an overlapping pair, and points immediately inside and outside edges. Keep invalid geometries out of the first experiment so their repair does not become a confounder.

Compare a simple all-pairs reference, an indexed bounding-box candidate path with exact refinement, and H3 center-based classification as an explicitly approximate alternative. If implementing an H3-based exact candidate path, use and verify a covering that is conservative for the chosen coordinate and edge model. Increasing resolution alone is not a proof that no points can be missed.

Record the candidate count before exact refinement, the complete result pairs, the mismatch examples, build time, and query time. Use both one-shot and repeated queries to expose when indexing costs are amortized. A million points is unnecessary for explaining correctness; begin with a fixture small enough to draw, then scale the same model.

**Original contribution.** Show two charts side by side: work avoided and answers changed. The article becomes much more distinctive when readers can see an optimization that is fast but solves a different question.

**Limits to preserve.** “Exact” means exact under the selected predicate, input geometry, numeric representation, and coordinate model. PostGIS `ST_Covers` includes a geometry's boundary and may be appropriate when edge points should count.[^13] Adjacent areas can therefore both match a boundary point; assigning exactly one area requires a separate tie-breaking rule. Distinguish analytical aggregation on H3 cells from matching original polygons. DuckDB's 2025 article is historical evidence for its design, not a guarantee that its then-current memory and join limitations still describe every later release.

**Scope boundary.** Explain R-trees as the main acceleration mechanism and H3 as the instructive alternative. A comprehensive comparison of R-trees, S2, H3, geohashes, projections, and robust predicates would need multiple articles.

## 4. Designing Data Pipelines That Stay Within a Memory Budget

**Argument.** A pipeline's memory behavior depends on everything it admits and retains, including queued items, pending tasks, active batches, retries, and output waiting for order. Backpressure is useful only when it reaches the stage that creates or admits more work.

**Opening scenario.** A job reads records, enriches them concurrently, and writes batches. It behaves well against a fast sink, then memory rises steadily when that sink slows. Adding workers makes the backlog grow faster. Follow the retained data to find the real capacity boundary.

Node's stream documentation describes `highWaterMark` as a threshold rather than a hard memory limit. The official backpressure guide explains respecting a writable's `false` return value and resuming after `drain`.[^14][^15] Tokio's bounded `mpsc` channel offers a second implementation reference: when capacity is exhausted, sending waits until space is available.[^16] Neither API by itself accounts for memory held outside its buffer.

**Why it fits this blog.** This has the broadest immediate relevance for the existing audience. It advances the earlier concurrency and Node.js optimization posts from “use streams and workers” into workload design. DataTide or the E-Navigator pipeline could supply an introduction if their current source and measurements are inspected during drafting. A synthetic pipeline is sufficient and keeps the article independent of those projects.

**Suggested structure, about 2,400 words:**

1. **The slow sink, 250 words.** Present the input rate, completion rate, and observed backlog.
2. **A simple backlog model, 350 words.** In an interval with fixed rates and no dropping, backlog grows by approximately (arrival rate − completion rate) × duration when arrivals exceed completions.
3. **Count every retained byte, 500 words.** Account for queue payloads, active workers, batching, ordering buffers, and retries. Explain variable record sizes.
4. **Make pressure reach the producer, 550 words.** Use a single language to show bounded admission, limited worker concurrency, sink feedback, cancellation, and cleanup.
5. **An overload experiment, 500 words.** Slow the sink, compare policies, then restore it and observe recovery.
6. **Choose the overload contract, 250 words.** Decide whether the workload should wait, reject, drop, or spill, and state what each choice means for its data.

**Proposed demonstration.** Generate deterministic NDJSON records lazily and send them through a transform to a sink with controlled delays. Compare three implementations: eager submission of all records, bounded active concurrency with an accidentally unbounded pending queue, and bounded admission with downstream feedback. Use a configured total record count and payload-size distribution, including an occasional large record.

Start with a steady sink, introduce a sustained slowdown, then restore it. Measure completed records per second, queue items and bytes, active work, process RSS, latency from admission to completion, and time to drain after recovery. Cancellation should leave no abandoned workers or accumulating retry tasks. Run long enough to distinguish a plateau from growth that simply has not exhausted memory yet.

The central model can be presented as an accounting aid:

```text
retained application memory ≈
  queued payloads + active-worker state + read/write buffers
  + retained results + retry state + bookkeeping
```

This is not a hard bound on process RSS. Allocators, runtime overhead, shared buffers, and native libraries require separate observation. A hard application-level budget needs bounded payload sizes or byte-aware admission, as well as bounded item counts.

**Original contribution.** The most revealing comparison is between limiting active workers and limiting total admitted work. A stream API tutorial alone would duplicate the compendium. An overload trace showing pressure propagation and recovery supplies the new contribution.

**Limits to preserve.** Backpressure does not increase downstream capacity. A source that cannot pause requires an explicit overflow policy. A persistent queue changes where backlog is stored but still needs a storage budget. If output order is required, completed later items may accumulate behind one slow earlier item; include that buffer in the model. Avoid copying old memory numbers from the Node guide as expectations for a current runtime.

**Scope boundary.** Use TypeScript/Node.js for the main demonstration to connect with existing readers, with Tokio as a brief cross-language reference. Keep distributed delivery guarantees and durable workflow engines in the existing durable-execution article.

## 5. Why O(n) Code Can Still Be Slow: Data Layout and the Memory Hierarchy

**Argument.** Complexity analysis describes how work grows with input size; measured throughput also depends on bytes moved, access patterns, allocation, and generated instructions. Data organization is an algorithm implementation decision that can be investigated directly.

**Opening scenario.** Two implementations scan the same number of observations and compute the same result. One walks individually allocated records; another reads a compact array. Both are O(n), but the processor sees different memory traffic and dependencies. A third version organizes the few needed fields into separate arrays.

Apache Arrow's format specification explicitly emphasizes locality, sequential access, and SIMD-friendly representation, while recognizing comparatively more expensive mutation. It gives an established systems example of choosing a representation around the work it must support.[^17] Berkeley Lab's Roofline explanation relates numerical throughput to compute capability, memory bandwidth, and arithmetic intensity.[^18] Together they support an explanation of why operation counts alone do not predict elapsed time.

**Why it fits this blog.** The local catalog's Locus entry and article abstract make memory management an especially credible connection. The article can connect to that work without depending on unverified benchmark numbers. It also strengthens the earlier abstraction-cost essay by making one mechanism measurable instead of attributing performance to abstraction in general.

**Suggested structure, about 2,650 words:**

1. **Three linear scans, 250 words.** Define one calculation and show the three representations.
2. **What complexity leaves open, 400 words.** Separate scaling behavior from memory traffic and instruction costs.
3. **Draw the memory, 550 words.** Compare individually allocated records, contiguous records, and separate field arrays; explain useful versus unnecessary bytes.
4. **Benchmark the actual claim, 750 words.** Separate construction from scanning, vary dataset size, inspect optimized code, and consume results.
5. **Where layout stops helping, 450 words.** Wider record use, branch-heavy work, expensive calculations, mutation, and conversion costs.
6. **A profiling-driven design choice, 250 words.** Identify the limiting resource before changing representation or adding threads.

**Proposed demonstration.** Use Rust for a compact numerical workload so the first experiment does not mix a JavaScript JIT, garbage collection, and object-layout behavior with the memory question. Represent records containing coordinates, a numeric measurement, and several unused fields. Run an identical filter-and-aggregate kernel over individually allocated records, contiguous structs, and separate arrays.

Prepare data outside the scan benchmark, then measure preparation separately and include an end-to-end total. Keep numeric precision, row order, predicate, and result semantics equivalent. Use release builds and publish compiler and target settings. Test working sets that fit in cache and ones that exceed the measured machine's cache capacities. A second workload that consumes most fields gives the contiguous-record arrangement a fair opportunity.

Record time per element, result checks, allocation behavior during preparation, memory footprint, and available hardware counters. Disassemble or use compiler diagnostics before claiming SIMD caused a change. LLVM documents both automatic vectorization and the cost model that can reject it; a contiguous layout is an opportunity, not proof of vectorized machine code.[^19]

**Original contribution.** Include a result in which the apparent win becomes smaller after preparation or full payload processing is included. That makes the article an argument about measurement and representation rather than a universal recommendation for columnar data. If Locus is included, restrict its role to the verified lesson and clearly label allocator-level measurements versus complete application performance.

**Limits to preserve.** Individually allocated objects are not necessarily physically scattered; describe or control placement before blaming locality. Floating-point reassociation can alter results and must not silently change correctness between variants. Roofline is a bound for an appropriate numerical model, not a complete predictor for pointer chasing, allocation, or branch-heavy code. Do not assume cache-line size, NUMA behavior, or SIMD width transfers unchanged between Apple Silicon and x86 machines. Conversion to Arrow can cost time and memory; “zero-copy” only applies where the relevant representation and interface actually permit it.

**Scope boundary.** Focus on a single scan kernel, layout, and measurement. Custom allocator implementation, GPU programming, lock-free algorithms, and a complete CPU architecture course would each overwhelm this article.

## How to turn the selection into a coherent return

The sequence has a useful progression. PMTiles asks whether work belongs in the build or in the serving path. GeoParquet asks which bytes must be read. Spatial indexing asks which candidates must be examined. Backpressure asks how much unfinished work the system can retain. Memory layout asks how efficiently the remaining work executes.

Each article should remain independently useful. Reuse a small public geospatial dataset where convenient, but reintroduce the question and publish standalone reproduction instructions. A reader arriving from search should not need to complete four earlier installments.

Use one main argument, one working example, one revealing figure, and one section about where the approach fails. Put full benchmark harnesses and lengthy code in companion files. The article should spend its word budget explaining decisions and results rather than installation steps.

Broad AI trend forecasts, another durable-execution introduction, a general database comparison, and a standalone allocator benchmark were considered less suitable for this five-article return. The first two overlap established coverage, the database comparison lacks a sufficiently narrow question, and the allocator story needs more specialized context than the broader memory-layout article. These are editorial exclusions, not claims that those subjects lack value.

The experiments described here are proposals. No benchmark results, performance multipliers, or measured reader-demand claims are asserted. Standards and API claims are supported by primary sources; the examples and article structures are editorial designs. Mutable documentation was consulted on September 8, 2026. Pin executable environments before drafting measurements, and distinguish dated implementation accounts from current API behavior.

## Sources

[^1]: Protomaps. [PMTiles Concepts](https://docs.protomaps.com/pmtiles/). Living documentation, accessed September 8, 2026. Supports range-based reading and archive update constraints.

[^2]: Protomaps contributors. [PMTiles Version 3 Specification](https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md). Version 3, accessed September 8, 2026. Supports archive sections, directory lookup, and Hilbert-based tile identifiers.

[^3]: Overture Maps Foundation. [Explorer](https://docs.overturemaps.org/getting-data/explore/). Living documentation, accessed September 8, 2026. Describes MapLibre and PMTiles in Overture's data explorer.

[^4]: Protomaps. [Why deploy Protomaps on a CDN?](https://docs.protomaps.com/deploy/). Living documentation, accessed September 8, 2026. Documents deployment alternatives and caching/performance differences. Provider prices and numerical latency estimates are not adopted here.

[^5]: GeoParquet contributors. [GeoParquet Specification, version 1.1.0](https://geoparquet.org/releases/v1.1.0/). Versioned specification, accessed September 8, 2026. Supports geometry metadata, per-row covering, and the stated antimeridian limitation.

[^6]: GDAL contributors. [(Geo)Parquet driver](https://gdal.org/en/stable/drivers/vector/parquet.html). Living documentation, accessed September 8, 2026. Supports spatial sorting, row-group controls, compatibility, and preparation costs.

[^7]: Apache Parquet contributors. [Page Index](https://parquet.apache.org/docs/file-format/pageindex/). Living format documentation, accessed September 8, 2026. Explains optional page statistics and selective page access.

[^8]: Overture Maps Foundation. [DuckDB](https://docs.overturemaps.org/getting-data/duckdb/). Living documentation, accessed September 8, 2026. Provides examples of spatially selecting cloud-hosted GeoParquet data.

[^9]: DuckDB. [Sorting on Insert for Fast Selective Queries](https://duckdb.org/2025/05/14/sorting-for-fast-selective-queries). May 14, 2025. Explains how physical ordering affects zone-map selectivity. Published benchmark numbers are not reused.

[^10]: GeoParquet contributors. [GeoParquet project homepage](https://geoparquet.org/). Accessed September 8, 2026. At access time, highlights the 2.0.0-rc.1 specification.

[^11]: DuckDB. [Spatial Joins in DuckDB](https://duckdb.org/2025/08/08/spatial-joins). August 8, 2025. Explains nested-loop, bounding-box, and R-tree-based spatial-join approaches. Its implementation limitations are treated as historical.

[^12]: H3 contributors. [Region functions, version 4.x](https://h3geo.org/docs/api/regions/). Living API documentation, accessed September 8, 2026. Defines cell-center containment for `polygonToCells` and distinguishes experimental containment modes.

[^13]: PostGIS contributors. [ST_Covers](https://postgis.net/docs/ST_Covers.html). Living API documentation, accessed September 8, 2026. Defines boundary-inclusive coverage and related validity considerations.

[^14]: Node.js contributors. [Stream API](https://nodejs.org/api/stream.html). Living API documentation, accessed September 8, 2026. Defines buffering and explains that high-water marks are thresholds.

[^15]: Node.js contributors. [Backpressuring in Streams](https://nodejs.org/learn/modules/backpressuring-in-streams). Living learning guide, accessed September 8, 2026. Explains flow control and respecting writable feedback. Historical benchmark values are not reused.

[^16]: Tokio contributors. [tokio::sync::mpsc::channel](https://docs.rs/tokio/latest/tokio/sync/mpsc/fn.channel.html). Living API documentation, accessed September 8, 2026. Defines a bounded channel with backpressure.

[^17]: Apache Arrow contributors. [Arrow Columnar Format](https://arrow.apache.org/docs/format/Columnar.html). Living format specification, accessed September 8, 2026. Supports locality, vectorization-friendly representation, shared-memory access, and mutation tradeoffs.

[^18]: Lawrence Berkeley National Laboratory, Applied Mathematics and Computational Research. [The Roofline Model: Visualizing and Optimizing Performance](https://amcr.lbl.gov/departments/computer-science-department/ppan/roofline-performance-model/). Living research overview, accessed September 8, 2026. Supports the relationship between arithmetic intensity, memory traffic, and compute ceilings.

[^19]: LLVM contributors. [Auto-Vectorization in LLVM](https://llvm.org/docs/Vectorizers.html). Living compiler documentation, accessed September 8, 2026. Supports the need to inspect vectorization decisions and generated code.

### Local editorial references

The archive inventory and project connections refer to the local checkout at commit `edcd468`, inspected September 8, 2026. The following files establish the relevant editorial context:

- [Blog archive](/Users/victorbona/Code/Personal/victorbona.blog/app/blog/posts): titles, dates, summaries, and existing coverage.
- [Status Is a Distributed System](/Users/victorbona/Code/Personal/victorbona.blog/app/blog/posts/status-is-a-distributed-system.mdx): recent operational argument and voice.
- [The Hidden Cost of Abstractions](/Users/victorbona/Code/Personal/victorbona.blog/app/blog/posts/the-hidden-cost-of-abstractions-why-clean-code-isnt-always-good-code.mdx): existing performance/architecture argument to advance.
- [Understanding Concurrency and Multithreading](/Users/victorbona/Code/Personal/victorbona.blog/app/blog/posts/understanding-concurrency-and-multithreading-in-modern-software.mdx): existing concurrency introduction and DataTide connection.
- [Streams, Buffers, Backpressure, and Binary Data](/Users/victorbona/Code/Personal/victorbona.blog/app/compendium/content/nodejs-v8-runtime-engineering/streams-buffers-backpressure-and-binary-data.md): existing reference coverage that the pipeline article must extend.
- [Project catalog](/Users/victorbona/Code/Personal/victorbona.blog/app/projects/projects.ts): SQLTemple, DataTide, E-Navigator, and Locus connections.
- [Article catalog](/Users/victorbona/Code/Personal/victorbona.blog/app/articles/articles.ts): Locus whitepaper context and stated measurement scope.
- [Reading-time implementation](/Users/victorbona/Code/Personal/victorbona.blog/app/blog/utils.ts:86): 200-word-per-minute display calculation.
