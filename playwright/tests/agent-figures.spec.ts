import { test, expect, Page } from '@playwright/test';
import { FIGURE_KEYS } from '../../src/app/gene/models/params/figure.model';
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
};
type Manifest = {
  tracks: { role: string; fmin: number; fmax: number; score: number | null }[];
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
  test('get_view_layout locates every column, track and label within a pixel', async ({
    page,
  }) => {
    await page.goto(VIEW);
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
      return { genes, labels };
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
    // each label states its span, in Mb, whichever way it reads
    const mb = (n: number) => (n / 1e6).toFixed(3);
    figure.tracks.forEach((t, i) => {
      expect(t.label).toContain(mb(manifest.tracks[i].fmin));
      expect(t.label).toContain(mb(manifest.tracks[i].fmax));
    });
    expect(figure.columns.length).toBeGreaterThan(0);
    for (const c of figure.columns) {
      expect(c).toBeGreaterThanOrEqual(manifest.columns.from - 1);
      expect(c).toBeLessThanOrEqual(manifest.columns.to + 1);
    }
  });

  test('the figure reaches the agent as its claims or text and the user as a file, and an oversized read says how to shrink it', async ({
    page,
  }) => {
    await page.goto(`${VIEW}&fig=${encodeURIComponent(`cl:${QUERY};top:3`)}`);
    await expect(page.locator('gcv-figure svg[data-figure]')).toHaveCount(1, {
      timeout: 60000,
    });
    const read = await callTool<{ manifest: { tracks: unknown[] } }>(
      page,
      'read_figure',
    );
    expect(read.manifest.tracks.length).toBeGreaterThan(0);
    const svg = await callTool<string>(page, 'read_figure', { format: 'svg' });
    expect(svg).toMatch(/^<svg [^>]*data-figure="micro-synteny"/);
    const refused = await callTool<{ error: string }>(page, 'read_figure', {
      format: 'svg',
      maxBytes: 1000,
    });
    expect(refused.error).toMatch(/over maxBytes \(1000\).*crop.*save_figure/);
    // asked for a PNG, the reader points to the tool that saves one
    const png = await callTool<{ error: string }>(page, 'read_figure', {
      format: 'png',
    });
    expect(png.error).toMatch(/save_figure/);
    const download = page.waitForEvent('download');
    const saved = await callTool<{ file: string; bytes: number; dpi: number }>(
      page,
      'save_figure',
      { format: 'png', dpi: 150 },
    );
    expect((await download).suggestedFilename()).toBe(saved.file);
    expect(saved.file).toMatch(/\.png$/);
    expect(saved.bytes).toBeGreaterThan(0);
    expect(saved.dpi).toBe(150);
    const panel = await callTool<{ error: string }>(page, 'export_panel', {
      panel: 'figure',
    });
    expect(panel.error).toMatch(/save_figure/);
  });

  test('the author’s marks sit on the genes and positions they name', async ({
    page,
  }) => {
    await page.goto(VIEW);
    await waitForSettledMicroView(page);
    const query = await queryGenes(page);
    // a query gene's coordinates, for a position inside it
    const alignment = await callTool<{
      clusters: {
        tracks: {
          role: string;
          chromosome: string;
          genes: { name: string; fmin: number; fmax: number }[];
        }[];
      }[];
    }>(page, 'get_microsynteny_alignment', { format: 'genes' });
    const queryTrack = alignment.clusters[0].tracks.find(
      (t) => t.role === 'query',
    );
    const inside = queryTrack.genes.find((g) => g.name === query[7]);
    const result = await callTool<{ notes: string[] }>(page, 'make_figure', {
      top: 3,
      emphasise: [query[4]],
      names: [{ gene: query[4], text: 'Abc1' }],
      spans: [{ from: query[3], to: query[5], text: 'block' }],
      positions: [
        {
          chromosome: queryTrack.chromosome,
          position: Math.round((inside.fmin + inside.fmax) / 2),
          text: 'SNP',
        },
      ],
    });
    expect(result.notes).toEqual([]);
    const drawn = await page.evaluate(
      ([named, spanned, from, to, holder]) => {
        const svg = document.querySelector('gcv-figure svg[data-figure]');
        const gene = (name: string) => {
          const g = svg.querySelector(`[data-track="0"] [data-gene="${name}"]`);
          const [x, y] = g
            .getAttribute('transform')
            .match(/translate\(([-\d.]+), ([-\d.]+)\)/)
            .slice(1)
            .map(Number);
          return {
            x,
            y,
            column: Number(g.getAttribute('data-column')),
            style: g.firstElementChild.getAttribute('style'),
          };
        };
        const numbers = (d: string) =>
          d.match(/-?[\d.]+,-?[\d.]+/g).map((p) => p.split(',').map(Number));
        const name = svg.querySelector('text[data-mark="name"]');
        const leader = numbers(
          svg.querySelector('[data-mark="leader"]').getAttribute('d'),
        );
        const rule = numbers(
          svg.querySelector('path[data-mark="span"]').getAttribute('d'),
        );
        const stem = numbers(
          svg.querySelector('path[data-mark="position"]').getAttribute('d'),
        );
        const columns = Array.from(
          svg.querySelectorAll('[data-track="0"] [data-gene]'),
        ).map((g) => ({
          column: Number(g.getAttribute('data-column')),
          x: Number(
            g.getAttribute('transform').match(/translate\(([-\d.]+)/)[1],
          ),
        }));
        return {
          named: gene(named),
          spanned: gene(spanned),
          from: gene(from),
          to: gene(to),
          holder: gene(holder),
          others: svg.querySelectorAll('[data-gene]').length,
          emphasised: Array.from(svg.querySelectorAll('[data-gene]')).filter(
            (g) =>
              g.firstElementChild.getAttribute('style').includes('#000000'),
          ).length,
          name: {
            x: Number(name.getAttribute('x')),
            text: name.textContent,
          },
          leader,
          rule,
          stem,
          columns,
        };
      },
      [query[4], query[4], query[3], query[5], query[7]] as const,
    );
    const near = (a: number, b: number) =>
      expect(Math.abs(a - b)).toBeLessThanOrEqual(0.5);
    // the emphasised gene, and only its drawings, carry the black outline
    expect(drawn.named.style).toContain('stroke: #000000');
    expect(drawn.emphasised).toBeGreaterThanOrEqual(1);
    expect(drawn.emphasised).toBeLessThan(drawn.others);
    // the name's leader ends on its gene's column, above the gene
    expect(drawn.name.text).toBe('Abc1');
    const end = drawn.leader[drawn.leader.length - 1];
    near(end[0], drawn.named.x);
    expect(end[1]).toBeLessThan(drawn.named.y);
    // the span's rule covers exactly its columns' genes
    const [ruleFrom, ruleTo] = [drawn.rule[0][0], drawn.rule[1][0]];
    for (const c of drawn.columns) {
      const covered = c.x >= ruleFrom && c.x <= ruleTo;
      expect(covered, `column ${c.column}`).toBe(
        c.column >= drawn.from.column && c.column <= drawn.to.column,
      );
    }
    // the position stands on the gene it falls in
    near(drawn.stem[0][0], drawn.holder.x);
    expect(Math.max(drawn.stem[0][1], drawn.stem[1][1])).toBeLessThan(
      drawn.holder.y,
    );
  });

  test('a person and an agent make the same figures: each setting has a control in the tab and an argument of the tools', async ({
    page,
  }) => {
    // each of fig's settings, with the figure tab's controls and the tool
    // arguments that set it; the PNG's resolution is an export choice, not
    // the figure's, so it is outside fig
    const settings: Record<
      string,
      { controls: string[]; args: string[]; tool?: string }
    > = {
      // the viewer's Make figure names the cluster, and the tab offers a
      // choice when its gene is in several
      cl: { controls: [], args: ['cluster', 'clusterGene'] },
      top: { controls: ['#figure-top'], args: ['top'] },
      tracks: { controls: ['[data-figure-tracks] input'], args: ['tracks'] },
      genus: { controls: ['#figure-genus'], args: ['genera'] },
      order: {
        controls: ['#figure-order', '#figure-order-genera'],
        args: ['order', 'genusOrder'],
      },
      merge: {
        controls: ['#figure-merge', '#figure-merge-pairs'],
        args: ['merge', 'mergePairs'],
      },
      crop: {
        controls: ['#figure-crop-from', '#figure-crop-to'],
        args: ['crop'],
      },
      colour: { controls: ['#figure-colour'], args: ['families'] },
      famlabels: { controls: ['#figure-famlabels'], args: ['familyNumbers'] },
      labels: { controls: ['#figure-labels'], args: ['labels'] },
      names: { controls: ['#figure-names'], args: ['geneNames'] },
      w: { controls: ['#figure-w'], args: ['width'] },
      font: { controls: ['#figure-font'], args: ['font'] },
      glyph: { controls: ['#figure-glyph'], args: ['glyph'] },
      legend: { controls: ['#figure-legend'], args: ['legend'] },
      cap: { controls: ['#figure-cap'], args: ['caption'] },
      em: { controls: ['#figure-mark-em'], args: ['emphasise'] },
      name: { controls: ['#figure-mark-names'], args: ['names'] },
      span: { controls: ['#figure-mark-spans'], args: ['spans'] },
      pos: { controls: ['#figure-mark-positions'], args: ['positions'] },
      dpi: { controls: ['#figure-dpi'], args: ['dpi'], tool: 'save_figure' },
    };
    expect(Object.keys(settings).filter((k) => k !== 'dpi')).toEqual(
      FIGURE_KEYS,
    );
    // the fields shown only for some choices, shown
    const fig = `cl:${QUERY};order:Vigna+Phaseolus;merge:a/b`;
    await page.goto(`${VIEW}&fig=${encodeURIComponent(fig)}`);
    await expect(page.locator('gcv-figure svg[data-figure]')).toHaveCount(1, {
      timeout: 60000,
    });
    const selectors = Object.values(settings).flatMap((s) => s.controls);
    for (const selector of selectors) {
      await expect(
        page.locator(`gcv-figure ${selector}`).first(),
        selector,
      ).toBeVisible();
    }
    // every control in the tab sets one of them
    const unlisted = await page.evaluate(
      (selectors) =>
        Array.from(
          document.querySelectorAll(
            'gcv-figure input, gcv-figure select, gcv-figure textarea',
          ),
        )
          .filter((e) => !selectors.some((s) => e.matches(`gcv-figure ${s}`)))
          .map((e) => e.outerHTML.slice(0, 80)),
      selectors,
    );
    expect(unlisted).toEqual([]);
    // and the tools take exactly these arguments
    const schemas = await page.evaluate(() => {
      const tools = (
        window as unknown as {
          __gcvTools: Record<
            string,
            { inputSchema: { properties: Record<string, unknown> } }
          >;
        }
      ).__gcvTools;
      return Object.fromEntries(
        ['make_figure', 'save_figure'].map((n) => [
          n,
          Object.keys(tools[n].inputSchema.properties),
        ]),
      );
    });
    const args = (tool: string) =>
      Object.values(settings)
        .filter((s) => (s.tool ?? 'make_figure') === tool)
        .flatMap((s) => s.args)
        .sort();
    expect(schemas.make_figure.sort()).toEqual(args('make_figure'));
    expect(schemas.save_figure).toContain('dpi');
  });
});
