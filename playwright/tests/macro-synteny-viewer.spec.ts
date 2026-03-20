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

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene').nth(0)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G062101");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(0)).toHaveClass("point");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(0)).toHaveAttribute("transform", "rotate(-90)");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveAttribute("transform", "rotate(90)");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(62)).toHaveAttribute("style", "fill: rgb(255, 255, 255);");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene').nth(63)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G068900");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveAttribute("transform", "rotate(-90)");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(63)).toHaveAttribute("style", "fill: rgb(255, 255, 255);");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene').nth(32)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G065800");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(32)).toHaveClass("point focus");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"] > g.gene > path').nth(32)).toHaveAttribute("transform", "rotate(90)");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.gene').nth(45)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.15G173200");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.gene').nth(45)).toHaveAttribute("data-family", "legfed_v1_0.L_7HZCF4");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.gene').nth(46)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.15G173300");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.gene').nth(46)).toHaveAttribute("data-family", "legfed_v1_0.L_9NQ5BD");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("stroke-width", "0.368320633768747");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("x1", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).not.toHaveAttribute("x2", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).toHaveAttribute("y1", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"] > g.rail > line.line').nth(45)).not.toHaveAttribute("y2", "0");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene').nth(0)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.17G050800");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene').nth(0)).toHaveAttribute("data-family", "legfed_v1_0.L_2200SM");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene > path').nth(0)).toHaveClass("point");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"] > g.gene > path').nth(0)).toHaveAttribute("transform", "rotate(90)");

    // Navigate to similar contexts
    await page.locator('g:nth-child(45) > .point').click();
    await page.getByRole('link', { name: 'Search for similar contexts' }).click();

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute("data-micro-track", "0")
    await expect(page.locator('gcv-micro text').nth(1)).toHaveAttribute("data-micro-track", "1")
    await expect(page.locator('gcv-micro text').nth(2)).toHaveAttribute("data-micro-track", "2")
    await expect(page.locator('gcv-micro text[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm17:3624850-4101732');
    await expect(page.locator('gcv-micro text[data-micro-track="1"]')).toContainText('glyma.Wm82.gnm4.Gm13:21031890-21559496');
    await expect(page.locator('gcv-micro text[data-micro-track="2"]')).toContainText('glyma.Wm82.gnm4.Gm15:15497707-16003211');

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.rail > line.line').nth(4)).toHaveAttribute("stroke-width", "5");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.rail > line.line').nth(4)).not.toHaveAttribute("y1", "0");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.rail > line.line').nth(4)).not.toHaveAttribute("x2", "0");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="6"] > g.gene').nth(3)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G068300");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="6"] > g.gene').nth(3)).toHaveAttribute("data-family", "");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="6"] > g.gene > path').nth(3)).toHaveClass("point no_fam");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"]')).toHaveAttribute("data-chromosome", "glyma.Wm82.gnm4.Gm17");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="0"]')).toHaveAttribute("data-organism", "Glycine max:Wm82");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"]')).toHaveAttribute("data-chromosome", "glyma.Wm82.gnm4.Gm13");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="1"]')).toHaveAttribute("data-organism", "Glycine max:Wm82");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"]')).toHaveAttribute("data-chromosome", "glyma.Wm82.gnm4.Gm15");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="2"]')).toHaveAttribute("data-organism", "Glycine max:Wm82");
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

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.gene').nth(1)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.12G002250");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.gene').nth(1)).toHaveAttribute("data-family", "");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.gene > path').nth(1)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="3"] > g.gene > path').nth(1)).toHaveAttribute("transform", "rotate(-90)");

    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="12"] > g.gene').nth(6)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.07G114700");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="12"] > g.gene').nth(6)).toHaveAttribute("data-family", "");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="12"] > g.gene > path').nth(6)).toHaveClass("point no_fam");
    await expect(page.locator('gcv-micro svg.GCV > g[data-micro-track="12"] > g.gene > path').nth(6)).toHaveAttribute("transform", "rotate(90)");
  });

  test('drag viewport to synteny block 3', async ({ page }) => {
    const source = page.locator('.viewport');
    const target = page.locator('polygon').nth(0);

    await d3Drag(page, source, target);

    await expect(page.locator('gcv-micro text.query')).toHaveAttribute('data-micro-track', '0');
    await expect(page.locator('gcv-micro text.query[data-micro-track="0"]')).toContainText('glyma.Wm82.gnm4.Gm09:22202405-25479310');

    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(0)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G113500");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(0)).toHaveAttribute("data-family", "legfed_v1_0.L_BFP8GP");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(1)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G113650");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(1)).toHaveAttribute("data-family", "legfed_v1_0.L_05D23G");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(2)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G113800");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(2)).toHaveAttribute("data-family", "legfed_v1_0.L_BD7TKX");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(3)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G113900");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(3)).toHaveAttribute("data-family", "legfed_v1_0.L_GW5ZY8");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(4)).toHaveAttribute("data-gene", "glyma.Wm82.gnm4.ann1.Glyma.09G114000");
    await expect(page.locator('gcv-micro svg.GCV > g > g.gene').nth(4)).toHaveAttribute("data-family", "legfed_v1_0.L_FTL7G0");

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

    // Navigate to gene view
    await page.locator('path').nth(2).click();

    await expect(page.getByRole('heading')).toContainText('glyma.Wm82.gnm4.ann1.Glyma.09G113800');
    await expect(page.locator('gcv-gene-detail > div.details > p').nth(0)).toContainText('Search for similar contexts');
    await expect(page.locator('gcv-gene-detail > div.details > p > a').nth(0)).toHaveAttribute('href', '/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G113800?q=Glyma.09G134900&sources=lis&algorithm=repeat&match=10&mismatch=-1&gap=-1&score=30&threshold=25&bmatched=20&bintermediate=10&bmask=10&bchrgenes=1&bchrlength=100000&linkage=average&cthreshold=20&neighbors=2&matched=4&intermediate=5&bregexp=&border=distance&regexp=&order=distance');

    await expect(page.locator('gcv-gene-detail > div.details > p').nth(1)).toContainText('Family: legfed_v1_0.L_BD7TKX');
    await expect(page.locator('gcv-gene-detail > div.details > p > a').nth(1)).toHaveAttribute('href', 'https://funnotate.legumeinfo.org/?family=legfed_v1_0.L_BD7TKX');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(0)).toContainText('View glyma.Wm82.gnm4.ann1.Glyma.09G113800 in LegumeMine');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(0)).toHaveAttribute('href', 'https://mines.legumeinfo.org/legumemine/gene:glyma.Wm82.gnm4.ann1.Glyma.09G113800');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(1)).toContainText('View Funnotate phylogram for family of glyma.Wm82.gnm4.ann1.Glyma.09G113800');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(1)).toHaveAttribute('href', 'https://funnotate.legumeinfo.org/?gene_name=glyma.Wm82.gnm4.ann1.Glyma.09G113800');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(2)).toContainText('View glyma.Wm82.gnm4.ann1.Glyma.09G113800 in Genome Context Viewer');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(2)).toHaveAttribute('href', 'https://gcv.legumeinfo.org/gene;lis=glyma.Wm82.gnm4.ann1.Glyma.09G113800');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(3)).toContainText('View glyma.Wm82.gnm4.ann1.Glyma.09G113800 in glycine Genome Context Viewer');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(3)).toHaveAttribute('href', 'https://glycine.legumeinfo.org/tools/gcv//gene;glycine=glyma.Wm82.gnm4.ann1.Glyma.09G113800');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(4)).toContainText('View glyma.Wm82.gnm4.ann1.Glyma.09G113800 in BAR eFP');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(4)).toHaveAttribute('href', 'https://bar.utoronto.ca/eplant_soybean/?ActiveSpecies=Glycine%20max&Genes=Glyma.09G113800&ActiveGene=Glyma.09G113800&ActiveView=PlantView');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(5)).toContainText('View glyma.Wm82.gnm4.ann1.Glyma.09G113800 in single cell experiments');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(5)).toHaveAttribute('href', 'https://shinycell.legumeinfo.org/glyma.expr.Cervantes-Perez_Zogli_2024/?gene1=Glyma.09G113800');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(6)).toContainText('View glyma.Wm82.gnm4.Gm09:22556071-22561156 in JBrowse2');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(6)).toHaveAttribute('href', 'https://glycine.legumeinfo.org/tools/jbrowse2/?session=spec-%7B%22views%22%3A%5B%7B%22assembly%22%3A%22glyma.Wm82.gnm4%22%2C%22loc%22%3A%22glyma.Wm82.gnm4.Gm09%3A22556071-22561156%22%2C%22type%22%3A%20%22LinearGenomeView%22%2C%22tracks%22%3A%5B%22glyma.Wm82.gnm4.ann1.T8TQ.gene_models_main.gff3%22%5D%7D%5D%7D');

    await expect(page.locator('gcv-gene-detail > div.details > ul > li').nth(7)).toContainText('View glyma.Wm82.gnm4.Gm09:22556071-22561156 in glycine Genome Context Viewer');
    await expect(page.locator('gcv-gene-detail > div.details > ul > li > a').nth(7)).toHaveAttribute('href', 'https://glycine.legumeinfo.org/tools/gcv//search?q=glyma.Wm82.gnm4.Gm09:22556071-22561156&sources=glycine');
  });

});
