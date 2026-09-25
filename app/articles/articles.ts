export interface Article {
  slug: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  journal?: string;
  doi?: string;
  tags: string[];
  type: "paper" | "article";
  status: "published" | "preprint" | "draft" | "independently published";
  pdfUrl?: string;
  citationKey?: string;
}

export const articles: Article[] = [
  {
    slug: "redis-jetstream-reliability",
    title:
      "An Empirical Evaluation of Message Delivery Reliability and Recovery Characteristics in Redis Streams and NATS JetStream",
    abstract:
      "Consumer-progress acknowledgments in Redis Streams and NATS JetStream have different persistence implications even under always-synchronize append policies. We evaluate that distinction alongside recovery timing, consumer concurrency and publication cost using single-replica deployments on a two-node Kubernetes homelab. The study compares Redis 7.4.2/8.10.2 and NATS Server 2.10.24/2.15.0, preserving an original campaign and adding three deployments with fresh broker processes and stores, matched publication durations, CPU sensitivity and storage diagnostics. All 240 active follow-up recovery episodes completed, including live, deliberately unacknowledging consumers; twelve plain Redis read controls remained pending. Receipt timing followed residual eligibility plus policy-dependent excess. Redis's integrated CLAIM path exhibited greater excess than the tested explicit reclamation loop in this quiet, one-message workload. Sixteen consumers increased current memory/periodic drain throughput by 10.43–14.49 times across deployment-specific comparisons, while cycle p99 increased and driver capacity affected rates. At sixteen publishers, current periodic/memory publication ratios averaged 0.8257 for Redis and 0.8207 for JetStream. Ten of 72 planned always-profile publication trials failed (13.9%), including four warm-up failures, compared with one of 72 periodic trials and none of 72 memory trials. Timed failures returned five-second client timeouts with unknown confirmation outcomes. A compact analytical model and selected Lean-checked statements delimit the claims; full proofs and detailed results are included in the appendices. The licensed artifact retains timings, failures, configurations and reproducible analysis. These observations characterize specified policies and acknowledgment costs; they do not establish equal durability contracts, power-loss survival or hardware-independent rankings.",
    authors: ["Victor Bona"],
    publishedAt: "2026-09-25",
    journal: "Zenodo",
    doi: "10.5281/zenodo.22950140",
    tags: [
      "Redis Streams",
      "NATS JetStream",
      "Message Recovery",
      "Durability",
      "Empirical Evaluation",
      "Kubernetes",
      "Lean 4",
    ],
    type: "paper",
    status: "preprint",
    pdfUrl: "/papers/redis-jetstream-reliability.pdf",
    citationKey: "bona2026redisjetstream",
  },
  {
    slug: "nidus-whitepaper",
    title:
      "Nidus: Explicit Application Composition for Rust Backend Services",
    abstract:
      "A backend application needs a composition model as well as a request handler. Its components must declare dependencies, initialize shared resources, expose routes, and coordinate operational behavior. Nidus organizes these responsibilities through explicit modules, typed providers, and controller metadata, while retaining Axum routing, Tower middleware, and Tokio execution. This paper explains the design through three separate stages: generated Rust declarations, application construction, and request execution. It describes the guarantees provided at each stage, follows a small feature from module declaration to handler invocation, and identifies the costs and limits of the abstraction. The implementation uses a runtime container keyed by Rust types and validates module structure during bootstrap. Module exports describe composition contracts; they do not enforce runtime access isolation. The account is anchored to Nidus 1.0.17 and supported by source inspection and focused executable checks.",
    authors: ["Victor Bona"],
    publishedAt: "2026-09-08",
    tags: [
      "Rust",
      "Application Architecture",
      "Dependency Injection",
      "Axum",
      "Tower",
    ],
    type: "paper",
    status: "independently published",
    pdfUrl: "/papers/nidus-whitepaper.pdf",
    citationKey: "bona2026nidus",
  },
  {
    slug: "locus-whitepaper",
    title:
      "Locus: Owner-Drained Chunk Mailboxes for KV-Block Recycling in CPU LLM Inference",
    abstract:
      "A technical white paper on Locus, a domain memory pool for CPU LLM serving whose remote-free path is a per-worker lock-free chunk mailbox: a finished request's KV blocks are returned as one atomic push, and the pool owner drains every mailbox off the allocation hot path, so freeing never contends on a shared queue and the design carries zero tuning parameters. Developed under a falsification-first methodology, it is evaluated on LOCUS-EVAL v1, a frozen four-workload suite of deterministic serving-shaped KV traces run against jemalloc, mimalloc, and system malloc on Apple Silicon, where the mailbox ranks first on every workload. A self-critical touch-parity audit corrects the headline: at a one-byte-per-block parity the advantage is 1.6x to 2.7x over mimalloc on the three trace workloads and compresses to about 1.15x over system malloc once full KV writes dominate, with a transient burst-cancellation footprint of up to 1.5x the theoretical peak. The scope is deliberately narrow (a single macOS host, synthetic traces, an allocator-level measurement), with NUMA locality and end-to-end serving integration stated as future work.",
    authors: ["Victor Bona"],
    publishedAt: "2026-07-06",
    tags: [
      "Rust",
      "LLM Inference",
      "KV Cache",
      "Memory Pool",
      "Allocators",
      "Benchmarks",
    ],
    type: "paper",
    status: "independently published",
    pdfUrl: "/papers/locus-whitepaper.pdf",
    citationKey: "bona2026locus",
  },
  {
    slug: "purple-wolf-whitepaper",
    title:
      "Purple Wolf: A Technical White Paper on a Low-Latency Traefik Web Application Firewall and Audit Relay",
    abstract:
      "A technical white paper documenting Purple Wolf's Rust workspace architecture, request normalization path, detector groups, policy semantics, Traefik http-wasm adapter, audit relay protocol, release surfaces, related WAF systems, and committed benchmark results against the Coraza http-wasm Traefik plugin.",
    authors: ["Victor Bona"],
    publishedAt: "2026-06-07",
    tags: ["Security", "WAF", "Traefik", "WebAssembly", "Rust", "Benchmarks"],
    type: "paper",
    status: "independently published",
    pdfUrl: "/papers/purple-wolf-whitepaper.pdf",
    citationKey: "bona2026purplewolf",
  },
  {
    slug: "the-missing-http-verb-strut",
    title: "The Missing HTTP Verb: STRUT",
    abstract:
      "A position paper proposing STRUT, an idempotent but unsafe HTTP method for server-driven, minimal-input resource creation. The paper defines candidate semantics, compares the method with POST plus Idempotency-Key, conditional PUT, WebDAV, and Prefer, and discusses security, caching, intermediaries, browser behavior, and deployment.",
    authors: ["Victor Bona"],
    publishedAt: "2026-06-07",
    tags: ["HTTP", "REST", "API Design", "Web Standards", "Idempotency"],
    type: "paper",
    status: "independently published",
    pdfUrl: "/papers/the-missing-http-verb-strut.pdf",
    citationKey: "bona2026strut",
  },
  // {
  //   slug: "performance-optimization-techniques",
  //   title: "Advanced Performance Optimization Techniques in Web Applications",
  //   abstract: "A comprehensive study of performance optimization strategies for modern web applications, including lazy loading, code splitting, and runtime optimization techniques.",
  //   authors: ["Victor Bona"],
  //   publishedAt: "2023-11-22",
  //   journal: "Journal of Web Engineering",
  //   doi: "10.1000/182",
  //   tags: ["performance", "web development", "optimization", "javascript"],
  //   type: "paper",
  //   status: "published",
  //   citationKey: "bona2023performance",
  // },
];

export function getArticles(): Article[] {
  return articles.sort((a, b) => {
    if (new Date(a.publishedAt) > new Date(b.publishedAt)) {
      return -1;
    }
    return 1;
  });
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesByTag(tag: string): Article[] {
  return articles.filter((article) =>
    article.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getPublishedArticles(): Article[] {
  return articles.filter((article) => article.status === "published");
}
