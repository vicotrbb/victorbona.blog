---
title: "Macros, Metaprogramming, and Procedural Macros"
collection: "rust"
sourcePath: "Knowledge base/Rust/10 Macros Metaprogramming and Proc Macros.md"
order: 10
---
Purpose: Understand Rust macros as disciplined compile-time code generation tools, including `macro_rules!`, hygiene, token trees, procedural macros, derive macros, attribute macros, function-like proc macros, `syn`, `quote`, debugging, and when not to use macros.

# Macros, Metaprogramming, and Procedural Macros

Related notes: [Rust](/compendium/rust/rust), [01 Rust Language Fundamentals](/compendium/rust/rust-language-fundamentals), [03 Types Traits and Generics](/compendium/rust/types-traits-and-generics), [05 Modules Crates Cargo and Workspaces](/compendium/rust/modules-crates-cargo-and-workspaces), [11 Testing Verification Benchmarking and Tooling](/compendium/rust/testing-verification-benchmarking-and-tooling), [Design Patterns/Design patterns](/compendium/design-patterns/design-patterns), [Software Engineering/01 Engineering Fundamentals](/compendium/software-engineering/engineering-fundamentals).

## Macro mental model

Macros run before normal type checking. They transform tokens into tokens. This makes them powerful for removing repetition, expressing domain syntax, deriving boilerplate, and building compile-time contracts. It also makes them dangerous when they hide control flow, diagnostics, trait bounds, or generated APIs.

```mermaid
flowchart LR
    Source["source tokens"] --> Expand["macro expansion"]
    Expand --> HIR["parsed and lowered Rust"]
    HIR --> TypeCheck["type checking"]
    TypeCheck --> MIR["MIR optimization"]
    MIR --> Codegen["code generation"]
```

There are two broad macro families:

| Macro type | Where it runs | Input | Output | Typical use |
|---|---|---|---|---|
| Declarative macro | Compiler macro expander. | Token trees matched by patterns. | Token trees. | Repetition, small DSLs, test helpers. |
| Procedural macro | Separate proc-macro crate compiled as a compiler plugin. | `TokenStream`. | `TokenStream`. | Derive, attributes, item generation, domain syntax. |

Macros should be a last-mile abstraction when functions, traits, generics, const generics, builders, or ordinary modules are not enough.

## Token trees

Rust macros work over token trees, not strings and not typed AST nodes. A token tree is one of:

- An identifier, literal, punctuation, or lifetime.
- A delimited group: `(...)`, `{...}`, or `[...]`.

This matters because a macro can accept incomplete Rust that is still tokenizable. It also means declarative macros match fragments such as `expr`, `ty`, `ident`, `path`, `pat`, `item`, and `tt`, each with specific grammar rules.

```rust
macro_rules! show_tokens {
    ($($token:tt)*) => {
        stringify!($($token)*)
    };
}

fn main() {
    let text = show_tokens!(Result<Vec<u8>, std::io::Error>);
    assert_eq!(text, "Result<Vec<u8>, std::io::Error>");
}
```

`stringify!` keeps source tokens as text without evaluating them. It is useful for diagnostics and generated labels, not for parsing Rust.

## Declarative macros with macro_rules!

`macro_rules!` uses pattern arms. The first matching arm wins.

```rust
macro_rules! ensure {
    ($condition:expr, $message:literal $(,)?) => {
        if !$condition {
            return Err($message.into());
        }
    };
    ($condition:expr, $message:expr $(,)?) => {
        if !$condition {
            return Err($message);
        }
    };
}

fn parse_positive(input: i32) -> Result<i32, String> {
    ensure!(input > 0, "input must be positive");
    Ok(input)
}
```

Repetition is the main superpower:

```rust
macro_rules! define_flags {
    (
        $(
            $(#[$meta:meta])*
            $name:ident = $value:expr;
        )+
    ) => {
        $(
            $(#[$meta])*
            pub const $name: u32 = $value;
        )+
    };
}

define_flags! {
    /// Read permission.
    READ = 0b001;
    /// Write permission.
    WRITE = 0b010;
    /// Execute permission.
    EXECUTE = 0b100;
}
```

Repetition syntax:

