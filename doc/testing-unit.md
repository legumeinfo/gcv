# GCV Unit Tests (Jest)

Pure-logic tests for the algorithm engine, NgRx reducers, and model shims. **108 tests / 11 files.**

```bash
npm test              # jest
npm run test:watch    # jest --watch
npm run test:coverage # jest --coverage
```

## Design: two projects, zero dependency stubs

`jest.config.ts` runs two projects because the code has two natures. Every library is the **real** upgraded package — nothing is mocked (`src/__mocks__/` was removed).

| Project | Roots | Env | Notes |
|---------|-------|-----|-------|
| `engine` | `src/assets/js/gcv` | node + `ts-jest` | Framework-free D3/algorithm engine. Fast; no Angular/jsdom/zone. Real `mnemonist` + `d3` transformed via `transformIgnorePatterns`. |
| `app` | `src/app` | `jest-preset-angular` (jsdom + zone) | Real `@angular/core`, `@ngrx/store`, `@ngrx/entity`, exactly as in production. Setup: `src/setup-jest.ts` (`setupZoneTestEnv()`). |

Test compiler config: `tsconfig.spec.json` (`types: [jest, node]`).

## Coverage

**Alignment engine** (`src/assets/js/gcv/alignment/`) — the highest scientific weight:
- `smith-waterman`, `repeat` — perfect/partial matches, mismatches, insertions/deletions, custom scores, threshold, omit set, **inversions/orientation** (the SW `reverse` path is the app default).
- `merge-alignments`, `intervals-to-sets`, `alignment-interval`, `compute-score` — the reversal/inversion interval-scheduling internals, including palindrome tie-breaking.

**NgRx reducers** (`src/app/gene/store/reducers/`):
- `micro-tracks` — SEARCH→loading→loaded/failed transitions, CLEAR, and that `addMany` does **not** upsert (first wins on id collision — real `@ngrx/entity` semantics).
- `pairwise-blocks` — `pairwiseBlocksID` formatting and the wildcard (`*` chromosome) `idArrayLeftDifference` dedup semantics.

**Model shims** (`src/app/gene/models/shims/`):
- `block-index-map`, `macro-blocks`, `track-to-interval` — gene-index → coordinate resolution, binned by the **reference** chromosome (`reference:referenceSource`, not the target `chromosome`).

## Conventions

- Assert **behavior/invariants**, not incidental output. Where a value is exact and hand-computable (alignment scores, coordinates), assert it; otherwise assert the property.
- Tests exercise the real libraries, so they double as a regression net for the Angular 21 / NgRx 21 / mnemonist upgrades on this branch.
- **Gotcha:** don't import the `GCV` barrel (`@gcv-assets/js/gcv`) in the `engine` project — it pulls in the D3 visualization layer. Import the specific module (`./smith-waterman`). Visualization is [E2E](testing-e2e.md)'s job.
