import { test, expect, Page } from '@playwright/test';

// Repro from issue: the cicar track whose plot buttons crashed with SACC88532.
// Clicking a track's plot button then choosing local/global adds a plots pane
// to the Golden Layout. Under GL v2 a Stack may only contain ComponentItems, so
// adding the (stack-typed) plots pane into another stack threw
// `AssertError: SACC88532`. These tests drive the real gesture in a real browser
// — the exact failure mode — rather than the GL object model.
const REPRO = '/gene;lis=cicar.CDCFrontier.gnm1.ann1.Ca_21954'
  + '?algorithm=repeat&match=10&mismatch=-1&gap=-1&score=30&threshold=25'
  + '&bmatched=20&bintermediate=10&bmask=10&linkage=average&cthreshold=20'
  + '&neighbors=50&matched=4&intermediate=5&sources=lis'
  + '&bregexp=&border=chromosome&regexp=&order=distance';

async function openPlot(page: Page, which: 'local' | 'global') {
  await page.locator('gcv-micro .micro-plot-link').first().click();
  await page.locator('gcv-plot-tooltip').waitFor();
  await page.locator('gcv-plot-tooltip').getByText(which, { exact: true }).click();
}

test.describe('micro-synteny plot viewer (Golden Layout v2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REPRO);
    // wait for the micro tracks AND the per-track plot axis to render
    await page.locator('gcv-micro .gene').first().waitFor({ state: 'attached' });
    await page.locator('gcv-micro .micro-plot-link').first().waitFor();
  });

  // THE regression: adding the plots pane must not hit the v2 assert that a
  // Stack cannot contain a Stack (SACC88532), and a plot must actually render.
  test('opening a plot does not throw SACC88532 and renders a plot viewer', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await openPlot(page, 'local');

    await expect(page.locator('gcv-plot')).toHaveCount(1);
    expect(errors.join('\n'), 'Golden Layout must not reject the plots stack')
      .not.toContain('SACC88532');
  });

  // local + global open as two tabs of ONE pane (the two-step _addPlots flow:
  // create the plots stack once, stack both plot components into it).
  test('local and global plots share a single pane as two tabs', async ({ page }) => {
    await openPlot(page, 'local');
    await openPlot(page, 'global');

    await expect(page.locator('gcv-plot')).toHaveCount(2);
    // both plot components live under one Golden Layout stack (.lm_stack)
    await expect(page.locator('.lm_stack:has(gcv-plot)')).toHaveCount(1);
  });

  // re-requesting an existing plot focuses it rather than duplicating — pins the
  // "surface on re-click" behavior.
  test('re-opening the same plot does not duplicate it', async ({ page }) => {
    await openPlot(page, 'local');
    await expect(page.locator('gcv-plot')).toHaveCount(1);
    await openPlot(page, 'local');
    await expect(page.locator('gcv-plot')).toHaveCount(1);
  });
});
