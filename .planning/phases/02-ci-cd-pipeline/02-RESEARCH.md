# Phase 2: CI/CD Pipeline - Research

**Researched:** 2026-01-27
**Domain:** GitHub Actions, Docker multi-architecture builds, GHCR
**Confidence:** HIGH

## Summary

This research covers automating Docker image builds with GitHub Actions and pushing to GitHub Container Registry (GHCR). The ecosystem is mature with well-documented official Docker actions that handle multi-architecture builds through BuildKit and QEMU emulation.

The standard approach uses four official Docker actions in sequence: `setup-qemu-action` for cross-architecture emulation, `setup-buildx-action` for advanced BuildKit features, `login-action` for registry authentication, and `build-push-action` for the actual build and push. GitHub's native `GITHUB_TOKEN` provides GHCR authentication without needing personal access tokens.

Key decisions from CONTEXT.md (trigger on main only, short SHA + latest tags, minimal caching, atomic multi-arch) align well with standard practices and simplify the implementation.

**Primary recommendation:** Use `docker/build-push-action@v6` with `docker/metadata-action@v5` for automatic tagging, `type=gha` caching, and explicit `context: .` to avoid build context issues.

## Standard Stack

The established libraries/tools for GitHub Actions Docker CI/CD:

### Core
| Action | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| docker/setup-qemu-action | v3 | Cross-architecture emulation | Required for arm64 builds on amd64 runners |
| docker/setup-buildx-action | v3 | Advanced BuildKit builder | Required for multi-platform builds |
| docker/login-action | v3 | Registry authentication | Standard Docker authentication |
| docker/build-push-action | v6 | Build and push images | Full BuildKit feature support |
| docker/metadata-action | v5 | Tag/label generation | Automatic SHA and semver tagging |

### Supporting
| Action | Version | Purpose | When to Use |
|--------|---------|---------|-------------|
| actions/checkout | v5 | Clone repository | Always needed for build context |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| metadata-action | Manual tags | metadata-action is simpler for SHA tagging |
| type=gha cache | Registry cache | type=gha is native to GitHub, simpler setup |
| QEMU emulation | Native ARM runners | ARM runners faster but more complex/costly |

**Workflow file:**
`.github/workflows/build.yml`

## Architecture Patterns

### Recommended Workflow Structure
```yaml
name: Build and Push

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - '.planning/**'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout
      # 2. Setup QEMU
      # 3. Setup Buildx
      # 4. Login to GHCR
      # 5. Extract metadata (tags)
      # 6. Build and push
```

### Pattern 1: Multi-Architecture Build with QEMU
**What:** Build linux/amd64 and linux/arm64 in single job using QEMU emulation
**When to use:** Standard multi-arch builds without native ARM runners
**Example:**
```yaml
# Source: https://docs.docker.com/build/ci/github-actions/multi-platform/
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
```

### Pattern 2: Automatic Tagging with metadata-action
**What:** Generate tags from git context (SHA, branch, etc.)
**When to use:** For consistent, automated tagging strategy
**Example:**
```yaml
# Source: https://github.com/docker/metadata-action
- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=sha,prefix=
      type=raw,value=latest,enable={{is_default_branch}}
```

### Pattern 3: GHCR Authentication with GITHUB_TOKEN
**What:** Authenticate to GHCR using workflow-provided token
**When to use:** Always for GHCR (no PAT needed)
**Example:**
```yaml
# Source: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

### Pattern 4: GitHub Actions Cache for BuildKit
**What:** Use GitHub's cache service for Docker layer caching
**When to use:** To speed up subsequent builds
**Example:**
```yaml
# Source: https://docs.docker.com/build/ci/github-actions/cache/
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Anti-Patterns to Avoid
- **Omitting `context: .`:** Default Git context can cause file discovery issues; always specify explicitly
- **Using `push: true` without branch check:** Can accidentally push from PRs; use conditional or paths filter
- **Skipping setup-buildx-action:** Required for multi-platform builds and attestations
- **Using deprecated cache API v1:** Must use Buildx >= v0.21.0 (April 2025 deadline passed)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA tagging | Manual `git rev-parse` | metadata-action | Handles edge cases, formats correctly |
| Multi-arch manifests | Manual `docker manifest` | build-push-action with platforms | Atomic push, single command |
| Registry login | Manual `docker login` | login-action | Secure credential handling |
| Cache management | Custom cache steps | type=gha cache | Native GitHub integration |
| QEMU setup | Manual QEMU install | setup-qemu-action | Handles all architectures correctly |

**Key insight:** Docker's official actions are designed to work together and handle edge cases that manual approaches miss.

## Common Pitfalls

### Pitfall 1: Build Context Not Found
**What goes wrong:** Build fails with "file not found" errors despite files existing
**Why it happens:** Default behavior uses Git context which may not include all files
**How to avoid:** Always specify `context: .` explicitly in build-push-action
**Warning signs:** Errors mentioning missing files that exist in repo