| Syntax | Meaning |
|---|---|
| `$x:expr` | Capture one expression fragment. |
| `$($x:expr),*` | Capture zero or more expressions separated by commas. |
| `$($x:expr),+` | Capture one or more expressions separated by commas. |
| `$(,)?` | Accept an optional trailing comma. |
| `$($tokens:tt)*` | Capture arbitrary token trees. |

Design rule: accept trailing commas in list-like macros. It improves diffs and matches Rust syntax habits.

## Hygiene

Macro hygiene prevents many accidental name collisions. Identifiers introduced by a macro do not casually capture names from the call site, and names from the call site keep their context. Hygiene is not a reason to be careless.

```rust
macro_rules! with_temporary {
    ($value:expr, $body:block) => {{
        let temporary = $value;
        let result = $body;
        (temporary, result)
    }};
}

fn main() {
    let temporary = 10;
    let pair = with_temporary!(20, { temporary + 1 });
    assert_eq!(temporary, 10);
    assert_eq!(pair, (20, 11));
}
```

The `temporary` inside the macro and the `temporary` at the call site are not the same binding in the block passed by the caller. When a macro must refer to items from its own crate, use `$crate`:

```rust
#[macro_export]
macro_rules! make_error {
    ($msg:expr) => {
        $crate::Error::new($msg)
    };
}
```

Without `$crate`, exported macros can break when called from another crate that does not have the same paths in scope.

## Scoping and exports

Prefer module-scoped macros where possible:

```rust
macro_rules! test_case {
    ($name:ident, $input:expr, $expected:expr) => {
        #[test]
        fn $name() {
            assert_eq!(crate::parse($input).unwrap(), $expected);
        }
    };
}

test_case!(parses_zero, "0", 0);
test_case!(parses_one, "1", 1);
```

Use `#[macro_export]` only when the macro is part of the public API. Exported macros are API commitments and need documentation, tests, examples, and semver care.

## When macro_rules! works well

| Use | Why macro_rules! fits |
|---|---|
| Repetitive tests | Compile-time generation without runtime indirection. |
| Simple declarative data | Pattern matching can validate syntax shape. |
| Public convenience wrappers | Can preserve caller file and line in diagnostics. |
| Avoiding trait object or closure overhead in hot assertions | Expansion is static. |

Example test matrix:

```rust
macro_rules! parse_cases {
    ($($name:ident: $input:expr => $expected:expr),+ $(,)?) => {
        $(
            #[test]
            fn $name() {
                assert_eq!(parse_number($input).unwrap(), $expected);
            }
        )+
    };
}

fn parse_number(input: &str) -> Result<i64, std::num::ParseIntError> {
    input.parse()
}

parse_cases! {
    parses_zero: "0" => 0,
    parses_negative: "-9" => -9,
    parses_large: "12345" => 12345,
}
```

## When not to use macros

| Situation | Prefer | Reason |
|---|---|---|
| Normal computation | Function | Better type checking, stack traces, docs, and debugging. |
| Type-specific behavior | Trait | Lets users implement behavior directly. |
| Configuration | Typed config | Runtime values should not require recompilation. |
| Simple object construction | Builder or constructor | Easier diagnostics and IDE support. |
| Complex parsing language | Parser crate | Macro parsing can become unreadable and fragile. |
| Public API hiding important bounds | Explicit generics | Users need to see constraints. |

Macro smell checklist:

- Does the macro hide allocations, IO, locks, or panics?
- Does it require users to learn a mini-language?
- Are error messages worse than ordinary Rust?
- Does generated code change public API in surprising ways?
- Can a function, trait, or const generic express the same idea?
- Will IDE refactoring and search still work?

## Procedural macro crates

Procedural macros must live in crates with `proc-macro = true`.

```toml
[package]
name = "derive-entity"
version = "0.1.0"
edition = "2024"
publish = false

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "1"
quote = "1"
syn = { version = "2", features = ["full"] }
```

Common workspace split:

| Crate | Role |
|---|---|
| `mycrate` | Runtime traits and public types. |
| `mycrate-macros` | Proc macro implementation. |
| `mycrate-test-support` | UI tests, fixtures, compile-fail cases. |

Keep runtime logic out of the proc macro crate. Proc macro crates are loaded by the compiler and cannot export normal runtime APIs like ordinary libraries.

## Derive macros

