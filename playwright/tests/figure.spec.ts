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

  test('colors every shared family, as many as stay colorblind-safe, each its own way', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY}`)}`);
    await settledFigure(page);
    // each family's genes as drawn: style, and paint (color and pattern)
    const drawn = await figure(page).evaluate((svg) => {
      const families: Record<string, { style: string; paint: string }[]> = {};
      svg.querySelectorAll('[data-gene]').forEach((g) => {
        const glyph = g.firstElementChild;
        (families[g.getAttribute('data-family')] ??= []).push({
          style: g.getAttribute('data-style'),
          paint: getComputedStyle(glyph).fill,
        });
      });
      return families;
    });
    const families = Object.entries(drawn).filter(([f]) => f !== '');
    // a family is drawn one way, and white exactly when it has one gene
    for (const [family, genes] of families) {
      expect(new Set(genes.map((g) => g.style)).size, family).toBe(1);
      expect(genes[0].style === 'hollow', family).toBe(genes.length === 1);
    }
    const shared = families.filter(([, genes]) => genes.length > 1);
    const coloured = shared.filter(([, genes]) => genes[0].style === 'colour');
    expect(coloured).toHaveLength(Math.min(shared.length, 21));
    // no two colored families painted alike
    expect(new Set(coloured.map(([, genes]) => genes[0].paint)).size).toBe(
      coloured.length,
    );
    // the tab says when some go grey, and its list ticks those colored
    await expect(page.locator('[data-figure-overflow]')).toHaveCount(
      shared.length > 21 ? 1 : 0,
    );
    await expect(page.locator('[data-family-option]')).toHaveCount(
      shared.length,
    );
    await expect(page.locator('[data-family-option]:checked')).toHaveCount(
      coloured.length,
    );
    // the key explains only the kinds of gene drawn
    const kinds = new Set(families.flatMap(([, g]) => g.map((x) => x.style)));
    for (const kind of ['neutral', 'hollow']) {
      await expect(
        figure(page).locator(`[data-legend-style="${kind}"]`),
        kind,
      ).toHaveCount(kinds.has(kind) ? 1 : 0);
    }
  });

  test('a click on a gene colors its family or not, and the list follows', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY};top:3`)}`);
    await settledFigure(page);
    const target = figure(page).locator('[data-style="colour"]').first();
    const family = await target.getAttribute('data-family');
    const inFamily = (style: string) =>
      figure(page).locator(`[data-family="${family}"][data-style="${style}"]`);
    const option = page.locator(`[data-family-option="${family}"]`);
    await expect(option).toBeChecked();
    // pointing at a gene outlines its family and says what a click does
    await target.hover();
    await expect(page.locator('[data-figure-hint]')).toContainText(
      'Click to stop coloring it',
    );
    await expect(figure(page).locator('.figure-hovered')).toHaveCount(
      await figure(page).locator(`[data-family="${family}"]`).count(),
    );
    await target.click();
    await expect(inFamily('colour')).toHaveCount(0);
    await expect(inFamily('neutral').first()).toBeVisible();
    await expect(option).not.toBeChecked();
    expect(fig(page)).toMatch(/;colour:/);
    expect(fig(page)).not.toContain(family);
    // a click colors it again, and the list does the same
    await inFamily('neutral').first().click();
    await expect(inFamily('neutral')).toHaveCount(0);
    await expect(option).toBeChecked();
    await option.uncheck();
    await expect(inFamily('colour')).toHaveCount(0);
    // a gene alone in its family can't be colored, and says what to do
    const alone = figure(page).locator('[data-style="hollow"]').first();
    if ((await alone.count()) > 0) {
      await alone.hover();
      await expect(page.locator('[data-figure-hint]')).toContainText(
        'emphasise it under Marks instead',
      );
    }
    await page.getByRole('button', { name: 'Color them all again' }).click();
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY};top:3`);
    await expect(inFamily('colour').first()).toBeVisible();
  });

  test('with colorblind-friendly colors off, every shared family takes the viewer’s color', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY}`)}`);
    await settledFigure(page);
    const callout = page.locator('[data-figure-overflow]');
    if ((await callout.count()) > 0) {
      await callout
        .getByRole('button', { name: "use the viewer's colors" })
        .click();
    } else {
      await page.locator('#figure-palette').uncheck();
    }
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY};palette:view`);
    await expect(callout).toHaveCount(0);
    await expect(page.locator('#figure-palette')).not.toBeChecked();
    await expect(figure(page).locator('[data-pattern]')).toHaveCount(0);
    await expect(figure(page).locator('[data-style="neutral"]')).toHaveCount(0);
    // each colored family's paint is the micro-synteny legend's
    const mismatched = await page.evaluate(() => {
      const paint = (e: Element) => getComputedStyle(e).fill;
      const legend = new Map(
        Array.from(
          document.querySelectorAll('gcv-micro-legend [data-family]'),
        ).map((k) => [
          k.getAttribute('data-family'),
          paint(k.querySelector('rect, circle')),
        ]),
      );
      return Array.from(
        document.querySelectorAll(
          'gcv-figure svg [data-gene][data-style="colour"]',
        ),
      )
        .filter(
          (g) =>
            legend.get(g.getAttribute('data-family')) !==
            paint(g.firstElementChild),
        )
        .map((g) => g.getAttribute('data-gene'));
    });
    expect(mismatched).toEqual([]);
    await page.locator('#figure-palette').check();
    await expect.poll(() => fig(page)).toBe(`cl:${QUERY}`);
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

  test('the wheel, buttons and keys zoom the figure about a point, a drag pans it, and Fit fits it again', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY}`)}`);
    await settledFigure(page);
    const preview = page.locator('gcv-figure .figure-preview');
    const zoom = page.locator('[data-figure-zoom]');
    const box = async () => (await figure(page).boundingBox())!;
    const scroll = () =>
      preview.evaluate((p) => ({ left: p.scrollLeft, top: p.scrollTop }));
    // how far the preview can scroll each way
    const room = () =>
      preview.evaluate((p) => ({
        left: p.scrollWidth - p.clientWidth,
        top: p.scrollHeight - p.clientHeight,
      }));
    const fitted = await box();
    await expect(zoom).toHaveText('Fit');
    // the buttons step by a quarter
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect(zoom).toHaveText('125%');
    expect((await box()).width).toBeCloseTo(fitted.width * 1.25, 0);
    // the wheel zooms about the pointer: the figure's point under it stays
    const pane = (await preview.boundingBox())!;
    const before = await box();
    const at = {
      x: before.x + before.width * 0.5,
      y: pane.y + pane.height * 0.4,
    };
    const fraction = (b: typeof before) => [
      (at.x - b.x) / b.width,
      (at.y - b.y) / b.height,
    ];
    await page.mouse.move(at.x, at.y);
    await page.mouse.wheel(0, -400);
    await expect
      .poll(async () => (await box()).width)
      .toBeGreaterThan(before.width * 1.5);
    const after = await box();
    fraction(after).forEach((f, i) =>
      expect(f).toBeCloseTo(fraction(before)[i], 2),
    );
    // the zoomed figure overflows its preview, and a drag pans it
    expect(after.height).toBeGreaterThan(pane.height);
    const start = await scroll();
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x - 60, at.y - 40, { steps: 5 });
    await page.mouse.up();
    const panned = await scroll();
    const most = await room();
    expect(most.top).toBeGreaterThan(start.top + 40);
    expect(panned.top - start.top).toBeCloseTo(40, -1);
    expect(panned.left - start.left).toBeCloseTo(
      Math.min(60, most.left - start.left),
      -1,
    );
    // a drag from a gene and back to it pans, and isn't a click on it
    const [gx, gy] = await figure(page).evaluate((svg) => {
      const pane = svg.parentElement.getBoundingClientRect();
      for (const g of Array.from(
        svg.querySelectorAll('[data-style="colour"]'),
      )) {
        const b = g.getBoundingClientRect();
        const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
        const inside =
          x > pane.left + 40 &&
          x < pane.right - 40 &&
          y > pane.top + 40 &&
          y < pane.bottom - 40;
        if (inside && g.contains(document.elementFromPoint(x, y))) {
          return [x, y];
        }
      }
      throw new Error('no colored gene in view');
    });
    await page.mouse.move(gx, gy);
    await page.mouse.down();
    await page.mouse.move(gx + 30, gy + 30, { steps: 5 });
    await page.mouse.move(gx, gy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    expect(fig(page)).toBe(`cl:${QUERY}`);
    // keys zoom while the figure has focus, and 0 fits it
    await preview.focus();
    await page.keyboard.press('-');
    expect((await box()).width).toBeCloseTo(after.width / 1.25, 0);
    await page.keyboard.press('0');
    await expect(zoom).toHaveText('Fit');
    expect((await box()).width).toBeCloseTo(fitted.width, 0);
    expect(await scroll()).toEqual({ left: 0, top: 0 });
    // Fit, after zooming in, restores the fitted figure
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Fit', exact: true }).click();
    expect(await box()).toEqual(fitted);
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
