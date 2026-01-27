# Phase 2: CI/CD Pipeline - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Automate Docker image builds and push to GHCR via GitHub Actions. Delivers multi-architecture support (amd64, arm64), automatic tagging, and push to `ghcr.io/vicotrbb/victorbona.blog`. Does not include deployment automation (that's Phase 3) or release management workflows.

</domain>

<decisions>
## Implementation Decisions

### Trigger conditions
- Build and push only on main branch pushes (not PRs)
- Include workflow_dispatch for manual/ad-hoc builds
- No tag-based triggers — tags are markers, not build triggers
- Skip builds for non-code changes: docs/, README.md, .planning/, etc.

### Tagging strategy
- Tag with short git SHA (e.g., abc1234) plus `latest`
- Every successful main build updates the `:latest` tag
- Keep all image tags indefinitely — no automated cleanup
- Single manifest for multi-arch (one tag works on both amd64 and arm64)

### Build caching
- Use GitHub Actions cache with BuildKit
- Docker layer caching handles npm dependencies (no separate npm cache step)
- Prefer fresh builds over aggressive caching — minimal caching, always current
- Log cache hit/miss statistics for debugging

### Failure handling
- GitHub-native notifications only (check marks/X on commits)
- No automatic retries — fail fast, re-run manually if needed
- Image only — no SBOM or attestation (overkill for a blog)
- All architectures must succeed or nothing is pushed (atomic multi-arch)

### Claude's Discretion
- Specific cache key patterns
- Workflow job naming and structure
- QEMU setup details for multi-arch
- Exact path filter patterns

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants a straightforward, reliable workflow without bells and whistles.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ci-cd-pipeline*
*Context gathered: 2026-01-27*
