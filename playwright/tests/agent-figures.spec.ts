import { test, expect, Page } from '@playwright/test';
import { callTool, standInForWebMcp, waitForSettledMicroView } from '../utils';

const QUERY = 'glyma.Wm82.gnm4.ann1.Glyma.09G134900';
const VIEW = `/gene;lis=${QUERY}?regexp=Phaseolus|Vigna`;

type Box = { x: number; y: number; width: number; height: number };
type Layout = {
  columns: { column: number; x: number }[];
  tracks: {
    index: number;
    y: number;
    top: number;
    height: number;
    label: Box;
  }[];
  annotations: { id: string; box: Box }[];
};
type Manifest = {
  tracks: { role: string; fmin: number; score: number | null }[];
  columns: { from: number; to: number };
};

// the query track's genes, in order
const queryGenes = (page: Page) =>
  page.evaluate(() =>
    Array.from(
      document.querySelectorAll('gcv-micro g[data-micro-track="0"] .gene'),
    ).map((g) => g.getAttribute('data-gene')),
  );

test.beforeEach(async ({ page }) => {
  await standInForWebMcp(page);
});

// What the tools report is a claim about what the page draws; these check
// the claims against the drawn elements and the drawn figure.
test.describe('the agent figure tools', () => {
  test('get_view_layout locates every column, track, label and annotation within a pixel', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const query = await queryGenes(page);
    const annot = `box(c=${query[2]}~${query[5]},x=block);head(c=${query[3]},x=h)`;
    await page.goto(`${VIEW}&annot=${encodeURIComponent(annot)}`);
    await waitForSettledMicroView(page);
    const layout = await callTool<Layout>(page, 'get_view_layout');
    const drawn = await page.evaluate(() => {
      const box = (e: Element) => {
        const r = e.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      };
      // a glyph's center is its group's origin
      const genes = Array.from(
        document.querySelectorAll<SVGGElement>('gcv-micro .gene'),
      ).map((g) => {
        const m = g.getScreenCTM();
        return {
          column: Number(g.getAttribute('data-column')),
          track: Number(
            g.closest('[data-micro-track]').getAttribute('data-micro-track'),
          ),
          x: m.e,
          y: m.f,
        };
      });
      const labels = Array.from(
        document.querySelectorAll('gcv-micro .axis text[data-micro-track]'),
      ).map((t) => ({
        track: Number(t.getAttribute('data-micro-track')),
        box: box(t),
      }));
      const marks = Array.from(
        document.querySelectorAll('gcv-micro .annotations [data-annotation]'),
      ).map((e) => ({ id: e.getAttribute('data-annotation'), box: box(e) }));
      return { genes, labels, marks };
    });
    const near = (a: number, b: number, what: string) =>
      expect(Math.abs(a - b), `${what}: ${a} vs ${b}`).toBeLessThanOrEqual(1);
    for (const g of drawn.genes.filter((g) => Number.isInteger(g.column))) {
      const column = layout.columns.find((c) => c.column === g.column);
      near(column.x, g.x, `column ${g.column}`);
      const track = layout.tracks[g.track];
      expect(g.y).toBeGreaterThanOrEqual(track.top - 1);
      expect(g.y).toBeLessThanOrEqual(track.top + track.height + 1);
    }
    for (const t of layout.tracks) {
      const first = Math.min(
        ...drawn.genes.filter((g) => g.track === t.index).map((g) => g.y),
      );
      near(t.y, first, `track ${t.index}'s first row`);
      const label = drawn.labels.find((l) => l.track === t.index).box;
      near(t.label.x, label.x, `track ${t.index}'s label x`);
      near(t.label.y, label.y, `track ${t.index}'s label y`);
    }
    expect(layout.annotations).toHaveLength(2);
    for (const a of layout.annotations) {
      const boxes = drawn.marks.filter((m) => m.id === a.id).map((m) => m.box);
      near(a.box.x, Math.min(...boxes.map((b) => b.x)), `${a.id} x`);
      near(a.box.y, Math.min(...boxes.map((b) => b.y)), `${a.id} y`);
      near(
        a.box.x + a.box.width,
        Math.max(...boxes.map((b) => b.x + b.width)),
        `${a.id} right`,
      );
    }
  });

  test('make_figure’s manifest states what the figure draws, and the URL reproduces it', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const query = await queryGenes(page);
    const [from, to] = [query[3], query[12]];
    const result = await callTool<{ manifest: Manifest; url: string }>(
      page,
      'make_figure',
      { top: 4, order: 'score', crop: { from, to } },
    );
    const fig = new URL(result.url).searchParams.get('fig');
    expect(fig).toBe(`cl:${QUERY};top:4;order:score;crop:${from}~${to}`);
    const { manifest } = result;
    expect(manifest.tracks.filter((t) => t.role === 'result')).toHaveLength(4);
    const scores = manifest.tracks
      .filter((t) => t.role === 'result')
      .map((t) => t.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    const figure = await page.evaluate(() => {
      const svg = document.querySelector('gcv-figure svg[data-figure]');
      return {
        tracks: Array.from(svg.querySelectorAll('g[data-track]')).map((g) => ({
          role: g.getAttribute('data-role'),
          label: g.querySelector('[data-label]').textContent,
        })),
        columns: Array.from(svg.querySelectorAll('[data-column]')).map((g) =>
          Number(g.getAttribute('data-column')),
        ),
      };
    });
    expect(figure.tracks.map((t) => t.role)).toEqual(
      manifest.tracks.map((t) => t.role),
    );
    figure.tracks.forEach((t, i) =>
      expect(t.label).toContain(
        manifest.tracks[i].fmin.toLocaleString('en-US'),
      ),
    );
    expect(figure.columns.length).toBeGreaterThan(0);
    for (const c of figure.columns) {
      expect(c).toBeGreaterThanOrEqual(manifest.columns.from - 1);
      expect(c).toBeLessThanOrEqual(manifest.columns.to + 1);
    }
  });

  test('the figure reaches the agent as text or a download, and an oversized read says how to shrink it', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY};top:3`)}`);
    await expect(page.locator('gcv-figure svg[data-figure]')).toHaveCount(1, {
      timeout: 60000,
    });
    const svg = await callTool<string>(page, 'get_figure');
    expect(svg).toMatch(/^<svg [^>]*data-figure="micro-synteny"/);
    const refused = await callTool<{ error: string }>(page, 'get_figure', {
      maxBytes: 1000,
    });
    expect(refused.error).toMatch(/over maxBytes \(1000\).*crop/);
    const download = page.waitForEvent('download');
    const saved = await callTool<{ file: string; bytes: number }>(
      page,
      'export_figure',
      { figure: true, format: 'png' },
    );
    expect((await download).suggestedFilename()).toBe(saved.file);
    expect(saved.file).toMatch(/\.png$/);
    expect(saved.bytes).toBeGreaterThan(0);
  });
});
