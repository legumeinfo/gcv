import { test, expect } from '@playwright/test';
import { d3Drag } from '../utils';

test.describe('macro synteny viewer', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).click();
    await page.locator('#top').getByRole('textbox', { name: 'Enter a gene name' }).fill('Glyma.09G134900');
    await page.locator('#top').getByRole('button', { name: 'Search'}).click();
    await page.getByRole('link', { name: 'glyma.Wm82.gnm4.ann1.Glyma.'}).click();
    await page.getByRole('button', { name: 'Macro Viewers' }).click();
    await page.getByRole('link', { name: 'glyma.Wm82.gnm4.Gm09' }).click();

    // Wait for the SVG viewer to finish rendering before any drag
    await page.locator('.viewport').waitFor({ state: 'visible' });
  });

  test('drag viewport to synteny block', async ({ page }) => {
    const source = page.locator('.viewport');
    const target = page.locator('g:nth-child(10) > g > .block').first();

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro')).toContainText('glyma.Wm82.gnm4.Gm09:5850124-6992234');
    await expect(page.locator('gcv-micro')).toContainText('glyma.Wm82.gnm4.Gm15:14994031-16120193');
    await expect(page.locator('gcv-micro')).toContainText('glyma.Wm82.gnm4.Gm17:3864170-4208319');
  });

});
