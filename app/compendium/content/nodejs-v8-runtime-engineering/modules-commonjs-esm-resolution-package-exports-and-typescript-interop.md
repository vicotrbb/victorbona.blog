---
title: "Modules CommonJS ESM Resolution Package Exports and TypeScript Interop"
collection: "nodejs-v8-runtime-engineering"
sourcePath: "Knowledge base/nodejs-v8-runtime-engineering/06 Modules CommonJS ESM Resolution Package Exports and TypeScript Interop.md"
order: 6
---
Purpose: Explain how Node.js resolves CommonJS, ES modules, package exports, conditional entry points, and TypeScript execution boundaries so module graphs in [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering) remain predictable in development, CI, bundles, and production.

# 06 Modules CommonJS ESM Resolution Package Exports and TypeScript Interop

Related: [Node.js V8 Runtime Engineering](/compendium/nodejs-v8-runtime-engineering/node-js-v8-runtime-engineering), [05 Node.js Core Architecture Bootstrapping Bindings and Native Boundaries](/compendium/nodejs-v8-runtime-engineering/node-js-core-architecture-bootstrapping-bindings-and-native-boundaries), [07 npm pnpm yarn Packages Lockfiles Supply Chain and Monorepos](/compendium/nodejs-v8-runtime-engineering/npm-pnpm-yarn-packages-lockfiles-supply-chain-and-monorepos)

## Why this matters

Most Node.js production failures that look like "module not found", "default is not a function", "cannot use import outside a module", or "works locally but fails in CI" come from one of five places:

1. CommonJS and ESM use different loaders.
2. `package.json` fields change how `.js` is interpreted.
3. Package `exports` hides paths that older code imported directly.
4. TypeScript compiled output does not match runtime module rules.
5. The package manager layout exposes undeclared dependencies locally but not elsewhere.

The fix is to make the module contract explicit. Decide which files are CommonJS, which files are ESM, which package subpaths are public, which conditions are supported, and whether TypeScript is executed directly or compiled first.

## Loader model

Node.js has two module systems:

| System | Syntax | Main loader behavior | Common file markers |
|---|---|---|---|
| CommonJS | `require()`, `module.exports`, `exports` | synchronous loading, wrapper function, mutable exports object | `.cjs`, `.js` under `"type": "commonjs"` |
| ECMAScript modules | `import`, `export`, `import()` | URL-based resolution, async graph support, live bindings | `.mjs`, `.js` under `"type": "module"` |

Node treats each file as a separate module. The nearest parent `package.json` with a `"type"` field controls how `.js` files are interpreted. Explicit extensions override the package default:

| Extension | Runtime format |
|---|---|
| `.cjs` | CommonJS |
| `.mjs` | ESM |
| `.js` | depends on nearest `package.json` `"type"` |
| `.json` | JSON module behavior depends on import style and Node version |
| `.node` | native addon |

Rule of thumb: package authors should use `"type"` plus explicit `.cjs` or `.mjs` for exceptions. Application authors should avoid mixing formats casually inside one directory.

## CommonJS field manual

CommonJS is the original Node.js package format. It is still common in server code, CLIs, test tooling, build tools, and older npm packages.

```js
// math.cjs
function add(a, b) {
  return a + b;
}

module.exports = { add };
```

```js
// app.cjs
const { add } = require('./math.cjs');

console.log(add(2, 3));
```

Properties:

| Property | Operational consequence |
|---|---|
| Loads synchronously | good for startup config, bad for async initialization |
| Exports object is mutable | late mutation can surprise consumers |
| `__dirname` and `__filename` exist | convenient for filesystem code |
| Can require JSON and native addons | legacy-friendly |
| Can use dynamic `require(expr)` | hard for bundlers and static analysis |
| Caches by resolved filename | symlinks and real paths matter |

CommonJS footguns:

- Reassigning `exports` does not replace `module.exports`.
- Circular dependencies expose partially initialized exports.
- Dynamic require paths are invisible to bundlers and policy tools.
- Deep imports into another package bypass that package's public API.
- Requiring ESM from CommonJS has constraints; use dynamic `import()` when needed.

## ESM field manual

ESM is the JavaScript standard module format. Node fully supports ESM and provides interoperability with CommonJS, but the semantics are not just CommonJS with different syntax.

```js
// math.mjs
export function add(a, b) {
  return a + b;
}
```

```js
// app.mjs
import { add } from './math.mjs';

console.log(add(2, 3));
```

Properties:

| Property | Operational consequence |
|---|---|
| Static `import` is analyzable | better for tooling and tree-shaking |
| Bindings are live | exports update as values change |
| Uses URL-like resolution | spaces and special characters are encoded |
| No CommonJS wrapper variables | use `import.meta.url` instead of `__dirname` |
| Top-level await is available | startup can become async |
| File extensions are required for relative imports | `import './x.js'`, not `import './x'` |

