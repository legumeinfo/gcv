import { test, expect, Page } from '@playwright/test';
import { waitForSettledMicroView } from '../utils';

const VIEW = '/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G134900';

// a family with genes in several tracks, read from the drawn view
async function sharedFamily(page: Page): Promise<string> {
  const family = await page.evaluate(() => {
    const counts = new Map<string, number>();
    document.querySelectorAll('gcv-micro .gene').forEach((g) => {
      const f = g.getAttribute('data-family');
      if (f) counts.set(f, (counts.get(f) ?? 0) + 1);
    });
    return [...counts].find(([, n]) => n > 2)?.[0];
  });
  expect(family, 'the view should share a family across tracks').toBeTruthy();
  return family;
}

// the drawn genes' families, and which of them are pinned
const genePins = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('gcv-micro .gene')).map((g) => ({
      family: g.getAttribute('data-family'),
      pinned: g.classList.contains('pin'),
    })),
  );

const queryParams = (page: Page) =>
  Object.fromEntries(new URL(page.url()).searchParams);

// A pin is a claim that the marked genes are the ones a finding is about, and
// it lives in the URL so a shared link makes the same claim. A pin that
// marked other genes, vanished on hover or redraw, or changed the analysis
// would mislead whoever opens the link.
test.describe('pins', () => {
  test('a link with pinned families opens with exactly them marked', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const family = await sharedFamily(page);
    await page.goto(`${page.url()}&pinfam=${encodeURIComponent(family)}`);
    await waitForSettledMicroView(page);

    const genes = await genePins(page);
    expect(genes.filter((g) => g.pinned).length).toBeGreaterThan(2);
    for (const g of genes) {
      expect(g.pinned, `only family ${family} is pinned`).toBe(
        g.family === family,
      );
    }
    await expect(page.locator('gcv-micro svg.GCV.pinned')).not.toHaveCount(0);
    await expect(
      page.locator(`gcv-micro-legend .legend.pin[data-family="${family}"]`),
    ).toHaveCount(1);
    // the labels stay readable by default
    await expect(page.locator('gcv-micro svg.pin-labels')).not.toHaveCount(0);

    // hovering another gene and moving away leaves the pins
    const other = page
      .locator(`gcv-micro .gene:not([data-family="${family}"])`)
      .first();
    await other.hover();
    await page.waitForTimeout(700);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    expect(await genePins(page)).toEqual(genes);

    // a redraw keeps them
    await page.setViewportSize({ width: 1500, height: 1000 });
    await waitForSettledMicroView(page);
    expect(await genePins(page)).toEqual(genes);
  });

  test("a gene's Pin changes only the pins in the URL, and Clear pins removes them", async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const before = queryParams(page);
    const gene = page.locator('gcv-micro .gene').nth(3);
    const name = await gene.getAttribute('data-gene');
    await gene.click();
    const pin = page.locator('gcv-gene-detail').getByRole('button', {
      name: 'Pin',
    });
    await expect(pin).toBeVisible();

    // a rerun of the search, alignment or clustering would query the
    // microservices; the gene panel's links load from elsewhere
    const requests: string[] = [];
    page.on('request', (r) => {
      if (/microservices|grpc-web/.test(r.url())) {
        requests.push(r.url());
      }
    });
    await pin.click();
    await expect.poll(() => queryParams(page).pingene).toBe(name);
    expect(queryParams(page)).toEqual({ ...before, pingene: name });
    await expect(
      page.locator('gcv-gene-detail').getByRole('button', { name: 'Unpin' }),
    ).toBeVisible();
    // the gene's panel opened in front of the viewer, which draws when shown
    await page.locator('.lm_tab', { hasText: 'Micro Synteny Cluster' }).click();
    // the gene can be drawn in more than one track
    await expect(page.locator('gcv-micro .gene.pin')).not.toHaveCount(0);
    expect(
      await page
        .locator('gcv-micro .gene.pin')
        .evaluateAll((genes) => genes.map((g) => g.getAttribute('data-gene'))),
    ).toEqual(expect.arrayContaining([name]));
    await expect(
      page.locator(`gcv-micro .gene.pin:not([data-gene="${name}"])`),
    ).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(requests, 'pinning must not rerun the analysis').toEqual([]);

    await page.getByRole('button', { name: 'Clear pins' }).click();
    await expect.poll(() => queryParams(page)).toEqual(before);
    await expect(page.locator('gcv-micro .gene.pin')).toHaveCount(0);
    await expect(page.locator('gcv-micro svg.pinned')).toHaveCount(0);
  });

  test("a family's Pin marks its genes in the drawn viewer, without a redraw", async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const family = await sharedFamily(page);
    // the family's panel opens beside the legend, so the viewer stays drawn
    await page
      .locator(`gcv-micro-legend .legend[data-family="${family}"]`)
      .click();
    const viewer = page.locator('gcv-micro:visible svg');
    await viewer.evaluate((svg) => svg.setAttribute('data-before-pin', ''));
    await page
      .locator('gcv-family-detail')
      .getByRole('button', { name: 'Pin' })
      .click();
    await expect.poll(() => queryParams(page).pinfam).toBe(family);
    await expect(viewer).toHaveClass(/pinned/);
    await expect(viewer).toHaveAttribute('data-before-pin', '');
    for (const g of await genePins(page)) {
      expect(g.pinned, `only family ${family} is pinned`).toBe(
        g.family === family,
      );
    }
  });

  // The URL is the only state, so Back undoes a pin. A later change of
  // another parameter must build on the URL Back restored, not bring the
  // undone pin back.
  test('a change after Back keeps what Back undid', async ({ page }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    await page.locator('gcv-micro .gene').nth(3).click();
    await page
      .locator('gcv-gene-detail')
      .getByRole('button', { name: 'Pin' })
      .click();
    await expect.poll(() => queryParams(page).pingene).toBeTruthy();
    await page.goBack();
    await expect.poll(() => queryParams(page).pingene).toBeUndefined();

    await page.getByRole('button', { name: 'Filters' }).click();
    const order = page.locator('#micro-order');
    const other = await order.evaluate(
      (select: HTMLSelectElement) =>
        Array.from(select.options).find((o) => !o.selected).value,
    );
    await order.selectOption(other);
    await expect.poll(() => queryParams(page).order).toBe(other);
    expect(queryParams(page).pingene).toBeUndefined();
  });
});
