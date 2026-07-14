import { test, expect } from '@playwright/test';

test.describe('micro synteny viewer', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).click();
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).fill('Glyma.09G134900');
    await page.locator('#top').getByRole('button', { name: 'Search'}).click();
    await page.getByRole('link', { name: 'glyma.Wm82.gnm4.ann1.Glyma.09G134900', exact: true }).click();

    // Wait for the micro-synteny pipeline to render gene glyphs before asserting.
    await page.locator('gcv-micro .gene').first().waitFor({ state: 'attached' });
  });

  // Color is GCV's homology encoding: a gene's fill is GCV.common.colors(family),
  // a single shared ordinal scale used by the micro tracks, the micro legend and
  // the dot plots alike. If that invariant slips — a second scale instance, a
  // reordered domain, a palette collision — the app still renders, but genes of
  // the same family appear in different colors (false non-homology) or distinct
  // families collapse onto one color (false homology). This asserts the rendered
  // invariant rather than any specific family→color assignment, so it holds
  // across datasets. Genes with no family and singleton families are drawn white
  // by design (the legend groups singletons under one key), so the cross-checks
  // below cover only the colored — biologically grouped — families.
  test('renders one consistent color per gene family, matching the legend', async ({ page }) => {
    const { geneFamilyFills, legendFills } = await page.evaluate(() => {
      const fillOf = (el: Element | null) =>
        el ? getComputedStyle(el).fill : null;

      // family -> distinct fills observed across every micro gene glyph
      const geneFamilyFills: Record<string, string[]> = {};
      document.querySelectorAll('gcv-micro .gene').forEach((g) => {
        const fam = g.getAttribute('data-family');
        if (!fam) return; // genes with no family are intentionally white
        const fill = fillOf(g.querySelector('path'));
        if (!fill) return;
        (geneFamilyFills[fam] ??= []);
        if (!geneFamilyFills[fam].includes(fill)) geneFamilyFills[fam].push(fill);
      });

      // legend swatches, keyed by family (colored families get one key each;
      // singletons share a single comma-joined key, which we ignore below)
      const legendFills: Record<string, string> = {};
      document.querySelectorAll('gcv-micro-legend .legend').forEach((k) => {
        const fam = k.getAttribute('data-family');
        if (fam) legendFills[fam] = fillOf(k.querySelector('rect, circle')) ?? 'none';
      });

      return { geneFamilyFills, legendFills };
    });

    const WHITE = 'rgb(255, 255, 255)';
    const families = Object.keys(geneFamilyFills);
    expect(families.length, 'micro genes should have rendered').toBeGreaterThan(0);

    // (1) Every family renders exactly one color across all of its genes.
    for (const family of families) {
      expect(
        geneFamilyFills[family],
        `family ${family} must render a single consistent color`,
      ).toHaveLength(1);
    }

    // The colored families are the biologically meaningful homology groups.
    const coloredFamilies = families.filter((f) => geneFamilyFills[f][0] !== WHITE);
    expect(
      coloredFamilies.length,
      'query should surface multiple distinct homology groups',
    ).toBeGreaterThan(1);

    // (2) Distinct families map to distinct colors (no palette collision).
    const coloredValues = coloredFamilies.map((f) => geneFamilyFills[f][0]);
    expect(
      new Set(coloredValues).size,
      'distinct gene families must not share a color',
    ).toBe(coloredFamilies.length);

    // (3) Each colored family's gene color matches its legend swatch. A missing
    // key (undefined) or a different color both fail here.
    for (const family of coloredFamilies) {
      expect(
        legendFills[family],
        `legend swatch for ${family} must match its gene color`,
      ).toBe(geneFamilyFills[family][0]);
    }
  });

});
