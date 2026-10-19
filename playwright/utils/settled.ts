import { expect, Page } from '@playwright/test';

// Waits until the micro-synteny view has settled: every viewer's pipeline
// (search, alignment, genes) has finished, so tracks no longer arrive or
// reorder and genes have their coordinates and strands; no track shows the
// placeholder 0:0 extent; and the layout has stopped resizing the viewers,
// each resize being a redraw that replaces their elements.
export async function waitForSettledMicroView(page: Page): Promise<void> {
  await page.locator('gcv-micro .gene').first().waitFor({ state: 'attached' });
  const stages = page.locator('gcv-micro gcv-pipeline .pipeline-arrow');
  // viewers behind another tab keep their pipelines in the DOM, hidden
  await expect(stages).not.toHaveCount(0);
  await expect(stages.locator('.fa-spin, .fa-ban')).toHaveCount(0, {
    timeout: 60000,
  });
  await expect(page.locator('gcv-micro text[data-extent="0:0"]')).toHaveCount(
    0,
  );
  const width = () =>
    page
      .locator('gcv-micro:visible svg')
      .first()
      .evaluate((svg) => svg.getAttribute('width'));
  await expect
    .poll(async () => {
      const before = await width();
      await page.waitForTimeout(300);
      return before === (await width());
    })
    .toBe(true);
}
