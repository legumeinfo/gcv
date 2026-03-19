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

  test.afterEach(async ({ page }, testInfo) => {
    console.log(`Test "${testInfo.title}": ${page.url()}`);
  });

  test('drag viewport to synteny block', async ({ page }) => {
    const source = page.locator('.viewport');
    const target = page.locator('g:nth-child(10) > g > .block').first();

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute('data-micro-track', '0');
    await expect(page.locator('gcv-micro text.query[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm09:5850124-6992234');

    await expect(page.locator('gcv-micro text').nth(1)).toHaveAttribute('data-micro-track', '1');
    await expect(page.locator('gcv-micro text[data-micro-track="1"]')).toContainText('glyma.Wm82.gnm4.Gm15:14994031-16120193');

    await expect(page.locator('gcv-micro text').nth(2)).toHaveAttribute('data-micro-track', '2');
    await expect(page.locator('gcv-micro text[data-micro-track="2"]')).toContainText('glyma.Wm82.gnm4.Gm17:3864170-4208319');

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(0)).toHaveClass("point");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(0)).toHaveAttribute("transform", "rotate(-90)");

    
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveAttribute("transform", "rotate(90)");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveAttribute("style", "fill: rgb(255, 255, 255);");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveAttribute("transform", "rotate(-90)");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveAttribute("style", "fill: rgb(255, 255, 255);");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(32)).toHaveClass("point focus");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(32)).toHaveAttribute("transform", "rotate(90)");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("stroke-width", "0.368320633768747");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("x1", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).not.toHaveAttribute("x2", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("y1", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).not.toHaveAttribute("y2", "0");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene > path').nth(0)).toHaveClass("point");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene > path').nth(0)).toHaveAttribute("transform", "rotate(90)");
  });

  test('drag viewport to synteny block 2', async ({ page }) => {
    const source = page.locator('.viewport');
    const target = page.locator('g:nth-child(15) > g > .block');

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute('data-micro-track', '0');
    await expect(page.locator('gcv-micro text.query[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm09:45992113-47046572');

    await expect(page.locator('gcv-micro text').nth(1)).toHaveAttribute('data-micro-track', '1');
    await expect(page.locator('gcv-micro text[data-micro-track="1"]')).toContainText('glyma.Wm82.gnm4.Gm18:54241766-55065669');

    await expect(page.locator('gcv-micro text').nth(2)).toHaveAttribute('data-micro-track', '2');
    await expect(page.locator('gcv-micro text[data-micro-track="2"]')).toContainText('glyma.Wm82.gnm4.Gm18:53882185-54203661');
  });

  test('drag viewport to synteny block 3', async ({ page }) => {
    const source = page.locator('.viewport');
    const target = page.locator('polygon').nth(0);

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute('data-micro-track', '0');
    await expect(page.locator('gcv-micro text.query[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm09:22202405-25479310');

    await expect(page.locator('gcv-micro svg.GCV > g > g.gene > path').nth(0)).toHaveClass("point single");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene > path').nth(1)).toHaveClass("point single");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene > path').nth(2)).toHaveClass("point focus single");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene > path').nth(3)).toHaveClass("point single");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene > path').nth(4)).toHaveClass("point single");

    await expect(page.locator('gcv-micro svg.GCV > g > g.rail > line.line').nth(0)).toHaveAttribute("stroke-width", "0.6030132902518757");
    await expect(page.locator('gcv-micro svg.GCV > g > g.rail > line.line').nth(1)).toHaveAttribute("stroke-width", "0.1");
    await expect(page.locator('gcv-micro svg.GCV > g > g.rail > line.line').nth(2)).toHaveAttribute("stroke-width", "2.0784743153119467");
    await expect(page.locator('gcv-micro svg.GCV > g > g.rail > line.line').nth(3)).toHaveAttribute("stroke-width", "5");

    await expect(page.locator('gcv-micro text[data-micro-track="1"]')).toHaveCount(0);
    await expect(page.locator('gcv-micro text[data-micro-track="2"]')).toHaveCount(0);
  });

});