### Pitfall 2: GHCR Permission Denied
**What goes wrong:** Push fails with 403 or permission denied
**Why it happens:** Package not linked to repository, or GITHUB_TOKEN lacks write permission
**How to avoid:**
1. Include `org.opencontainers.image.source` label in Dockerfile (already present)
2. Set `permissions: packages: write` in workflow
3. For first push, ensure package inherits repo permissions
**Warning signs:** 403 errors, "permission denied" messages

### Pitfall 3: Cache Scope Conflicts
**What goes wrong:** Cache from one build overwrites another's cache
**Why it happens:** Default cache scope is "buildkit" for all builds
**How to avoid:** For multiple workflows, use `scope` parameter in cache-to
**Warning signs:** Unexpected cache misses, builds slower than expected

### Pitfall 4: Multi-Arch Build Timeout
**What goes wrong:** ARM64 build times out on GitHub Actions
**Why it happens:** QEMU emulation is 5-20x slower than native
**How to avoid:**
1. Optimize Dockerfile to minimize compilation steps
2. Use layer caching effectively
3. Consider matrix strategy with native runners for complex builds
**Warning signs:** ARM64 jobs taking 10+ minutes when AMD64 takes 2 minutes

### Pitfall 5: PR Builds Pushing Images
**What goes wrong:** Images pushed for every PR, cluttering registry
**Why it happens:** Missing branch/event check on push
**How to avoid:** Use `on: push: branches: [main]` or conditional `push: ${{ github.event_name != 'pull_request' }}`
**Warning signs:** Many unexpected image tags in registry

## Code Examples

Verified patterns from official sources:

### Complete Workflow Template
```yaml
# Source: https://docs.docker.com/build/ci/github-actions/multi-platform/
# Source: https://github.com/docker/build-push-action
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - '.planning/**'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Tag Output Format
With the metadata-action configuration above:
- SHA tag: `abc1234` (short 7-character SHA)
- Latest tag: `latest` (only on main branch)

Both tags point to a single multi-arch manifest containing linux/amd64 and linux/arm64 images.

### Cache Statistics (Optional)
```yaml
# Source: https://docs.docker.com/build/ci/github-actions/cache/
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    # ... other options
    cache-from: type=gha
    cache-to: type=gha,mode=max
  # Build summary in job logs shows cache hit/miss
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| docker/build-push-action@v5 | v6 | 2024 | Job summaries, build checks, improved attestations |
| GitHub Cache API v1 | API v2 | April 2025 | v1 shut down, must use Buildx >= v0.21.0 |
| Manual `docker manifest` | buildx multi-platform | 2020+ | Single command, atomic push |
| PAT for GHCR | GITHUB_TOKEN | Long-standing | Simpler, more secure |

**Deprecated/outdated:**
- **Cache API v1:** Shut down April 15, 2025; use current action versions
- **docker/build-push-action@v5:** Still works but v6 has better features
- **Manual QEMU installation:** Use setup-qemu-action@v3

## Open Questions

Things that couldn't be fully resolved:

1. **Cache scope for multi-platform**
   - What we know: Single scope works, but separate scopes per platform possible
   - What's unclear: Whether separate scopes improve hit rates for this use case
   - Recommendation: Start with default scope, adjust if issues arise

2. **QEMU performance for Next.js**
   - What we know: QEMU is 5-20x slower for compilation
   - What's unclear: Exact impact on Next.js standalone build
   - Recommendation: Monitor ARM64 build times; consider matrix strategy if > 10 min

## Sources

### Primary (HIGH confidence)
- [Docker Build CI/CD with GitHub Actions](https://docs.docker.com/build/ci/github-actions/) - Official Docker documentation
- [Multi-platform image with GitHub Actions](https://docs.docker.com/build/ci/github-actions/multi-platform/) - Multi-arch workflow patterns
- [Cache management with GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/) - Caching strategies
- [docker/build-push-action](https://github.com/docker/build-push-action) - Action repository and docs
- [docker/metadata-action](https://github.com/docker/metadata-action) - Tagging configuration
- [Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) - GHCR authentication
- [Workflow syntax for GitHub Actions](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) - paths-ignore, permissions

### Secondary (MEDIUM confidence)
- [GitHub Actions cache backend](https://docs.docker.com/build/cache/backends/gha/) - Cache API details
- [Docker multi-arch blog](https://www.docker.com/blog/multi-arch-build-and-images-the-simple-way/) - Best practices

### Tertiary (LOW confidence)
- Community discussions on cache scope optimization - anecdotal

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Docker actions, well-documented
- Architecture: HIGH - Official Docker documentation with examples
- Pitfalls: HIGH - Well-known issues documented in official sources

**Research date:** 2026-01-27
**Valid until:** 2026-03-27 (60 days - stable, mature ecosystem)
