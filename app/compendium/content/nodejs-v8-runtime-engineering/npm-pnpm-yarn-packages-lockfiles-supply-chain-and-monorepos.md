---
title: "npm pnpm yarn Packages Lockfiles Supply Chain and Monorepos"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/07 npm pnpm yarn Packages Lockfiles Supply Chain and Monorepos.md"
order: 7
---
Purpose: Provide a production field guide to npm, pnpm, Yarn, package metadata, lockfiles, install modes, scripts, audit signals, supply-chain controls, and monorepo workflows for [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering).

# 07 npm pnpm yarn Packages Lockfiles Supply Chain and Monorepos

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [05 Node.js Core Architecture Bootstrapping Bindings and Native Boundaries](/compendium/nodejs-v8-runtime-engineering/node-js-core-architecture-bootstrapping-bindings-and-native-boundaries), [06 Modules CommonJS ESM Resolution Package Exports and TypeScript Interop](/compendium/nodejs-v8-runtime-engineering/modules-commonjs-esm-resolution-package-exports-and-typescript-interop)

## Mental model

The package manager is part of the runtime. It decides which files exist on disk, which lifecycle scripts run, how workspace packages are linked, whether undeclared dependencies are visible, and whether CI installs exactly the graph that developers tested.

Treat package management as a production subsystem with these contracts:

| Contract | File or command | Production consequence |
|---|---|---|
| dependency intent | `package.json` | what the project says it needs |
| dependency realization | lockfile | what CI and deploys should install |
| package manager version | `packageManager` plus Corepack or pinned tool | which resolver and lockfile semantics apply |
| workspace graph | `workspaces`, `pnpm-workspace.yaml`, Yarn config | how local packages link |
| install policy | `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable` | whether drift is allowed |
| lifecycle scripts | `scripts`, package install scripts | code that may execute during install |
| supply-chain policy | audit, provenance, registry config, review | how package risk is managed |

## Package metadata

`package.json` is both manifest and API surface.

| Field | Use | Footgun |
|---|---|---|
| `name` | package identity | renames break imports and workspace protocol references |
| `version` | publish identity | private apps still use it in diagnostics |
| `private` | prevents accidental publish | not a security boundary for local scripts |
| `type` | default module format for `.js` | changes runtime semantics across a whole package |
| `main` | legacy entry point | can disagree with `exports` |
| `exports` | public runtime subpaths | blocks deep imports when added |
| `imports` | private package import maps | only applies inside the package |
| `files` | publish allowlist | missing dist files break consumers |
| `bin` | executable entry points | must point at shipped files with a shebang |
| `scripts` | task interface and lifecycle hooks | install scripts can execute third-party code |
| `dependencies` | runtime dependencies | bloats production and attack surface if overused |
| `devDependencies` | build and test dependencies | needed in CI build stages |
| `peerDependencies` | host-provided compatibility contract | unresolved peers cause runtime mismatch |
| `optionalDependencies` | best-effort platform features | failure may be silent or platform-specific |
| `engines` | supported Node and package manager versions | not always enforced unless configured |
| `packageManager` | expected tool and version | ignored unless the environment honors it |

## Lockfiles

A lockfile records a concrete dependency graph. It is not just an optimization. It is the reproducibility boundary between "the package range allows this" and "this exact artifact was installed".