Derive macros generate implementations for structs and enums.

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Entity)]
pub fn derive_entity(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;

    let expanded = quote! {
        impl Entity for #name {
            fn entity_name() -> &'static str {
                stringify!(#name)
            }
        }
    };

    expanded.into()
}
```

Consumer side:

```rust
pub trait Entity {
    fn entity_name() -> &'static str;
}

#[derive(Entity)]
pub struct Invoice {
    id: String,
}

assert_eq!(Invoice::entity_name(), "Invoice");
```

Production derive macros must handle generics, lifetimes, visibility, where clauses, unsupported inputs, and precise diagnostics.

Derive with generics:

```rust
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Trace)]
pub fn derive_trace(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;
    let generics = input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    quote! {
        impl #impl_generics Trace for #name #ty_generics #where_clause {
            fn trace_name(&self) -> &'static str {
                stringify!(#name)
            }
        }
    }
    .into()
}
```

## Attribute macros

Attribute macros transform an item annotated with an attribute.

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn timed(_args: TokenStream, input: TokenStream) -> TokenStream {
    let function = parse_macro_input!(input as ItemFn);
    if let Some(token) = function.sig.asyncness {
        return syn::Error::new_spanned(
            token,
            "#[timed] supports synchronous functions only",
        )
        .to_compile_error()
        .into();
    }
    if let Some(token) = function.sig.constness {
        return syn::Error::new_spanned(
            token,
            "#[timed] cannot instrument const functions",
        )
        .to_compile_error()
        .into();
    }

    let attributes = &function.attrs;
    let visibility = &function.vis;
    let signature = &function.sig;
    let block = &function.block;
    let name = signature.ident.to_string();

    quote! {
        #(#attributes)*
        #visibility #signature {
            struct __TimedGuard {
                started: ::std::time::Instant,
                name: &'static str,
            }

            impl ::core::ops::Drop for __TimedGuard {
                fn drop(&mut self) {
                    ::std::eprintln!(
                        "{} took {:?}",
                        self.name,
                        self.started.elapsed(),
                    );
                }
            }

            let __timed_guard = __TimedGuard {
                started: ::std::time::Instant::now(),
                name: #name,
            };
            #block
        }
    }
    .into()
}
```

Attribute macros are good for framework integration, instrumentation, command registration, tests, and routing. They are risky when they invisibly change function semantics. Generated wrappers must preserve async, generics, visibility, attributes, return values, and error behavior. This example rejects async and const functions and uses a scope guard so `return` and `?` keep their original control-flow meaning. The guard also reports during unwinding, but cannot run when panic strategy is abort or the process terminates.

## Function-like proc macros

Function-like procedural macros look like function calls but run at compile time.

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let query = parse_macro_input!(input as LitStr);
    let value = query.value();

    if !value.trim_start().to_uppercase().starts_with("SELECT") {
        return syn::Error::new_spanned(query, "only SELECT statements are allowed")
            .to_compile_error()
            .into();
    }

    quote! {
        Query::new(#value)
    }
    .into()
}
```

Use this shape when the macro input is its own domain language. If the input is ordinary Rust, prefer normal Rust APIs.

## syn and quote

`syn` parses Rust syntax into AST types. `quote` turns Rust-like templates into tokens. `proc-macro2` provides token types that are easier to test outside the compiler interface.

```rust
use quote::{format_ident, quote};
use syn::{Fields, ItemStruct};