ESM footguns:

- Missing file extensions fail at runtime.
- `import` paths are not TypeScript path aliases unless a loader or build step implements them.
- Top-level await can delay the whole dependency graph.
- Importing CommonJS exposes a default-like namespace shape that may not match TypeScript assumptions.
- A package can expose different code for `import` and `require`.

## Interop recipes

### Use CommonJS from ESM

```js
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const legacy = require('./legacy.cjs');

export const version = pkg.version;
export const run = legacy.run;
```

Use this for JSON, native addons, or legacy CommonJS packages when native ESM import is not the best fit.

### Use ESM from CommonJS

```js
async function main() {
  const mod = await import('./service.mjs');
  await mod.start();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

Use dynamic `import()` because ESM loading can be asynchronous.

### Replace `__dirname` in ESM

```js
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const schemaPath = join(__dirname, 'schema.sql');
```

Do not convert `import.meta.url` with string slicing. Use `node:url` and `node:path`.

## Resolution essentials

Relative and absolute specifiers:

| Specifier | Example | Meaning |
|---|---|---|
| relative | `./lib/server.js` | resolved from importing file |
| absolute path | `/srv/app/lib.js` | resolved by filesystem path |
| bare package | `fastify` | resolved through package rules and `node_modules` |
| built-in | `node:fs` | resolved to Node built-in |
| package subpath | `pkg/subpath` | allowed only if package exposes it or legacy rules permit |

Resolution production rules:

- Use `node:` for built-ins in new code.
- Include file extensions in ESM relative imports.
- Do not rely on transitive dependencies being physically reachable.
- Do not import `pkg/dist/private.js` unless the package documents that path.
- Keep `exports`, emitted files, and type declarations synchronized.
- Test the published tarball, not only the repository checkout.

## Package `exports`

The `exports` field defines public entry points for a package. Once present, it can prevent consumers from importing files that are not exported. This is a feature: it turns a package's filesystem into an API surface with access control.

```json
{
  "name": "@example/queue",
  "type": "module",
  "main": "./dist/index.cjs",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./testing": {
      "import": "./dist/testing.js",
      "require": "./dist/testing.cjs"
    },
    "./package.json": "./package.json"
  }
}
```

Design guidance:

| Export shape | Use when | Risk |
|---|---|---|
| `"."` only | package has one public API | consumers may ask for internals |
| named subpaths | package has stable secondary APIs | every subpath becomes support burden |
| patterns | many generated files are public | easy to expose too much |
| conditional exports | CJS, ESM, native, browser, or development variants | condition order and semantic drift |
| exporting `package.json` | tooling needs metadata | leaks package metadata intentionally |

## Conditional exports

Node supports conditional exports for both CommonJS and ESM imports. Conditions are matched in object order, from more specific to less specific.

Common condition names:

| Condition | Meaning |
|---|---|
| `import` | selected when loaded via ESM import |
| `require` | selected when loaded via CommonJS require |
| `node` | selected in Node.js |
| `node-addons` | selected when native addons are allowed |
| `default` | fallback for unknown environments |

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "node-addons": "./dist/native.mjs",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    }
  }
}
```

Footgun: TypeScript may understand a `types` condition depending on compiler settings, but Node itself is resolving runtime files. Do not assume types and runtime conditions are the same mechanism.

## Dual package hazard

A dual package exposes both CommonJS and ESM. The hazard appears when `require('pkg')` and `import 'pkg'` load separate module instances. Singleton state, caches, metrics, symbols, and class identity can split.

| Symptom | Cause | Fix |
|---|---|---|
| `instanceof` fails across import styles | two copies of class definition | share one implementation layer |
| cache is empty in one path | CJS and ESM maintain separate state | move state to one file or external store |
| metrics double count | both entry points initialize instrumentation | centralize side effects |
| config loads twice | both entry points run startup code | make entry points thin |

Safer dual package pattern:

```text
dist/
  index.cjs       CommonJS wrapper
  index.mjs       ESM wrapper
  core.cjs        single implementation for CommonJS-first package
```

Or:

```text
dist/
  index.mjs       primary implementation
  index.cjs       small wrapper that dynamic-imports ESM where acceptable
```

Do not maintain two independent implementations unless you can test every public behavior twice.

## TypeScript interop

Node's current TypeScript documentation matters because runtime support has changed over time. Node can strip erasable TypeScript syntax in supported modes, but it does not act like a full TypeScript compiler. Node does not read `tsconfig.json` and does not transform features that need code generation, such as enums with runtime output, parameter properties, decorators, namespaces with runtime code, or path aliases.

