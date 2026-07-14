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

});