fn generate_getters(item: &ItemStruct) -> proc_macro2::TokenStream {
    let struct_name = &item.ident;
    let getters = match &item.fields {
        Fields::Named(fields) => fields.named.iter().filter_map(|field| {
            let name = field.ident.as_ref()?;
            let ty = &field.ty;
            let getter_name = format_ident!("{}", name);
            Some(quote! {
                pub fn #getter_name(&self) -> &#ty {
                    &self.#name
                }
            })
        }),
        _ => return quote! {},
    };

    quote! {
        impl #struct_name {
            #(#getters)*
        }
    }
}
```

Span hygiene matters for diagnostics. Use spans from parsed input when pointing at user code. Use `syn::Error::new_spanned` for errors tied to syntax.

```rust
fn reject_tuple_struct(input: &syn::DeriveInput) -> syn::Result<()> {
    match &input.data {
        syn::Data::Struct(item) if matches!(item.fields, syn::Fields::Unnamed(_)) => {
            Err(syn::Error::new_spanned(&item.fields, "tuple structs are not supported"))
        }
        _ => Ok(()),
    }
}
```

## Macro diagnostics

Good macro diagnostics name the violated rule and point at the user's source.

```rust
let error = syn::Error::new_spanned(
    &field.ident,
    "Entity fields must be named so generated accessors have stable names",
);
return error.to_compile_error().into();
```

Avoid `panic!` in procedural macros for user input errors. Panics report macro internals, not actionable source errors.

## Macro debugging

Useful tools:

| Tool | Use |
|---|---|
| `cargo-expand` through `cargo expand` | Shows expanded Rust after macro expansion. |
| `trace_macros!` | Debug declarative macro expansion on nightly or selected contexts. |
| `RUSTFLAGS="-Z macro-backtrace"` | Nightly macro backtraces for hard expansion failures. |
| `trybuild` | Compile-pass and compile-fail UI tests for proc macros. |
| `prettyplease` | Pretty print generated syntax in tests or snapshots. |

Commands:

```bash
cargo install cargo-expand
cargo expand --package mycrate --lib
cargo expand --test derive_entity
```

For procedural macros, unit test the generation function with `proc_macro2::TokenStream` when possible:

```rust
#[test]
fn generates_entity_impl() {
    let input: syn::DeriveInput = syn::parse_quote! {
        struct Invoice {
            id: String,
        }
    };

    let output = generate_entity_impl(&input).to_string();

    assert!(output.contains("impl Entity for Invoice"));
}
```

Then add UI tests for actual compiler behavior:

```rust
#[test]
fn ui() {
    let tests = trybuild::TestCases::new();
    tests.pass("tests/ui/pass/basic.rs");
    tests.compile_fail("tests/ui/fail/tuple_struct.rs");
}
```

## Testing macros

Macro tests need several levels:

| Level | What it catches |
|---|---|
| Unit tests around generation helpers | AST handling and simple output shape. |
| Expansion snapshots | Accidental generated code changes. |
| Compile-pass tests | Macro works from a downstream crate perspective. |
| Compile-fail tests | Diagnostics stay actionable for invalid input. |
| Runtime behavior tests | Generated code behaves correctly. |

Do not rely only on string comparisons of generated tokens. Token formatting is unstable. Use structural checks where possible and compile tests for final confidence.

## Public macro API design

Public macros need the same rigor as public functions:

- Document accepted syntax.
- Provide examples that compile.
- Use `$crate` for internal paths in exported declarative macros.
- Preserve caller attributes where appropriate.
- Avoid surprising name generation.
- Keep generated public items predictable.
- Include compile-fail tests for invalid syntax.
- Treat diagnostics as part of developer experience.
- Version breaking syntax or generated API changes under semver.

## Fragment Specifiers and Edition Boundaries

A `macro_rules!` matcher operates on token trees with fragment-specific parsing. Choose the narrowest fragment that expresses the grammar.

| Fragment | Meaningful use |
|---|---|
| `ident` | Identifier or keyword-shaped identifier accepted by the matcher |
| `path` | Type or value path |
| `ty` | Type syntax |
| `expr` | Expression under the macro definition crate's edition rules |
| `expr_2021` | Pre-2024 expression fragment behavior when compatibility is required |
| `pat` | Pattern, including top-level or-patterns in applicable editions |
| `pat_param` | Pattern without a top-level or-pattern, useful before a literal `\|` separator |
| `item`, `stmt`, `block`, `meta`, `literal` | Corresponding Rust syntax category |
| `tt` | One token tree; flexible but gives the parser less structure |

The edition of the crate that defines a declarative macro determines fragment parsing behavior. The edition of the calling crate does not retroactively change it. Edition 2024 expands `expr` to include top-level underscore and const-block expressions, so macros that depend on the older set can use `expr_2021` during migration.

Follow-set restrictions limit which literal tokens may appear after fragments. They preserve the ability to extend Rust syntax without making existing macro parsing ambiguous. If a matcher fights these restrictions, redesign the input grammar instead of wrapping everything in `tt` and rebuilding a fragile parser.

## Hygiene, Paths, and Spans

Declarative macros have mixed-site hygiene. Loop labels, block labels, and local variables are looked up at the definition site, while most other names are resolved at the invocation site. `$crate` identifies the defining crate and is essential for exported macros, but it does not bypass item visibility.

Procedural macros are largely unhygienic token transformations. Generated names can collide and paths resolve in the caller's context. Prefer fully qualified standard-library paths such as `::core::option::Option`, use a companion runtime crate for stable public paths, and account for dependency renaming when generating third-party paths.

Spans control where diagnostics point and influence name resolution. Preserve input spans when reproducing user syntax, use `quote_spanned!` for generated code tied to a specific input, and combine multiple `syn::Error` values so callers can fix several independent problems in one compile.

## Expansion Semantics and Resource Limits

Review generated code as if it were handwritten public API. A wrapper can accidentally change:

- evaluation count or order;
- `return`, `break`, `?`, and panic behavior;
- async cancellation points or future `Send` behavior;
- const eligibility and unsafe context;
- visibility, attributes, generics, ABI, or where clauses;
- type inference and borrow lifetimes;
- compile time, binary size, and recursion depth.

Macros should not duplicate an expression unless the syntax explicitly promises multiple evaluation. Deep recursive expansion can reach the crate recursion limit and create disproportionate compiler work. Prefer repetition in `macro_rules!` and iterative parsing or generation in proc macros.

## Procedural Macros as Build-time Code

A procedural macro is a compiler plugin that executes native host code during compilation. It has the same file, environment, process, and network capabilities as a build script under the build user's permissions.

- Keep proc-macro dependencies small, pinned through the lockfile for applications, and covered by supply-chain policy.
- Avoid network access, current-time output, random identifiers, host-specific paths, and mutable global state.
- Put parsing and code-generation logic in testable ordinary functions.
- Bound input size and produce deliberate errors for pathological nesting.
- Treat a proc-macro version update as executable build tooling, not merely a syntax-library update.

## Common mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Capturing everything as `tt` too early. | Ambiguous syntax and poor errors. | Use specific fragments such as `expr`, `ty`, `path`, and `ident`. |
| Forgetting `$crate`. | Exported macro fails in downstream crates. | Use `$crate::path` for crate-owned items. |
| Using macros for normal functions. | Harder debugging and worse type errors. | Prefer functions and traits. |
| Ignoring generics in derive macros. | Macro works only for toy structs. | Use `split_for_impl`. |
| Panicking on invalid macro input. | Users see internal panic traces. | Return `syn::Error::to_compile_error`. |
| Hiding expensive work. | Callers cannot reason about cost. | Keep generated code visible with docs and `cargo expand` examples. |
| Exporting helper names. | Public namespace pollution or collisions. | Generate private modules with uncommon names or require explicit paths. |

## Production guidance

- Keep procedural macro crates small and mostly pure transformations.
- Put parsing and code generation in ordinary functions that can be unit tested.
- Keep runtime traits in a normal crate, not the proc macro crate.
- Use `syn` feature flags narrowly to reduce compile time.
- Add `trybuild` tests for public proc macros.
- Review expanded code during code review for nontrivial macros.
- Prefer explicit trait bounds in generated impls.
- Avoid macros for business logic.
- Keep generated code boring, idiomatic, and readable after `cargo expand`.

## Review checklist

- Is a macro necessary, or would a function, trait, const generic, or builder be clearer?
- Is the macro syntax documented with examples?
- Are generated paths hygienic and stable?
- Do exported declarative macros use `$crate`?
- Are errors returned as compile errors rather than panics?
- Are generics, lifetimes, where clauses, visibility, and attributes preserved?
- Does `cargo expand` output look like code the team would write by hand?
- Are compile-pass and compile-fail tests present?
- Are public generated items part of the semver review?

## Primary Sources

- [The Rust Reference: macros by example](https://doc.rust-lang.org/reference/macros-by-example.html)
- [The Rust Reference: procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html)
- [Edition Guide: macro fragment specifiers](https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html)
- [`proc_macro` module documentation](https://doc.rust-lang.org/proc_macro/)
- [`syn` documentation](https://docs.rs/syn/latest/syn/)
- [`quote` documentation](https://docs.rs/quote/latest/quote/)
- [`trybuild` documentation](https://docs.rs/trybuild/latest/trybuild/)