Node documents that TypeScript files follow module-system rules similar to JavaScript:

| File | Module system |
|---|---|
| `.ts` | determined like `.js`, including nearest package `"type"` |
| `.mts` | ESM, like `.mjs` |
| `.cts` | CommonJS, like `.cjs` |
| `.tsx` | unsupported by Node's built-in TypeScript handling |

Compiler options for Node-style module output commonly include:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "verbatimModuleSyntax": true,
    "rewriteRelativeImportExtensions": true,
    "strict": true
  }
}
```

Use a real build step when:

- using JSX or TSX;
- using decorators before native JavaScript support is acceptable;
- using path aliases;
- targeting older JavaScript;
- publishing packages with declaration files;
- bundling assets;
- running minification or dead-code elimination.

## Type declarations and exports

Published packages need runtime files and type declarations to agree.

```json
{
  "name": "@example/config",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schema": {
      "types": "./dist/schema.d.ts",
      "import": "./dist/schema.js"
    }
  }
}
```

Checklist:

- Every exported runtime subpath has a matching declaration path.
- Declarations describe the actual condition consumers use.
- `files` includes all exported files.
- `npm pack --dry-run` shows the expected tarball.
- Tests import from the packed package, not from `src`.

## Package boundary examples

### Application package using ESM

```json
{
  "name": "api",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node ./dist/server.js",
    "check": "tsc --noEmit",
    "test": "node --test"
  },
  "dependencies": {
    "fastify": "5.0.0"
  },
  "devDependencies": {
    "typescript": "5.9.0"
  }
}
```

### Library package with explicit CJS escape hatch

```json
{
  "name": "@example/library",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./cjs": "./dist/index.cjs"
  }
}
```

This is simpler than making the same subpath mean different things under `import` and `require`.

## Monorepo module boundaries

In monorepos, workspace links make local packages feel like source folders. Production sees installed packages. Keep the boundary honest:

- Import workspace packages by package name, not by `../../other-package/src`.
- Build packages before consumers run tests that import emitted files.
- Keep `exports` strict even for internal packages.
- Avoid undeclared dependencies that happen to exist at the root.
- Run at least one CI job from a clean install.
- Use package-manager filters only when lockfile and graph validation still run globally.

## Troubleshooting

### `ERR_MODULE_NOT_FOUND`

Likely causes:

- missing extension in ESM relative import;
- file emitted to a different path than source import expects;
- package `exports` does not expose the subpath;
- TypeScript path alias compiled unchanged;
- package manager did not install undeclared dependency.

Actions:

1. Print the exact import specifier.
2. Resolve from the importing file, not from process cwd.
3. Check emitted `dist`, not `src`.
4. Check the target package `exports`.
5. Run the same command after deleting `node_modules` and reinstalling from lockfile.

### `Cannot use import statement outside a module`

Likely causes:

- `.js` file is under `"type": "commonjs"` or no `"type": "module"`;
- test runner or transpiler emitted ESM into a CJS package;
- package manager executed source directly rather than built output.

Fixes:

- add `"type": "module"` at the intended package boundary;
- rename the file to `.mjs`;
- compile to CommonJS intentionally;
- align test command with runtime format.

### `require is not defined in ES module scope`

Fixes:

- use `import`;
- use `createRequire(import.meta.url)` for CommonJS-only dependencies;
- move the file to `.cjs` if it is intentionally CommonJS.

### Types pass but runtime fails

Likely causes:

- `paths` alias exists only in TypeScript;
- `types` points at files that do not match runtime exports;
- package `exports` blocks runtime subpath;
- CJS default interop setting hid a shape mismatch.

Actions:

1. Run `tsc --noEmit`.
2. Run runtime tests against emitted JavaScript.
3. Inspect the packed package.
4. Import the package exactly as consumers do.

## Production guidance

- Use ESM for new applications when your toolchain and dependencies support it.
- Keep CommonJS for legacy packages, CLIs, or environments that need synchronous loading.
- Do not mix formats without a written boundary.
- Use `node:` for built-ins.
- Prefer package `exports` over undocumented deep imports.
- Keep entry points thin and side-effect-light.
- Test both `import` and `require` when supporting both.
- Treat TypeScript as a source language unless you intentionally rely on Node's direct TypeScript support.
- Make package-manager layout differences part of CI, especially with pnpm and Yarn Plug'n'Play.

## Official docs checked

- Node.js CommonJS modules: https://nodejs.org/api/modules.html
- Node.js ECMAScript modules: https://nodejs.org/api/esm.html
- Node.js packages and package exports: https://nodejs.org/api/packages.html
- Node.js `node:module`: https://nodejs.org/api/module.html
- Node.js TypeScript modules: https://nodejs.org/api/typescript.html
