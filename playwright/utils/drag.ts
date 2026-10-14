import { type Locator, type Page } from '@playwright/test';

export interface D3DragOptions {
  /**
   * Number of intermediate mousemove steps to fire along the drag path.
   * D3's drag handler needs these to update element position incrementally.
   * Higher values = smoother/more reliable drag. Default: 20.
   */
  steps?: number;

  /**
   * Override the starting point within the source element's bounding box.
   * Values are fractions of width/height (0–1). Default: center (0.5, 0.5).
   */
  sourceOffset?: { x: number; y: number };

  /**
   * Override the drop point within the target element's bounding box.
   * Values are fractions of width/height (0–1). Default: center (0.5, 0.5).
   */
  targetOffset?: { x: number; y: number };
}

/**
 * Performs a D3-compatible drag from one locator to another.
 *
 * GCV uses D3's drag behavior on SVG elements, which listens for native
 * mousedown → mousemove → mouseup events. This utility fires those events
 * in the way D3 expects, with enough intermediate steps to trigger D3's
 * drag update handlers along the path.
 *
 * @example
 * await d3Drag(page,
 *   page.locator('.viewport'),
 *   page.locator('g:nth-child(10) > g > .block').first()
 * );
 *
 * @example
 * // More steps for complex re-render logic, custom offsets
 * await d3Drag(page,
 *   page.locator('.viewport'),
 *   page.locator('.target-block'),
 *   { steps: 50, sourceOffset: { x: 0.1, y: 0.5 } }
 * );
 */
export async function d3Drag(
  page: Page,
  source: Locator,
  target: Locator,
  options: D3DragOptions = {},
): Promise<void> {
  const {
    steps = 20,
    sourceOffset = { x: 0.5, y: 0.5 },
    targetOffset = { x: 0.5, y: 0.5 },
  } = options;

  const sourceBounds = await source.boundingBox();
  const targetBounds = await target.boundingBox();

  if (!sourceBounds)
    throw new Error(
      `d3Drag: source element has no bounding box — is it visible?`,
    );
  if (!targetBounds)
    throw new Error(
      `d3Drag: target element has no bounding box — is it visible?`,
    );

  const startX = sourceBounds.x + sourceBounds.width * sourceOffset.x;
  const startY = sourceBounds.y + sourceBounds.height * sourceOffset.y;
  const endX = targetBounds.x + targetBounds.width * targetOffset.x;
  const endY = targetBounds.y + targetBounds.height * targetOffset.y;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(endX, endY, { steps });
  await page.mouse.up();
}

/**
 * Performs a D3-compatible drag using raw pixel coordinates instead of locators.
 * Useful for canvas-based interactions or when you already know the exact coordinates.
 *
 * @example
 * await d3DragByCoords(page, { x: 200, y: 300 }, { x: 500, y: 300 });
 */
export async function d3DragByCoords(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: Pick<D3DragOptions, 'steps'> = {},
): Promise<void> {
  const { steps = 20 } = options;

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps });
  await page.mouse.up();
}
