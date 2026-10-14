# GCV Integration Tests (Playwright)

Browser tests that drive the real app against a **real backend** and assert on the rendered DOM. **6 tests / 2 files.**

```bash
npm run test:e2e          # headless (Chromium)
npm run test:e2e:ui       # interactive
npm run test:e2e:headed
npm run test:e2e:report
```

`playwright.config.ts` auto-starts `ng serve` (`npm start`, `:4200`); `webServer` reuses an existing dev server locally. Chromium only (Firefox/WebKit commented). Config `config.json` points the microservices at `http://localhost/gcv/microservices/{svc}/grpc-web`, so **a local GCV microservices stack must be running**. Tests query `Glyma.09G134900` (soybean), which the standard dataset provides.

## Guiding principle: catch _silent wrong biology_

The dangerous regressions here aren't crashes — they're a clean render of inaccurate biology (wrong homology color, a dropped inversion, a region at the wrong locus). Every pixel is a biological claim; these tests assert those claims. Tier 1 (highest weight) is complete:

| Test (file)                      | Biological claim                                                                                  | Silent failure caught                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| family color consistency (micro) | same family → same color; distinct families → distinct colors; genes match the legend             | false (non-)homology; a divergent color scale           |
| gene orientation (micro)         | reverse-oriented genes are drawn reversed (glyph `rotate(±90)` = `strand × alignmentOrientation`) | inversions flattened to forward                         |
| block orientation (macro)        | inverted synteny blocks marked `data-orientation="-"`                                             | inversions between chromosomes vanishing                |
| track interval (micro)           | label `<chr>:<start>-<stop>` well-formed, ordered, matches `data-extent`                          | a region mislabeled to the wrong locus                  |
| block bounds (macro)             | block loci well-formed; reference-locus within the chromosome span                                | a region drawn at the wrong coordinate / off-chromosome |
| viewport drag (macro)            | dragging onto Gm17's block yields the expected micro-tracks                                       | the macro→micro selection pipeline                      |

`macro-synteny-viewer.spec.ts`, `micro-synteny-viewer.spec.ts`. Roadmap (Tier 2, deep-link reproducibility, param→URL) tracked in project memory.

## Conventions

- **Anchor on semantic `data-*` hooks, not position.** Viewers emit `data-chromosome`, `data-gene`, `data-family`, `data-micro-track`, `data-macro-track`, `data-locus`, `data-reference-locus`, `data-orientation`, `data-extent`. Never CSS `:nth-child` (counts axis/label siblings; breaks on reorder).
- **Assert invariants, not the dataset's numbers,** so tests survive data changes. (The one exception — the drag test's hardcoded intervals — is inherently dataset-coupled.)
- **Mutation-verify new assertions:** perturb the live DOM to violate the invariant and confirm the check fires. A green test that stays green under corruption is worthless.
- **Wait for the settled view.** The micro pipeline briefly renders placeholder `0:0` extents before gene coordinates load; e.g. `await expect(page.locator('gcv-micro text[data-extent="0:0"]')).toHaveCount(0)` before reading labels. Macro block groups render a pass after `.viewport` — wait on `gcv-macro g[data-locus]`. Prefer auto-waiting locators over bare `page.evaluate`. Stress-run the full suite (~10×) to surface parallel-load flakes.
- **`playwright/utils/drag.ts`** — `d3Drag` fires the native `mousedown → mousemove×N → mouseup` sequence D3 drag needs (Playwright's `dragTo` doesn't).
