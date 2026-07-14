# GCV Architecture & Testing

**Version:** 2.6.1
**Repository:** https://github.com/legumeinfo/gcv
**Live:** https://gcv.legumeinfo.org/

---

## 1. Project Overview

GCV (Genome Context Viewer) is a comparative genomics web application for visualizing micro- and macro- syntenic regions across genomes. It renders gene neighborhoods as "beads-on-a-string" tracks, chromosome-scale syntenic block diagrams (reference-style and Circos-style), and pairwise gene-loci dot plots. Cross-species comparisons are powered by functional annotation homology search against federated backend microservices.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (TypeScript) |
| State | NgRx 21 (Store, Effects, Router-Store) |
| Visualization | D3.js 7, Circos.js 2 |
| Layout | Golden Layout 2 |
| UI | Bootstrap 5, FontAwesome 7, Tippy.js |
| Backend | gRPC-web + HTTP (REST GET/POST) |
| E2E Tests | Playwright 1.58 |
| Unit Tests | Jest 30 (two projects: node engine + jest-preset-angular) |
| Lint | ESLint 9 + angular-eslint + ngRx-eslint |

---

## 2. Architecture

### 2.1 Module Layout

```
src/app/
├── core/         # Singleton services, AppConfig, HTTP abstraction, guards
├── gene/         # Main viewer (lazy-loaded). GoldenLayout workspace with
│                 #   micro/macro viewers, dot plots, detail panels
├── search/       # Gene search interface (lazy-loaded)
├── instructions/ # Landing page / dashboard (lazy-loaded)
├── widgets/      # Reusable UI widgets
├── store/        # Root NgRx store (router state)
└── guards/       # Legacy URL redirect guards
```

### 2.2 Key Design Patterns

**Runtime Configuration:** `AppConfig` is a frozen singleton loaded from `config/config.json` at startup via `provideAppInitializer`. It defines servers (federated backends), branding, parameter defaults, and legend config. Docker-deployable instances can mount a custom `config.json` without rebuilding.

**Dual Backend Protocol:** Each server endpoint is configured as HTTP (GET/POST with typed URL/body) or gRPC-web. The abstract `HttpService` dispatches based on the configured `Request.type`. Generated protobuf stubs live in `dep/legumeinfo-microservices/dist/`.

**Normalized NgRx Store:** The gene module composes six feature reducers (chromosome, gene, micro-tracks, pairwise-blocks, family, layout). The four data-fetching reducers (chromosome, gene, micro-tracks, pairwise-blocks) share a request-deduplication pattern: each maintains `loading`, `loaded`, and `failed` ID arrays alongside an `@ngrx/entity` `EntityAdapter`. Custom `idArrayLeftDifference` / `idArrayIntersection` utilities prevent duplicate API calls. `family` (`{ omitted }`) and `layout` (`{ showLeftSlider, leftSliderContent }`) are plain reducers with neither an adapter nor the loading/loaded/failed arrays.

**URL-Driven State:** All viewer parameters (alignment algorithm, clustering linkage, filters, ordering, sources) are encoded as URL query parameters synchronized by `ParamsService`. Enables bookmarkable/shareable views.

**Shim Pattern:** gRPC protobuf types are transformed into application models via pure shim functions in `src/app/gene/models/shims/` and `src/app/gene/services/shims/`.

**Mixin Pattern:** Application models use TypeScript interfaces as mixins (`ClusterMixin`, `AlignmentMixin`, `DrawableMixin`) for composable type extensions on `Track` and `Gene` entities.

**GoldenLayout Integration:** The gene page renders as a GoldenLayout workspace. Each viewer (micro, macro, macro-circos, plot, legend) is mounted as a GoldenLayout item via `ComponentService.createComponent()`, which imperatively creates and attaches Angular components at runtime.

### 2.3 Visualization Engine

`src/assets/js/gcv/` is a non-Angular, vanilla-TypeScript D3.js engine. It exports a global `GCV` object consumed by Angular viewer components:

