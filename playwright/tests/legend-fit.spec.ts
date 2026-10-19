import { test, expect, Page } from '@playwright/test';

// The gene view narrows the legend column to its widest legend entry, plus a
// margin of a quarter of that entry's width, giving the micro-synteny viewers
// the rest of the row, until the user moves the column's splitter.
const GENE = '/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G134900';

const columns = (page: Page) =>
  page.locator('.viewers > .lm_goldenlayout > .lm_row > .lm_item');

// each legend key's left edge, relative to its legend's drawing
function keyOffsets(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    ['gcv-micro-legend', 'gcv-macro-legend'].flatMap((legend) => {
      const svg = document.querySelector(`${legend} svg`);
      if (svg === null) return [];
      const left = svg.getBoundingClientRect().left;
      return [...svg.querySelectorAll('text')].map(
        (t) => t.getBoundingClientRect().left - left,
      );
    }),
  );
}

// the whitespace left of the widest key, as a fraction of the key's width
async function margin(page: Page): Promise<number> {
  const width = await page
    .locator('gcv-micro-legend svg')
    .evaluate((svg) => svg.getBoundingClientRect().width);
  const offset = Math.min(...(await keyOffsets(page)));
  return offset / (width - offset);
}

async function settledView(page: Page) {
  await page.goto(GENE);
  const stages = page.locator('gcv-micro gcv-pipeline .pipeline-arrow');
  await expect(stages).toHaveCount(3);
  await expect(stages.locator('.fa-spin, .fa-ban')).toHaveCount(0, {
    timeout: 60000,
  });
  await expect(page.locator('gcv-macro-legend svg text').first()).toBeVisible();
}

test.describe('legend column', () => {
  test('fits the widest legend entry with a margin', async ({ page }) => {
    await settledView(page);
    // keys are right-aligned: the widest key's whitespace is the margin
    await expect.poll(() => margin(page)).toBeGreaterThan(0.2);
    expect(await margin(page)).toBeLessThan(0.3);
    const [micro, legends] = await columns(page).evaluateAll((items) =>
      items.map((i) => i.getBoundingClientRect().width),
    );
    expect(legends).toBeLessThan(micro);
  });

  test("keeps the user's splitter position", async ({ page }) => {
    await settledView(page);
    await expect.poll(() => margin(page)).toBeLessThan(0.3);
    const legendColumn = columns(page).nth(1);
    const fitted = (await legendColumn.boundingBox()).width;

    const splitter = page.locator(
      '.viewers > .lm_goldenlayout > .lm_row > .lm_splitter',
    );
    const box = await splitter.boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x - 300, y, { steps: 10 });
    await page.mouse.up();

    // the legends redraw at their new width without the column refitting
    await expect
      .poll(async () => (await legendColumn.boundingBox()).width)
      .toBeGreaterThan(fitted + 250);
    await page.waitForTimeout(1000);
    expect((await legendColumn.boundingBox()).width).toBeGreaterThan(
      fitted + 250,
    );
  });
});
