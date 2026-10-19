import { test, expect, Locator, Page } from '@playwright/test';
import { waitForSettledMicroView } from '../utils';

// Two query genes on different chromosomes, so the view has two clusters, each
// in its own micro-synteny viewer.
const TWO_CLUSTERS =
  '/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G134900,glyma.Wm82.gnm4.ann1.Glyma.12G040000';

// Brings the last cluster's viewer to the front and waits for the view to
// settle, since tracks arriving later reorder the viewer; returns the viewer
// and its cluster.
async function lastClusterViewer(
  page: Page,
): Promise<{ viewer: Locator; cluster: string }> {
  const tabs = page.locator('.lm_tab', { hasText: 'Micro Synteny Cluster' });
  await expect
    .poll(() => tabs.count(), { message: 'the view needs two clusters' })
    .toBeGreaterThan(1);
  const tab = tabs.last();
  const cluster = (await tab.textContent()).match(/Cluster (\d+)/)[1];
  await tab.click();
  await waitForSettledMicroView(page);
  return { viewer: page.locator('gcv-micro:visible'), cluster };
}

// the last track label of the viewer: its index and chromosome
async function lastTrack(viewer: Locator) {
  const label = viewer.locator('.axis text[data-micro-track]').last();
  return {
    label,
    index: await label.getAttribute('data-micro-track'),
    chromosome: await label.getAttribute('data-chromosome'),
  };
}

// A viewer reports a clicked track by its index among its own cluster's
// tracks. Resolving that index among every cluster's tracks opens the wrong
// track's details and dot plots in every cluster but the first: a clean
// render of another region's genes.
test.describe('micro-synteny viewers of a multi-cluster view', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TWO_CLUSTERS);
  });

  test("a track name opens that track's details", async ({ page }) => {
    const { viewer } = await lastClusterViewer(page);
    const { label, index, chromosome } = await lastTrack(viewer);
    const drawnGenes = await viewer
      .locator(`g[data-micro-track="${index}"] .gene`)
      .evaluateAll((genes) => genes.map((g) => g.getAttribute('data-gene')));
    expect(drawnGenes.length).toBeGreaterThan(0);

    await label.click();

    const detail = page.locator('gcv-track-detail');
    await expect(detail.locator('h4')).toContainText(chromosome);
    const detailGenes = await detail
      .locator('.details > ul:last-of-type > li')
      .evaluateAll((items) =>
        items.map((li) => li.firstChild.textContent.trim()),
      );
    expect(detailGenes).toEqual(expect.arrayContaining(drawnGenes));
  });

  test("a track's plot link plots that track", async ({ page }) => {
    const { viewer, cluster } = await lastClusterViewer(page);
    const { index, chromosome } = await lastTrack(viewer);

    await viewer.locator('.micro-plot-link').nth(Number(index)).click();
    await page
      .locator('gcv-plot-tooltip')
      .getByText('local', { exact: true })
      .click();

    // plots are titled '<track> x <query track> (<cluster>) local plot'
    const title = page.locator('.lm_title', { hasText: 'local plot' }).first();
    await expect(title).toHaveText(
      new RegExp(
        `^${chromosome.replace(/\./g, '\\.')} x .* \\(${cluster}\\) local plot$`,
      ),
    );
  });
});