| Module | Responsibility |
|--------|---------------|
| `visualization/` | SVG renderers for micro-synteny (`micro.ts`), macro-synteny (`macro.ts`), multi-macro (`multi-macro.ts`), dot plots (`plot.ts`), legends (`legend.ts`) |
| `alignment/` | Smith-Waterman and repeat-based local alignment algorithms |
| `common/` | Color mapping (`colors.ts`), event bus, matrix utilities |
| `graph/` | Directed/undirected graphs, MSA-HMM, frequented-region detection |
| `metrics/` | Levenshtein distance |

---

## 3. State Management

### 3.1 Root State

The root store (`StoreModule.forRoot`) holds only the router state:

```typescript
// src/app/store/reducers/index.ts
interface State {
  routerReducer: RouterReducerState<RouterStateUrl>;
}
```

The `genemodule` and `searchmodule` states are **lazy-loaded feature stores**, registered by their respective modules via `StoreModule.forFeature(geneFeatureKey /* 'genemodule' */, …)` and `StoreModule.forFeature(searchFeatureKey /* 'searchmodule' */, …)` — not fields on the root state. `RouterStateUrl` (`{ url, params, queryParams, data }`) is produced by `CustomRouterStateSerializer`.

### 3.2 Gene Module State (`genemodule`)

| Reducer | Entity Type | Key | Request IDs |
|---------|------------|-----|-------------|
| `chromosome` | `Track` | `trackID(name, source)` | `{name, source}` |
| `gene` | `Gene` | `geneID(name, source)` | `{name, source}` |
| `microTracks` | `Track & ClusterMixin` | `microTrackID(cluster, start, stop, source)` | `{cluster, source}` |
| `pairwiseBlocks` | `PairwiseBlocks` | `pairwiseBlocksID(refSource, ref, chrSource, chr\|*)` | `{referenceSource, reference, chromosomeSource, chromosome?}` |
| `family` | - | - | `{ omitted: string[] }` |
| `layout` | - | - | `{ showLeftSlider, leftSliderContent }` |

**Common reducer pattern** (chromosome, gene, micro-tracks, pairwise-blocks):

```
On GET/SEARCH:
  - Compute IDs to fetch
  - Subtract already-loaded and currently-loading IDs
  - Add remaining to `loading`

On GET/SEARCH_SUCCESS:
  - Remove IDs from `loading`
  - Add IDs to `loaded`
  - Add entities via adapter (addOne / addMany — note: addMany
    ignores IDs that already exist; it does not upsert)

On GET/SEARCH_FAILURE:
  - Remove IDs from `loading`
  - Add IDs to `failed`
```

**Effects** orchestrate async work: each effect listens for an action, calls the appropriate service method, and dispatches success/failure. There are 6 effects: `ChromosomeEffects`, `GeneEffects`, `MicroTracksEffects`, `PairwiseBlocksEffects`, `RegionEffects`, `FamilyEffects` (newer `createEffect` syntax).

### 3.3 Search Module State (`searchmodule`)

The search module has its own feature store using the same request-deduplication pattern as the gene module. State: `{ loading: (SearchID & ActionID)[], loaded: SearchID[], failed: SearchID[], genes: {source, name}[], regions: {source, gene, neighbors}[] }`. `SearchEffects` reacts to the query selector (`clearResults`) and to `combineLatest` of query inputs (`initializeSearch$`, via `switchMap`) to dispatch load/clear actions.

### 3.4 Selectors

Hierarchical memoized selectors compose from raw entity state to derived views:
- `getSelectedGenes` → `getSelectedGeneIDs` → `getSelectedGenesLoaded`
- `getSelectedMicroTracks` → `getClusteredSelectedMicroTracks` → `getClusteredAndAlignedSelectedMicroTracks`
- `getPairwiseBlocks` → `getFilteredAndOrderedPairwiseBlocksForTracks`

Parameter selectors extract typed parameter segments from router query params using the parsers defined in parameter models.

---

## 4. Data Pipeline

### 4.1 Micro-Synteny Pipeline

```
Query genes (user input)
  → Chromosome tracks fetched (per source, per gene)
  → Micro-tracks derived (gene neighborhoods with configurable window)
  → Hierarchical clustering (linkage: average/single/complete, threshold)
  → Multiple-sequence alignment per cluster (Smith-Waterman or Repeat)
  → Consensus extraction
  → MicroTracksService.microTracksSearch(consensus families, params, serverID)
      → HTTP POST or gRPC search against configured backend
  → Search results pairwise-aligned to consensus
  → Visualized as bead tracks in GCV.visualization.Micro
```

