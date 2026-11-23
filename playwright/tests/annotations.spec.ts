import { test, expect, Page } from '@playwright/test';
import { waitForSettledMicroView } from '../utils';

const VIEW =
  '/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G134900?regexp=Phaseolus|Vigna';

// the query track's index, chromosome, extent and genes as drawn
async function queryTrack(page: Page) {
  return page.evaluate(() => {
    const label = document.querySelector(
      'gcv-micro text.query[data-micro-track]',
    );
    const index = label.getAttribute('data-micro-track');
    const track = document.querySelector(
      `gcv-micro g[data-micro-track="${index}"]`,
    );
    return {
      chromosome: label.getAttribute('data-chromosome'),
      extent: label.getAttribute('data-extent').split(':').map(Number),
      genes: Array.from(track.querySelectorAll('.gene')).map((g) => ({
        name: g.getAttribute('data-gene'),
        column: Number(g.getAttribute('data-column')),
      })),
    };
  });
}

async function annotate(page: Page, annot: string) {
  await page.goto(`${VIEW}&annot=${encodeURIComponent(annot)}`);
  await waitForSettledMicroView(page);
}

// the drawn genes' centers and columns, and a box's horizontal extent
const geneCenters = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<SVGGElement>('gcv-micro .gene')).map(
      (g) => ({
        column: Number(g.getAttribute('data-column')),
        x: g.transform.baseVal.consolidate().matrix.e,
      }),
    ),
  );

// An annotation is a claim that particular genes sit in particular columns
// of particular tracks; these check the claim against the drawn genes.
test.describe('annotations', () => {
  test('a box encloses exactly its columns’ genes, before and after a redraw', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const { genes } = await queryTrack(page);
    const [a, b] = [genes[2], genes[5]];
    await annotate(page, `box(c=${a.name}~${b.name},x=block)`);
    const check = async () => {
      const box = page.locator('gcv-micro rect[data-annotation-kind="box"]');
      await expect(box).toHaveCount(1);
      const left = Number(await box.getAttribute('x'));
      const right = left + Number(await box.getAttribute('width'));
      const centers = await geneCenters(page);
      for (const g of centers) {
        const inside = g.x > left && g.x < right;
        expect(
          inside,
          `a gene of column ${g.column} is ${inside ? 'inside' : 'outside'} the box`,
        ).toBe(g.column >= a.column && g.column <= b.column);
      }
    };
    await check();
    await page.setViewportSize({ width: 1500, height: 1000 });
    await waitForSettledMicroView(page);
    await check();
  });

  test('a gap on an occupied slot is refused, naming the gene there', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const { genes } = await queryTrack(page);
    // the track is named by a neighbor, the column by the gene there
    const gene = genes[3].name;
    await annotate(page, `gap(c=${gene},t=${genes[2].name})`);
    await expect(
      page.locator('gcv-micro [data-annotation-kind="gap"]'),
    ).toHaveCount(0);
    await page.locator('[data-annotations-not-shown] a').first().click();
    await expect(
      page.locator('[data-annotations-not-shown] li').first(),
    ).toContainText(`has ${gene} in that column, so it has no gap there.`);
  });

  test('a site is drawn only on tracks of its own chromosome', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const { chromosome, extent } = await queryTrack(page);
    const at = Math.round((extent[0] + extent[1]) / 2);
    await annotate(page, `site(at=${chromosome}:${at},x=here)`);
    const sites = page.locator('gcv-micro path[data-annotation-kind="site"]');
    await expect(sites).not.toHaveCount(0);
    // each pointer's tip sits just above the genes of a track on the
    // chromosome
    const misplaced = await page.evaluate((chromosome) => {
      const tracks = Array.from(
        document.querySelectorAll('gcv-micro g[data-micro-track]'),
      ).map((t) => ({
        chromosome: t.getAttribute('data-chromosome'),
        box: (t as SVGGElement).getBBox(),
      }));
      return Array.from(
        document.querySelectorAll(
          'gcv-micro path[data-annotation-kind="site"]',
        ),
      ).filter((pointer) => {
        const box = (pointer as SVGPathElement).getBBox();
        const tip = box.y + box.height;
        const holder = tracks.find(
          (t) => tip >= t.box.y - 5 && tip <= t.box.y + t.box.height,
        );
        return holder?.chromosome !== chromosome;
      }).length;
    }, chromosome);
    expect(misplaced).toBe(0);
  });

  test('a figure draws the view’s annotations', async ({ page }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const { genes } = await queryTrack(page);
    const annot = `box(c=${genes[2].name}~${genes[4].name});head(c=${genes[3].name},x=Dt1)`;
    await page.goto(
      `${VIEW}&annot=${encodeURIComponent(annot)}&fig=${encodeURIComponent(`cl:${genes[3].name};top:3`)}`,
    );
    const figure = page.locator('gcv-figure svg[data-figure]');
    await expect(figure).toHaveCount(1, { timeout: 60000 });
    await expect(figure.locator('[data-annotation-kind="box"]')).toHaveCount(1);
    await expect(
      figure.locator('text[data-annotation-kind="head"]'),
    ).toHaveText('Dt1');
    await expect(figure.locator('desc')).toContainText(
      'Annotations: a box and header “Dt1”.',
    );
  });

  test('Clear annotations removes every pin and annotation in one step, and Back restores them', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const { genes } = await queryTrack(page);
    const clear = page.getByRole('button', { name: 'Clear annotations' });
    await expect(clear).toHaveCount(0);
    const annot = `box(c=${genes[2].name}~${genes[4].name},x=block)`;
    await page.goto(
      `${VIEW}&pingene=${genes[3].name}&annot=${encodeURIComponent(annot)}`,
    );
    await waitForSettledMicroView(page);
    const marked = new URL(page.url()).search;
    await expect(page.locator('gcv-micro [data-annotation]')).not.toHaveCount(
      0,
    );
    await clear.click();
    await expect
      .poll(() => {
        const params = new URL(page.url()).searchParams;
        return ['pingene', 'pinfam', 'pinlabels', 'annot'].filter((p) =>
          params.has(p),
        );
      })
      .toEqual([]);
    await expect(page.locator('gcv-micro [data-annotation]')).toHaveCount(0);
    await expect(page.locator('gcv-micro .gene.pin')).toHaveCount(0);
    await expect(clear).toHaveCount(0);
    await page.goBack();
    await expect.poll(() => new URL(page.url()).search).toBe(marked);
    await expect(page.locator('gcv-micro [data-annotation]')).not.toHaveCount(
      0,
    );
  });
});
