# Working on GCV

The Genome Context Viewer: an Angular app that compares genomic context (micro-synteny
tracks, macro-synteny blocks, dot plots) across genomes, using gene-family annotations as
the unit of homology. It draws data from the Legume Information System microservices
(`legumeinfo/microservices`) over gRPC-Web and HTTP, and ships as a container image,
`ghcr.io/legumeinfo/gcv`, deployed with `legumeinfo/gcv-docker-compose`.

Read **[doc/architecture.md](doc/architecture.md)** before changing code; it describes the
module layout, the NgRx store, the data pipelines and the configuration system. Testing
has its own guides: [doc/testing-unit.md](doc/testing-unit.md) and
[doc/testing-e2e.md](doc/testing-e2e.md).

## What a wrong change looks like

GCV's failures are rarely crashes. They are clean renders of wrong biology: a homology
color that doesn't match the family, an inversion drawn forward, a region at the wrong
locus. Treat every rendered mark as a claim, and test the claim, not the pixels.

## Layout

- `src/app/` is the Angular app: `core/` (configuration, HTTP abstraction, the WebMCP
  layer), `gene/` (the viewer workspace, its store and services), `search/`,
  `instructions/`, `widgets/`, `webmcp/` (the app's WebMCP tools; see below).
- `src/assets/js/gcv/` is a framework-free TypeScript engine: alignment, graph and metric
  algorithms and the D3 renderers. It must not import Angular; the app consumes it through
  the `GCV` global.
- `dep/legumeinfo-microservices/` builds the gRPC-Web client stubs (see below).
- `src/config/config.json` is the development configuration; deployments mount their own.

Imports use the path aliases in `tsconfig.json`: `@gcv/*` (`src/app`), `@gcv-assets/*`
(`src/assets`), `@gcv-environments/*`.

## Conventions

- **Formatting is Prettier's** (`.prettierrc.json`); ESLint (`eslint.config.js`) owns
  everything else. Don't hand-format or add formatting lint rules.
- **Angular selectors** are prefixed `gcv` (`gcv-micro`, `[gcvTooltipFactory]`).
- **NgRx:** actions with `createAction`, effects with `createEffect`, selectors named
  `select…`. The store is injected as `_store`. The `@ngrx` lint rules are on, with
  narrow, commented exceptions in `eslint.config.js`.
- **Protobuf types stay at the edge.** Services convert gRPC replies into app models
  through the pure shims in `gene/models/shims/` and `gene/services/shims/`; components and
  the store see only app models.
- **URL is state.** Viewer parameters live in query parameters (`ParamsService`, the
  parameter models in `gene/models/params/`), so views stay shareable. A new parameter
  needs its member, validator and parser there.
- **Comments are terse, say why, and describe the code as it is now**: no history, no
  "used to"; that belongs in commit messages.

## The backend contract

- `dep/legumeinfo-microservices/scripts/get-proto.js` pins, per microservice, the release
  tag whose `.proto` files the client stubs are compiled from. The package builds during
  `npm install` (the `preinstall` script) and its stubs are never committed. Bump a pin
  only to a tag that exists, and only for an API the code then uses.
- The microservices change their v1 APIs only compatibly, so an older pin keeps working
  against newer services.
- **Runtime configuration** is `config/config.json`, loaded by `AppConfigService`, deep-merged
  with `defaultConfig`, checked with the type guards in `core/models/app-config.model.ts`,
  and frozen. A new configuration field needs the model, its guard and its default, and is
  a change for every deployment's `config.json`: say so in the PR.

## WebMCP

GCV registers [WebMCP](https://webmachinelearning.github.io/webmcp/) tools on
`document.modelContext`, so an agent driving the browser can search, open gene views, read
the analysis, change parameters and point at what it describes. In browsers without WebMCP
the tools don't register; nothing else changes. The README lists the tools.

- **Three layers.** `core/webmcp/webmcp.ts` wraps Angular's experimental
  `declareExperimentalWebMcpTool`: `defineGcvWebMcpTool` types a tool's arguments from its
  schema; execution runs inside `NgZone`; strings return as-is, anything else as JSON.
  `webmcp/` holds the app-level pieces: registration and the start tools (`app.tools.ts`),
  the gene-view host and the guide. `gene/webmcp/` holds the gene view's tools
  (`*.tools.ts`) and the pure modules they're built on (`*.report.ts`, `lookup.ts`,
  `parameters.ts`, `view-state.ts`), each with a spec. Put the logic in the pure modules
  and keep tools thin.
- **Every tool registers at startup,** once `ApplicationInitStatus` resolves (the
  configuration has loaded), so an agent sees the whole of GCV without discovery calls.
  The gene and search modules read `AppConfig` when they load, so app-level WebMCP code
  imports them only dynamically; a static import crashes the app at startup.
- **Gene-view tools run in the open gene view.** `GeneComponent` attaches its injector to
  `GeneViewHost`; `inGeneView` runs the tool in that injection context, waits up to 30 s for
  a view on a `/gene` URL, cancels the call if the view closes, and tells the agent how to
  open one if none is open. `inject()` works only before a tool's first `await`, so tools
  take what they need up front (`viewContext()`).
- **Read the settled view.** Tools wait until every request the URL implies has succeeded
  or failed (`waitForSettledGeneView`, `settledView`); earlier reads see tracks still
  arriving and genes not yet placed.
- **The URL stays the only analysis state.** `set_view_parameters` validates with the URL
  guard's validators and applies changes through `ParamsService`, and it reports the result
  tracks each change added and removed. A new URL parameter needs its entry in
  `parameterSchemas` (`parameters.spec.ts` checks). Display tools never change the analysis
  or the URL: highlighting publishes the viewers' own hover events on the GCV event bus,
  and panels open through `PanelService`, which the viewers' callbacks share.
- **Descriptions and the guide are the instructions.** `describe_gcv` returns `guide.ts`
  (overview, tool groups, concepts, recipes) with the instance's sources and parameter
  defaults; `guide.spec.ts` keeps its tool list in step with registration. A new tool needs
  its group's list, a guide entry and a README row. Tools fail by throwing
  `WebMcpToolError` with a message that says how to recover. Browsers reject a throwing
  tool with a generic error that drops its message, so the core layer returns it as the
  result `{"error": message}`; any other error returns as an unexpected failure and is
  logged. Large results truncate and say how much they left out.
- **The search guidance is deliberate.** The recipes and parameter descriptions say to widen
  the search (`neighbors`, `intermediate`) before loosening the evidence it requires
  (`matched`, `score`): loosened thresholds admit chance matches, while a wider window finds
  the fractionated copies a polyploidy leaves. Keep that order, and check changes to such
  advice with someone who knows the biology.
- **Trying tools in a browser:** a Playwright init script can stand in for
  `document.modelContext` with an object whose `registerTool` keeps each tool, then call
  `tool.execute(args, { signal })` from `page.evaluate`.

## Building and the image

- **Node** must satisfy Angular's `engines` field (today `^22.22.3 || ^24.15.0`); the
  Dockerfile's `node` base image too, or `ng build` refuses to run in the image.
- **npm 11 owns `package-lock.json`** (see `engines` in `package.json`). npm 10 and 11
  apply the scoped `ts-jest` override of `@babel/core` differently, so a lock written by
  one is rejected by the other's `npm ci`. Change dependencies with npm 11, then check
  that no locked version moved unintentionally.
- **Keep the base tag.** The `prod` stage serves the build with nginx, which rewrites
  `<base href="/">` to `GCV_PATH` by exact text match
  (`nginx/templates/default.conf.template`). Angular emits that tag from `src/index.html`'s
  `<base href="/" />`; without it the app breaks under any path but `/`.
- **Releases:** bump `version` in `package.json` and in `doc/architecture.md`, merge, then
  a maintainer tags `vX.Y.Z` on `main`. The tag builds and pushes the image, tagged
  `X.Y.Z`, `X.Y`, `X` and `latest`.

## Checks

```sh
npm ci
npm test                 # Jest: the engine (node) and app (jsdom) projects
npm run lint
npm run format:check
npx ng build --configuration production
```

- Unit tests use the real libraries, nothing mocked. In the `engine` project, import the
  module under test directly, not the `GCV` barrel, which pulls in D3 rendering.
- `npm run test:e2e` (Playwright) drives the app against a real microservices stack at
  `http://localhost/gcv/microservices/`, which `gcv-docker-compose` provides. Anchor on the
  viewers' `data-*` attributes, assert invariants rather than dataset numbers, and
  mutation-check new assertions: break the DOM and confirm the test fails.
- A change to the Dockerfile, the lock file or `dep/` isn't done until `npm ci` and the
  production build pass from a clean checkout.

## Known deviations

| Where                  | Deviation                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `gene/store/selectors` | memoized selectors built with `createSelectorFactory` are still named `get…`; the lint rule only checks `createSelector` |

Remove a row when you fix it.