### 4.2 Macro-Synteny Pipeline

```
Query genes → Chromosome tracks
  → PairwiseBlocksService.getPairwiseBlocks(chromosome, blockParams, serverID, targets)
      → HTTP POST or gRPC compute() against configured backend
  → Blocks ordered by selected algorithm
      (chromosome name / start position / distance-to-reference with Jaccard optional)
  → Visualized as reference-style macro diagram or Circos diagram
  → Dot plots computed from block endpoints
```

### 4.3 Process Tracking

`ProcessService` monitors the async pipeline and emits status streams. A `Process` is `{ status: ProcessStatusStream, subprocesses: Observable<ProcessStatusStream> }`, and `ProcessStream = Observable<Process>`. These are consumed by header components to display progress indicators ("Loading query genes", "Searching for similar tracks", etc.). Each pipeline stage derives its status from store loading/loaded/failed arrays.

---

## 5. Configuration System

### 5.1 AppConfig

- **File:** `src/app/core/models/app-config.model.ts`
- **Loading:** `AppConfigService.load()` in `src/app/core/services/app-config.service.ts`
- **Flow:** `provideAppInitializer` → `HttpClient.get('config/config.json')` → deep-merge with `defaultConfig` (via `objectMergeDeep`) → validate via type guards (`isBrand`, `isServer`, …) → recursive freeze
- **Exposure:** All properties via static getters (`AppConfig.brand`, `AppConfig.servers`, `AppConfig.defaultParameters`, etc.)

### 5.2 Parameter Models

Each parameter category in `src/app/gene/models/params/` exports:

```
export const <category>ParamMembers: string[];
export const <category>ParamValidators: { [member]: ValidatorFn[] };
export const <category>ParamParsers: { [member]: (raw: string) => <type> };
```

(e.g. `alignmentParamMembers`, `clusteringParamValidators`, `blockParamParsers`.)

These drive reactive forms, URL (de)serialization, and store selectors.

---

## 6. Testing Infrastructure

### 6.1 Current State

**Unit Tests (Jest):** Run with `npm test` (also `test:watch`, `test:coverage`). Configured via `jest.config.ts` as **two projects with no dependency stubs** — every library is the real upgraded package:

- **`engine`** — the framework-free D3/algorithm engine under `src/assets/js/gcv`. Plain `node` environment with `ts-jest`; fast, no Angular/jsdom/zone. Real `mnemonist` and the real `d3` family are transformed via `transformIgnorePatterns`.
- **`app`** — the Angular/NgRx code under `src/app`. Uses `jest-preset-angular` (`createCjsPreset`) + `src/setup-jest.ts` (`setupZoneTestEnv()`), so real `@angular/core`, `@ngrx/store`, and `@ngrx/entity` run under jsdom + zone.js exactly as in production.

Test compiler config is `tsconfig.spec.json` (types: `jest`, `node`). Karma/Jasmine has been fully removed (no `test` architect in `angular.json`, no karma/jasmine dependencies).

**E2E Tests (Playwright):** One test file exists:

| File | Tests | Coverage |
|------|-------|----------|
| `playwright/tests/macro-synteny-viewer.spec.ts` | 1 | Searches `Glyma.09G134900`, clicks into macro viewer, drags viewport onto synteny block g:nth-child(10) > g > .block, asserts 3 resulting micro-tracks with specific genomic intervals |

**Config:** `playwright.config.ts` — Chromium only (Firefox/WebKit commented out), 1920×1080 viewport, 60s test timeout, 10s assertion timeout, `trace: on-first-retry`, `screenshot: only-on-failure`, `video: on`, auto-starts `ng serve` before tests. On CI (`process.env.CI`): `forbidOnly: true`, `retries: 2`, `workers: 1`.

**Utility:** `playwright/utils/drag.ts` — `d3Drag()` fires native `mousedown → incremental mousemove × N → mouseup` events to trigger D3.js drag behavior (D3 requires intermediate `mousemove`).

**Linting:** `eslint.config.js` with `@typescript-eslint`, `@angular-eslint`, and `@ngrx/eslint-plugin` (all rules enabled).

### 6.2 CI