| Tool | Lockfile | Primary clean install behavior |
|---|---|---|
| npm | `package-lock.json` | `npm ci` requires an existing lockfile and fails if it does not match `package.json` |
| pnpm | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` refuses lockfile changes |
| Yarn | `yarn.lock` | modern Yarn commonly uses `yarn install --immutable` for CI immutability |

npm's lockfile is automatically generated when npm modifies `node_modules` or `package.json`. npm documents it as the exact tree that lets later installs produce identical dependency trees. For applications, commit it. For libraries, commit it for development reproducibility, but remember published consumers resolve their own graph unless you publish a shrinkwrap or bundled artifacts.

## npm

npm is the default package manager distributed with Node.js. The operational distinction is `npm install` versus `npm ci`.

| Command | Use | Behavior |
|---|---|---|
| `npm install` | local dependency changes | may update `package-lock.json` |
| `npm ci` | CI and deploy builds | removes existing `node_modules`, installs from lockfile, fails on manifest mismatch |
| `npm audit` | vulnerability report and remediation planning | queries registry advisory data and reports known vulnerabilities |
| `npm run &lt;script&gt;` | project task execution | runs scripts from `package.json` |
| `npm workspaces` features | monorepo management | auto-symlinks configured workspaces during install |

`npm ci` field rules:

- requires `package-lock.json` or `npm-shrinkwrap.json`;
- fails instead of updating lockfile when manifest and lockfile disagree;
- removes existing `node_modules` before installing;
- installs whole projects, not individual dependencies;
- should use the same flags that shaped the lockfile, such as peer or install strategy options.

Example CI:

```yaml
steps:
  - run: npm ci
  - run: npm run lint
  - run: npm test
  - run: npm run build
