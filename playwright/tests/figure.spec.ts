import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { waitForSettledMicroView } from '../utils';

const QUERY = 'glyma.Wm82.gnm4.ann1.Glyma.09G134900';
const VIEW = `/gene;lis=${QUERY}?regexp=Glycine|Phaseolus|Vigna`;

const fig = (page: Page) => new URL(page.url()).searchParams.get('fig');

const figure = (page: Page) => page.locator('gcv-figure svg[data-figure]');

// each gene's stated column, keyed by gene and track
const columns = (page: Page, selector: string) =>
  page.evaluate(
    (selector) =>
      Array.from(document.querySelectorAll(selector)).map((g) =>
        [g.getAttribute('data-gene'), g.getAttribute('data-column')].join(' '),
      ),
    selector,
  );

// Waits until the figure stops changing: its tracks and genes have arrived
// and the genes' coordinates have loaded.
async function settledFigure(page: Page): Promise<void> {
  await expect(figure(page)).toHaveCount(1, { timeout: 60000 });
  const drawn = () =>
    figure(page).evaluate((svg) => new XMLSerializer().serializeToString(svg));
  await expect
    .poll(
      async () => {
        const before = await drawn();
        await page.waitForTimeout(1000);
        return before === (await drawn());
      },
      { timeout: 60000 },
    )
    .toBe(true);
  await expect(
    page.locator('[data-figure-notes] li', { hasText: 'coordinates' }),
  ).toHaveCount(0);
}

async function openFigure(page: Page): Promise<void> {
  await page.goto(VIEW);
  await waitForSettledMicroView(page);
  await page.getByRole('button', { name: 'Make figure' }).click();
  await expect(figure(page)).toHaveCount(1);
}

// A figure is a set of claims about the view: these genes, in these
// columns, of these tracks, colored as their families. The figure tab
// reads and writes only the URL's fig, so a link reproduces it.
test.describe('the figure tab', () => {
  test('Make figure opens a figure of its cluster, its genes in the viewer’s columns', async ({
    page,
  }) => {
    await openFigure(page);
    expect(fig(page)).toBe(`cl:${QUERY}`);
    await expect(
      page.locator('.lm_tab', { hasText: 'Cluster 0 Figure' }),
    ).toHaveCount(1);
    // every gene the figure draws is a gene of the viewer, in its column
    const drawn = await columns(page, 'gcv-figure [data-gene]');
    await page.locator('.lm_tab', { hasText: 'Micro Synteny Cluster' }).click();
    await waitForSettledMicroView(page);
    const viewer = new Set(await columns(page, 'gcv-micro .gene'));
    expect(drawn.length).toBeGreaterThan(20);
    expect(drawn.filter((g) => !viewer.has(g))).toEqual([]);
  });

  test('changing the figure changes only fig, and redraws without new data', async ({
    page,
  }) => {
    await openFigure(page);
    const before = Object.fromEntries(new URL(page.url()).searchParams);
    const requests: string[] = [];
    page.on('request', (r) => {
      if (/microservices|grpc-web/.test(r.url())) requests.push(r.url());
    });
    await page.locator('#figure-top').fill('3');
    await page.locator('#figure-top').press('Enter');
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY};top:3`);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
      ...before,
      fig: `cl:${QUERY};top:3`,
    });
    // the query track and the three best result tracks
    await expect(figure(page).locator('[data-track]')).toHaveCount(4);
    await expect(
      figure(page).locator('[data-track][data-role="query"]'),
    ).toHaveCount(1);
    await page.waitForTimeout(1000);
    expect(requests, 'a figure change must not rerun the analysis').toEqual([]);
  });

  test('closing the tab removes fig, and Back reopens it', async ({ page }) => {
    await openFigure(page);
    await page
      .locator('.lm_tab', { hasText: 'Cluster 0 Figure' })
      .locator('.lm_close_tab')
      .click();
    await expect.poll(() => fig(page)).toBeNull();
    await expect(page.locator('gcv-figure')).toHaveCount(0);
    await page.goBack();
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY}`);
    await expect(figure(page)).toHaveCount(1);
  });

  test('a link with fig opens the figure, and draws the same SVG in a fresh browser', async ({
    browser,
  }) => {
    const spec = `cl:${QUERY};top:4;order:score;famlabels:1;w:120;font:6`;
    const download = async () => {
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      await page.goto(`${VIEW}&fig=${encodeURIComponent(spec)}`);
      // the figure tab is in front, so the viewer behind it isn't drawn
      await settledFigure(page);
      await expect(figure(page).locator('[data-track]')).toHaveCount(5);
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'SVG' }).click(),
      ]);
      const svg = readFileSync(await file.path(), 'utf8');
      await context.close();
      return svg;
    };
    const first = await download();
    const second = await download();
    expect(first).toMatch(/^<svg[^>]* width="120mm"/);
    expect(first).toContain('<desc>');
    // the caption and metadata hold the link that reproduces the figure
    expect(first).toMatch(/<desc>[^<]*Made with GCV [^<]*fig=[^<]*<\/desc>/);
    expect(first).toMatch(/<metadata>[^<]*"url":"[^"]*fig=/);
    const undated = (svg: string) => svg.replace(/\d{4}-\d{2}-\d{2}/g, '');
    expect(undated(second)).toBe(undated(first));
  });
});
