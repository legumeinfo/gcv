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

- `src/app/` is the Angular app: `core/` (configuration, HTTP abstraction), `gene/` (the
  viewer workspace, its store and services), `search/`, `instructions/`, `widgets/`.
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
