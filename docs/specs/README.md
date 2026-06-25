# Artefactor — Specifications

These specs are the **source of truth**. Implementation and unit tests are kept in sync
with them at all times (spec ↔ tests ↔ code change together).

## Layout

- `ddd/` — **Domain-Driven Design**: the model. Bounded contexts, aggregates, value
  objects, invariants, and state transitions. The *what* and the *rules*.
- `fdd/` — **Feature-Driven Design**: the build plan. Vertical slices of the DDD model,
  organized as a dependency DAG with per-slice acceptance criteria. The *how* and the
  *order*.

## How to use them

1. **Before coding**, find the DDD aggregate + invariants and the FDD slice that govern
   the work.
2. **TDD**: write unit tests that encode the invariants for the slice, then implement.
3. **No drift**: if behavior changes, the DDD spec, the tests, and the code change in the
   same commit. If no spec covers the work, extend the spec first.
4. **Respect the DAG**: don't start a slice before its dependency slices are done.

## Status

Phase: **specification** (v0.2 draft). No implementation yet. Locked product decisions are
recorded in `ddd/` and summarized in the repo `CLAUDE.md`.