`.github/workflows/build-push-on-tag.yml` triggers on version tags (`v*.*.*`) — builds Docker prod image and pushes to `ghcr.io`. No tests run in CI.

---

## 7. Test Improvement Recommendations

### 7.1 Unit Testing: Jest (done)

Migrated from the unused Karma/Jasmine setup to Jest (see §6.1). Remaining work is coverage, not infrastructure — the `app` project now supports real component/service/effect tests via `jest-preset-angular` should they be added.

### 7.2 What to Unit Test (Priority Order)

#### Tier 1 — Pure Functions (high value, low effort)

**Reducers** — Each reducer handles a discrete state machine (loading/loaded/failed transitions). Test:
- `GET`/`SEARCH` deduplicates already-loaded and currently-loading IDs
- `GET_SUCCESS` moves IDs from loading → loaded and upserts entities
- `GET_FAILURE` moves IDs from loading → failed
- `CLEAR` resets state
- `pairwise-blocks.reducer.ts` wildcard ID matching (`*` chromosome)
- `idArrayLeftDifference` and `idArrayIntersection` utilities
- `family.reducer.ts` OMIT_FAMILIES / INCLUDE_FAMILIES logic

**Selectors** — Memoized derived state. Test:
- `getClusteredAndAlignedSelectedMicroTracks` returns correct tracks with assigned clusters, alignments, and scores
- `getFilteredAndOrderedPairwiseBlocksForTracks` applies regex filtering and algorithm ordering
- Parameter selectors parse URL query strings into typed parameter objects
- Memoization: same input returns `===` reference

**Shims** (`src/app/gene/models/shims/`) — Pure data transformations:
- `trackMap`, `geneMap`, `familyCountMap` — correct indexing by key
- `referenceBlockMap` — correct binning by reference chromosome
- `blockIndexMap` — correct gene index extraction
- `endpointGenes` — correct gene filtering by index array
- `trackToInterval` — correct start/stop computation from gene coordinates
- `macroBlocks` — correct resolution of block indices to gene coordinates
- `nameSourceID` — correct composite key generation

**Parameter Models** (`src/app/gene/models/params/`):
- Parsers handle edge cases (empty strings, invalid formats, boundary values)
- Validators reject invalid inputs

**Utility functions** (`src/app/core/utils/`):
- `objectMergeDeep` — deep merge edge cases (nested arrays, nulls, undefined)
- `setIntersection`, `setDifference`, `setUnion` — set operation correctness
- `arrayFlatten` — nested array flattening
- `id-array.util.ts` — `idArrayLeftDifference`, `idArrayIntersection`
- `pick` — selective property extraction

**Algorithms** (`src/app/gene/algorithms/`):
- `macro-order.algorithm.ts` — Name, Start Position, Distance ordering
- `micro-order.algorithm.ts` — Name, Edit distance ordering
- `alignment.algorithm.ts` — delegates to GCV engine; test delegation + parameters
- Regex factory functions (filter construction)

#### Tier 2 — Services (medium value, medium effort)

**MicroTracksService** — With mocked HTTP/gRPC:
- Constructs correct request body from families + params
- Handles HTTP 200, 4xx, 5xx responses
- Dispatches correct store actions

**PairwiseBlocksService** — With mocked HTTP/gRPC:
- Constructs correct request body with chromosome families, block params, targets
- Handles response mapping from `RawPairwiseBlocks[]` to `PairwiseBlocks[]`
- Correct target filtering

**ProcessService** — Derives process status from store state:
- `_genesAndLoadStateToStatus` — all four status words (running/success/error/warning)
- Status aggregation from multiple subprocesses
- Default status descriptions when no work has started

**AppConfig** — Configuration loading and validation:
- `AppConfigService.load()` correctly deep-merges config.json with defaults
- Type guards reject invalid configs
- `getServer(id)` returns correct server or throws
- `getServerRequest(serverID, requestType)` returns correct request config

**InterAppCommunicationService**:
- BroadcastChannel open/close lifecycle
- Message posting and receiving
- Channel switching

**AppConfigService** — Service instantiation and config loading

#### Tier 3 — Components (lower priority due to D3.js rendering complexity)

**Gene module components** (standalone):
- Component creation via `TestBed`
- Input/output bindings
- Viewers receive correct data in inputs