```

## pnpm

pnpm uses a content-addressed store and a strict dependency layout by default. That strictness exposes undeclared dependency bugs that npm's flatter layout can hide.

| pnpm concept | Production meaning |
|---|---|
| content-addressed store | package files are reused efficiently |
| virtual store | project `node_modules` links into pnpm-managed structure |
| strict dependency access | packages should only access declared dependencies |
| `pnpm-workspace.yaml` | required root marker for pnpm workspaces |
| `workspace:` protocol | ensures local workspace package resolution where intended |
| `--frozen-lockfile` | CI immutability, default true in many CI environments when lockfile exists |

Example workspace:

```yaml
packages:
  - apps/*
  - packages/*
```

Example dependency:

```json
{
  "dependencies": {
    "@acme/config": "workspace:*"
  }
}
```

pnpm footguns:

- A package that imports undeclared dependencies may work under npm and fail under pnpm.
- Hoisting settings can hide dependency declaration errors.
- `file:` dependencies can make frozen installs fail if local targets changed.
- Shared lockfiles require discipline: a small package change can update a large graph.
- CI must use the same pnpm major as developers.

## Yarn

Yarn has two major operational worlds: Yarn Classic 1.x and Yarn Modern. Modern Yarn supports workspaces deeply and can use Plug'n'Play, `node_modules`, or other linker strategies depending on configuration.

| Yarn area | Production meaning |
|---|---|
| workspaces | local packages are linked as part of one project |
| Plug'n'Play | dependency access is resolved through Yarn metadata rather than conventional `node_modules` |
| constraints | monorepo policy checks in modern Yarn |
| immutable installs | CI should reject lockfile drift |
| zero-installs | cache artifacts may be committed by policy |

Yarn Plug'n'Play changes assumptions:

- code that scans `node_modules` can fail;
- packages with undeclared dependencies fail more reliably;
- tools may need PnP SDK integration;
- native packages and postinstall behavior need explicit verification.

Use Yarn Modern intentionally. Do not mix Yarn Classic install habits with a modern `.yarnrc.yml` project.

## Workspace comparison

| Feature | npm | pnpm | Yarn |
|---|---|---|---|
| Root workspace declaration | `package.json` `workspaces` | `pnpm-workspace.yaml` | `package.json` `workspaces` |
| Local linking | auto symlink during install | workspace linking with strict layout | workspace linking, PnP or linker dependent |
| CI immutable install | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` |
| Undeclared dependency detection | weaker under flat hoisting | strong by default | strong with PnP |
| Lockfile | JSON | YAML | Yarn lock format |
| Best fit | default ecosystem compatibility | strict monorepos and disk efficiency | policy-heavy monorepos and PnP workflows |

## Scripts

npm scripts and compatible package-manager scripts are the task interface of most Node projects. npm documents that `npm run &lt;name&gt;` runs commands from the `scripts` object, and matching `pre&lt;name&gt;` and `post&lt;name&gt;` scripts run around the named script.

```json
{
  "scripts": {
    "prebuild": "node ./scripts/check-env.mjs",
    "build": "tsc -p tsconfig.json",
    "postbuild": "node ./scripts/check-dist.mjs",
    "test": "node --test",
    "lint": "eslint ."
  }
}
```

Script guidance:

| Practice | Reason |
|---|---|
| keep scripts deterministic | CI should run the same task every time |
| avoid hidden network calls in build scripts | reproducibility and supply-chain control |
| prefer `node ./script.mjs` over shell-heavy one-liners | cross-platform behavior |
| pass args after `--` | avoids npm parsing intended script flags |
| document required environment variables | prevents silent local-only success |
| keep lifecycle scripts auditable | install can execute code before tests run |

Footgun: `ignore-scripts` can disable dependency lifecycle scripts during install, but commands explicitly meant to run a script still run the requested script. Know whether your CI disables install scripts and which native packages depend on them.

## Supply-chain risk model

Supply-chain risk in Node.js is not one risk. It is a bundle:

| Risk | Example | Control |
|---|---|---|
| vulnerable package | advisory in transitive dependency | audit, update, patch, replace |
| malicious publish | maintainer account compromised | lockfile review, provenance, allowlists |
| install script execution | package runs code on install | disable scripts where possible, review exceptions |
| dependency confusion | private package name resolved from public registry | scoped registry config, private registry policy |
| typosquatting | similar package name | review new direct dependencies |
| protestware or behavior change | package changes runtime behavior | pin lockfiles, review updates |
| abandoned package | no security fixes | replace or vendor with owner review |
| native addon binary | prebuild runs with process privileges | verify source, signatures, build provenance |
| broad permissions | build has publish or cloud creds | least-privilege CI tokens |

## Audit signals

`npm audit` submits dependency information to the configured registry and reports known vulnerabilities with severity and remediation. Audit output is an input to triage, not an automatic patch policy.

Triage table:

| Audit result | Production action |
|---|---|
| critical reachable runtime path | patch immediately or remove package |
| high in server request path | patch quickly and add regression coverage |
| vulnerability in dev-only tool | assess CI exposure and build artifact exposure |
| no fix available | reduce reachability, patch-package, fork, replace, or isolate |
| breaking fix | evaluate exploitability and schedule upgrade |
| noisy transitive advisory | identify parent package and update the parent |

Avoid blind `audit fix --force` in production branches. It can change major versions and rewrite a large graph without enough behavioral review.

## Lockfile review

Review lockfile changes like code:

- Did a direct dependency change?
- Did the registry or resolved URL change?
- Did integrity metadata change unexpectedly?
- Did package count explode?
- Did a native package enter the graph?
- Did install scripts enter the graph?
- Did a workspace dependency resolve to the registry instead of local workspace?
- Did the package manager version change the lockfile format?

Minimal lockfile review commands:

```bash
git diff -- package.json package-lock.json pnpm-lock.yaml yarn.lock
npm audit --audit-level=high
npm ls --all
```

For pnpm:

```bash
pnpm install --frozen-lockfile
pnpm list --recursive --depth 10
```

For Yarn:

```bash
yarn install --immutable
yarn workspaces list
```

## Monorepo production patterns

### Good workspace contract

```text
repo/
  package.json
  pnpm-workspace.yaml
  apps/
    api/
      package.json
  packages/
    config/
      package.json
    logger/
      package.json
```

Root `package.json`:

```json
{
  "private": true,
  "packageManager": "pnpm@11.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "typescript": "5.9.0"
  }
}
```

Package dependency:

```json
{
  "name": "@acme/api",
  "dependencies": {
    "@acme/config": "workspace:*",
    "@acme/logger": "workspace:*"
  }
}
```

### Monorepo rules

- Every package declares what it imports.
- Cross-package imports use package names, not relative paths into siblings.
- Internal packages still define `exports`.
- Build order follows dependency order.
- CI can run filtered tasks, but graph validation and lockfile validation stay global.
- Release tooling verifies that published packages contain built files and declarations.
- Root dev dependencies are for root tooling, not hidden runtime dependencies.

## Package manager drift

Symptoms:

| Symptom | Likely drift |
|---|---|
| CI lockfile changes after install | package manager version differs |
| local tests pass, Docker fails | lifecycle scripts, native build, or OS dependencies differ |
| pnpm fails, npm passes | undeclared dependency or hoisting assumption |
| Yarn PnP fails, node_modules passes | tool assumes filesystem package layout |
| package imports registry version instead of workspace | missing `workspace:` or workspace declaration |

Controls:

- Set `packageManager` in root `package.json`.
- Enable Corepack or install the expected package manager version explicitly.
- Use clean installs in CI.
- Reject lockfile changes in validation jobs.
- Keep one package manager per repository unless migration is active.

## Troubleshooting

### `npm ci` fails with lockfile mismatch

Meaning: `package.json` and the lockfile disagree. `npm ci` is doing its job.

Fix:

1. Run the package manager locally with the intended version.
2. Commit the resulting manifest and lockfile together.
3. Re-run `npm ci` from a clean checkout.
4. Check whether install flags changed the lockfile shape.

### Package works locally but not in CI

Likely causes:

- undeclared dependency exists at root locally;
- stale `node_modules`;
- different package manager major;
- install scripts disabled in CI;
- native prebuild unavailable on CI architecture;
- environment variable present locally only.

Fix:

1. Delete `node_modules`.
2. Install from lockfile only.
3. Run with CI environment variables.
4. Check direct dependency declarations.
5. Reproduce in the production image.

### Workspace package resolves from registry

Likely causes:

- package not included in workspace patterns;
- name mismatch in child package;
- range does not match local version;
- missing `workspace:` protocol where strict local resolution is required.

Fix:

1. List workspaces with the package manager.
2. Confirm child `package.json` `name`.
3. Use `workspace:*` or an exact workspace protocol policy.
4. Reinstall and inspect lockfile resolution.

### Native package fails during install

Likely causes:

- missing Python, compiler, make, or platform headers;
- no prebuild for current Node ABI, libc, OS, or CPU;
- install scripts disabled;
- package tried to download a binary but network is blocked.

Fix:

1. Prefer packages with N-API prebuilds.
2. Build in a dedicated build stage.
3. Cache package-manager store and native artifacts intentionally.
4. Verify runtime shared libraries in the final image.
5. Avoid compiling in production startup.

## Production install policies

| Environment | Policy |
|---|---|
| developer laptop | normal install allowed, lockfile changes reviewed |
| CI validation | immutable install, tests, lint, build |
| Docker build | immutable install, deterministic package manager version |
| production runtime image | no package install at startup |
| emergency patch | lockfile diff reviewed, direct dependency reason recorded |
| monorepo release | packed artifacts tested before publish |

## Golden path commands

npm:

```bash
npm ci
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

pnpm:

```bash
pnpm install --frozen-lockfile
pnpm -r lint
pnpm -r test
pnpm -r build
```

Yarn:

```bash
yarn install --immutable
yarn workspaces foreach -A run lint
yarn workspaces foreach -A run test
yarn workspaces foreach -A run build
```

## Field rules

- Commit the lockfile for applications and monorepos.
- Pin the package manager version.
- Use immutable installs in CI.
- Never install dependencies during production startup.
- Review lifecycle scripts for new packages.
- Treat native packages as privileged code.
- Do not mix lockfiles from multiple package managers as a normal state.
- Keep dependency updates small enough to review.
- Prefer workspace protocol for internal packages when supported.
- Audit is a signal, not a substitute for reachability analysis.
- Validate package contents with a pack or publish dry run.
- Make dependency policy boring and automatic.

## Official docs checked

- npm `npm ci`: https://docs.npmjs.com/cli/commands/npm-ci/
- npm `package-lock.json`: https://docs.npmjs.com/cli/v8/configuring-npm/package-lock-json/
- npm workspaces: https://docs.npmjs.com/cli/v8/using-npm/workspaces/
- npm scripts: https://docs.npmjs.com/cli/using-npm/scripts/
- npm audit reports: https://docs.npmjs.com/about-audit-reports/
- pnpm install: https://pnpm.io/cli/install
- pnpm workspaces: https://pnpm.io/workspaces
- Yarn workspaces: https://yarnpkg.com/features/workspaces
- Yarn migration overview: https://yarnpkg.com/migration/overview
