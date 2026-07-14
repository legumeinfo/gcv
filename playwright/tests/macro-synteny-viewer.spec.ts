import { test, expect } from '@playwright/test';
import { d3Drag } from '../utils';

test.describe('macro synteny viewer', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).click();
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).fill('Glyma.09G134900');
    await page.locator('#top').getByRole('button', { name: 'Search'}).click();
    await page.getByRole('link', { name: 'glyma.Wm82.gnm4.ann1.Glyma.09G134900', exact: true }).click();
    await page.getByRole('button', { name: 'Macro Viewers' }).click();
    await page.getByRole('link', { name: 'glyma.Wm82.gnm4.Gm09' }).click();

    // Wait for the SVG viewer to finish rendering before any drag
    await page.locator('gcv-macro .viewport').waitFor({ state: 'visible' });
  });

  test('drag viewport to synteny block', async ({ page }) => {
    // In gcv-macro the reference chromosome (Gm09) carries the draggable
    // `.viewport`; each syntenic track is a <g data-chromosome="…"> whose blocks
    // are <g data-locus data-reference-locus> wrapping a `.block`.
    //
    // Drag the viewport onto Gm17's block. We select the target by its
    // chromosome rather than its row position so the test stays correct if the
    // macro-order algorithm reorders tracks; landing on Gm17 is what produces
    // the Gm17 micro-track asserted below (alongside the Gm09 query and Gm15).
    const source = page.locator('gcv-macro .viewport');
    const target = page
      .locator('gcv-macro [data-chromosome="glyma.Wm82.gnm4.Gm17"] .block')
      .first();

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute('data-micro-track', '0');
    await expect(page.locator('gcv-micro text.query[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm09:5850124-6992234');

    await expect(page.locator('gcv-micro text').nth(1)).toHaveAttribute('data-micro-track', '1');
    await expect(page.locator('gcv-micro text[data-micro-track="1"]')).toContainText('glyma.Wm82.gnm4.Gm15:14994031-16120193');

    await expect(page.locator('gcv-micro text').nth(2)).toHaveAttribute('data-micro-track', '2');
    await expect(page.locator('gcv-micro text[data-micro-track="2"]')).toContainText('glyma.Wm82.gnm4.Gm17:3864170-4208319');
  });

  // A macro synteny block's `data-orientation` ('+'/'-') states whether the
  // syntenic segment runs in the same or inverted direction relative to the
  // reference chromosome — i.e. whether an inversion separates the two regions.
  // If orientation were dropped or collapsed to one value, the diagram would
  // still draw every block, but inversions between chromosomes would silently
  // disappear. This asserts every block declares a valid orientation and that
  // both forward and inverted blocks are drawn.
  test('renders synteny block orientation, including inverted blocks', async ({ page }) => {
    // The viewport can become visible a render pass before the block groups
    // exist, so wait on a block group rather than only `.viewport`.
    await page.locator('gcv-macro g[data-locus]').first().waitFor({ state: 'attached' });

    const orientations = await page.evaluate(() =>
      Array.from(document.querySelectorAll('gcv-macro g[data-locus]'))
        .map((b) => b.getAttribute('data-orientation') ?? 'ABSENT'),
    );

    expect(orientations.length, 'macro synteny blocks should have rendered').toBeGreaterThan(0);

    // (1) Every block declares a valid orientation.
    const invalid = [...new Set(orientations.filter((o) => o !== '+' && o !== '-'))];
    expect(invalid, "every synteny block must declare orientation '+' or '-'").toEqual([]);

    // (2) Both forward and inverted blocks are drawn (orientation not collapsed).
    expect(orientations.includes('+'), 'forward-oriented blocks should be drawn').toBe(true);
    expect(orientations.includes('-'), 'inverted blocks should be drawn').toBe(true);
  });

});