**Forms** (search filters, parameter forms):
- Form validation
- Parameter value changes emit correct events
- Regex filter input validation

#### Tier 4 — Effects (orchestration logic)

**GeneEffects, ChromosomeEffects, MicroTracksEffects, PairwiseBlocksEffects, RegionEffects:**
- Dispatch correct actions on success/failure
- Handle API errors gracefully

### 7.3 E2E Testing: Expand Coverage

**Critical scenarios to add:**

1. **Micro-synteny search** — Search for gene, verify micro-tracks render with correct gene families
2. **Parameter changes** — Modify clustering threshold, verify clusters change; modify alignment algorithm, verify alignments update
3. **Filter application** — Apply regex filter to micro/macro tracks, verify filtering
4. **Multi-gene query** — Search for multiple genes simultaneously
5. **Source switching** — Toggle server/source selections, verify data from different backends
6. **Dot plot rendering** — Verify plot renders with correct axes and points
7. **Error states** — Backend unreachable, invalid gene name, empty results
8. **URL state persistence** — Modify parameter → URL updates; bookmark URL → correct state loads
9. **GoldenLayout interactions** — Resize panels, close/reopen panels, drag tabs
10. **Macro-order algorithm** — Switch between Name/Position/Distance ordering

**Infrastructure improvements:**

- **Add Firefox + WebKit** projects in `playwright.config.ts` (currently Chromium-only, with others commented out)
- **Add a mock API server** (e.g., MSW or recorded fixtures) to decouple E2E tests from live backends and improve reliability/speed
- **Visual regression tests** — Use Playwright's `toHaveScreenshot()` for critical visualization states
- **Run E2E in CI** — Currently no tests execute on PR or push; add a workflow that runs Playwright against a containerized instance

### 7.4 Testing in CI

Current CI only builds Docker images on version tags. Add:

```yaml
# .github/workflows/test.yml
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, npm ci, npm run lint]
  unit:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, npm ci, npm test]
  e2e:
    runs-on: ubuntu-latest
    steps: [checkout, setup-node, npm ci, npx playwright install --with-deps chromium, npm run test:e2e]
```

### 7.5 Code Coverage

Enable coverage reporting via `npm run test:coverage` (Jest `--coverage`) and set initial thresholds at a reasonable level (e.g., 50% lines, 30% branches) to prevent regression, increasing over time.

---

## 8. Directory Reference

```
src/app/
├── core/models/        AppConfig singleton, Server, Request models
├── core/services/       AppConfigService, HttpService, ScriptService
├── core/utils/          Object merge, set ops, array flatten, comparators, pair-set
├── core/guards/         QueryParamsGuard
├── core/components/     HeaderComponent
├── gene/models/         Track, Gene, Plot, PairwiseBlocks, Region models
├── gene/models/mixins/  ClusterMixin, AlignmentMixin, DrawableMixin
├── gene/models/params/  Parameter types, validators, parsers (9 categories)
├── gene/models/shims/   Pure data transformation functions
├── gene/algorithms/     Alignment, macro-order, micro-order algorithms
├── gene/constants/      Regex patterns, linkage options
├── gene/directives/     GoldenLayout, Sidebar, Tooltip, OnResize directives
├── gene/services/       12 services (data fetching, layout, process, params, plots, etc.)
├── gene/services/shims/ gRPC-to-model shims (track, blocks, region)
├── gene/store/          NgRx feature store (actions, effects, reducers, selectors, utils)
├── gene/components/     Viewer and form Angular components
├── search/              Gene search module (own store, service, components)
├── instructions/        Landing page / dashboard module
├── widgets/             Reusable widget components
├── store/               Root NgRx store (router state)
└── guards/              Legacy URL redirect guards

src/assets/js/gcv/       D3.js visualization engine (non-Angular)
├── visualization/       Micro, Macro, Multi-Macro, Plot, Legend SVG renderers
├── alignment/           Smith-Waterman, Repeat alignment algorithms
├── common/              Colors, event bus, matrix utilities
├── graph/               Graph algorithms (directed, undirected, MSA-HMM)
└── metrics/             Levenshtein distance

playwright/              E2E tests
├── tests/               Test spec files
└── utils/               Drag simulation utility

dep/legumeinfo-microservices/  Protobuf definitions + generated TS client stubs
```
