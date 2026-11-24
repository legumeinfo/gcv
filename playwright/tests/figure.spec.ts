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

  test('ticking result tracks shows exactly the ticked tracks, in place of the filters', async ({
    page,
  }) => {
    await openFigure(page);
    const boxes = page.locator('[data-figure-tracks] input[type="checkbox"]');
    const count = await boxes.count();
    expect(count).toBeGreaterThan(2);
    await page.locator('#figure-top').fill('2');
    await page.locator('#figure-top').press('Enter');
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY};top:2`);
    const ticked = boxes.and(page.locator(':checked'));
    // a ticked track's gene is drawn, an unticked one's isn't
    const agree = async () => {
      const states = await boxes.evaluateAll((inputs) =>
        inputs.map((i: HTMLInputElement) => ({
          gene: i.getAttribute('data-track-gene'),
          checked: i.checked,
        })),
      );
      for (const { gene, checked } of states) {
        await expect(
          figure(page).locator(`[data-gene="${gene}"]`),
          gene,
        ).toHaveCount(checked ? 1 : 0);
      }
      return states.filter((s) => s.checked).map((s) => s.gene);
    };
    await expect(ticked).toHaveCount(2);
    expect(await agree()).toHaveLength(2);
    // ticking a third names all three, which override top, kept for later
    const third = boxes.and(page.locator(':not(:checked)')).first();
    const gene = await third.getAttribute('data-track-gene');
    await third.check();
    await expect.poll(() => fig(page)).toMatch(/;top:2;tracks:/);
    expect(fig(page)).toContain(gene);
    await expect(page.locator('#figure-top')).toBeDisabled();
    await expect(page.locator('#figure-genus')).toBeDisabled();
    await expect(figure(page).locator('[data-track]')).toHaveCount(4);
    await expect(ticked).toHaveCount(3);
    expect(await agree()).toHaveLength(3);
    await page.getByRole('button', { name: 'Use them again' }).click();
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY};top:2`);
    await expect(page.locator('#figure-top')).toBeEnabled();
    await expect(ticked).toHaveCount(2);
    expect(await agree()).toHaveLength(2);
  });

  test('ordering by genus follows the genera typed, and merging follows the pairs typed', async ({
    page,
  }) => {
    await openFigure(page);
    await page.locator('#figure-order').selectOption('genus');
    await expect(page.locator('#figure-order-genera')).toBeVisible();
    await page.locator('#figure-order-genera').fill('Vigna, Phaseolus');
    await page.locator('#figure-order-genera').press('Enter');
    await expect
      .poll(() => fig(page))
      .toBe(`cl:${QUERY};order:Vigna+Phaseolus`);
    // the result tracks' labels, top to bottom, read Vigna, then Phaseolus,
    // then the rest
    const rank = (b: string) =>
      b.startsWith('Vigna') ? 0 : b.startsWith('Phaseolus') ? 1 : 2;
    const ranks = () =>
      figure(page)
        .locator('[data-track][data-role="result"] [data-label] text')
        .evaluateAll((texts) =>
          texts
            .map((t) => t.textContent)
            .filter((t) => /^[A-Z][a-z]+ [a-z]/.test(t)),
        )
        .then((binomials) => binomials.map(rank));
    // the figure redraws a moment after the URL changes
    await expect
      .poll(async () => {
        const r = await ranks();
        return r.join('') === [...r].sort().join('');
      })
      .toBe(true);
    const drawn = await ranks();
    expect(new Set(drawn)).toEqual(new Set([0, 1, 2]));
    await page.locator('#figure-merge').selectOption('pairs');
    await page.locator('#figure-merge-pairs').fill('a / b\nnot a pair');
    await page.locator('#figure-merge-pairs').blur();
    await expect.poll(() => fig(page)).toMatch(/;merge:a\/b$/);
    await expect(page.locator('[data-merge-errors] li')).toHaveText([
      "Couldn't read “not a pair”.",
    ]);
    // the figure says it couldn't merge genes it doesn't show
    await expect(
      page.locator('[data-figure-notes] li', {
        hasText: 'Not merged: a and b',
      }),
    ).toHaveCount(1);
  });

  test('the PNG downloads at the resolution chosen', async ({ page }) => {
    await openFigure(page);
    await settledFigure(page);
    const width = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'PNG' }).click(),
      ]);
      // a PNG's width is the big-endian integer at byte 16
      return readFileSync(await file.path()).readUInt32BE(16);
    };
    const [, , w] = (await figure(page).getAttribute('viewBox'))
      .split(' ')
      .map(Number);
    expect(await width()).toBe(Math.round((w * 300) / 96));
    await page.locator('#figure-dpi').fill('150');
    await page.locator('#figure-dpi').press('Enter');
    expect(await width()).toBe(Math.round((w * 150) / 96));
  });

  test('the splitter divides the height between the figure and its settings', async ({
    page,
  }) => {
    await openFigure(page);
    // the notes take height while genes' coordinates load
    await settledFigure(page);
    const height = (selector: string) =>
      page.locator(selector).evaluate((e) => e.getBoundingClientRect().height);
    const heights = async () => ({
      preview: await height('.figure-preview'),
      form: await height('.figure-form'),
      svg: await height('gcv-figure svg[data-figure]'),
    });
    const before = await heights();
    const splitter = page.locator('[data-figure-splitter]');
    const box = await splitter.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    // dragging up gives the settings the height the figure gives up
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 100, { steps: 5 });
    await page.mouse.up();
    const up = await heights();
    expect(Math.abs(before.preview - up.preview - 100)).toBeLessThanOrEqual(2);
    expect(Math.abs(up.form - before.form - 100)).toBeLessThanOrEqual(2);
    // the figure shrinks to fit
    expect(up.svg).toBeLessThan(before.svg);
    expect(up.svg).toBeLessThanOrEqual(up.preview);
    // the keyboard moves it too, and a double-click restores it
    await splitter.focus();
    await page.keyboard.press('ArrowDown');
    expect(await height('.figure-preview')).toBeGreaterThan(up.preview);
    await splitter.dblclick();
    expect(
      Math.abs((await height('.figure-preview')) - before.preview),
    ).toBeLessThanOrEqual(1);
  });
});
