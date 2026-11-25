// Questions with answers known from the data, for measuring how well agents
// use GCV's WebMCP tools. Each scenario's premises check, with the tools
// themselves, the facts its rubric relies on, so a scenario whose data has
// changed reports itself stale rather than failing agents; a premise may
// return facts, which rubric items written as functions use. The rubric is
// judged against the agent's final answer. A scenario's outcome checks,
// made with the tools on the view the agent ends on, test what it wrote
// into the URL.

const QUERY = 'glyma.Wm82.gnm4.ann1.Glyma.15G255600';

const DEFAULTS =
  'algorithm=repeat&match=10&mismatch=-1&gap=-1&score=30&threshold=25' +
  '&bmatched=20&bintermediate=10&bmask=10&bchrgenes=1&bchrlength=100000' +
  '&linkage=average&cthreshold=20&neighbors=10&matched=4&intermediate=5' +
  '&sources=lis&bregexp=&border=distance&order=distance';

const gene = (name) => `glyma.Wm82.gnm4.ann1.Glyma.${name}`;

const FIGURE_GENERA = ['Phaseolus', 'Vigna'];
// the view lists Phaseolus first, so asking for Vigna first tests the order

const view = (regexp = '') => `/gene;lis=${QUERY}?${DEFAULTS}&regexp=${regexp}`;

const chromosome = (region) => region.chromosome.split('.').pop();

// the region on a chromosome whose name ends with suffix
const regionOn = (report, suffix) =>
  report.regions.find((r) => chromosome(r) === suffix);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

export const scenarios = [
  {
    id: 'lupin-copies',
    url: view(),
    prompt:
      'How many copies of the region around the query gene does each lupin species (Lupinus albus and Lupinus angustifolius) have, according to GCV, and how well supported is each copy?',
    premises: [
      {
        about:
          'a wider window finds the third L. angustifolius copy, NLL-09; loosened thresholds alone add only a weak L. albus Chr03 track',
        async check(call) {
          const report = await call('compare_parameter_sets', {
            // the unfiltered current view has more regions than the default cap
            maxRegions: 200,
            sets: [
              { regexp: 'Lupinus', matched: 2, intermediate: 10, score: 20 },
              {
                regexp: 'Lupinus',
                neighbors: 20,
                matched: 5,
                intermediate: 15,
              },
            ],
          });
          expect(!report.error, report.error);
          const nll09 = regionOn(report, 'NLL-09');
          expect(nll09?.foundIn.includes('set2'), 'set2 finds NLL-09');
          expect(!nll09.foundIn.includes('set1'), 'set1 misses NLL-09');
          const chr03 = regionOn(report, 'Lalb_Chr03');
          expect(
            chr03?.foundIn.join() === 'set1',
            'only set1 finds Lalb_Chr03',
          );
          expect(
            chr03.support.set1.singleCopyFamiliesMatched <= 2,
            'Lalb_Chr03 matches at most 2 single-copy families',
          );
        },
      },
    ],
    rubric: [
      'Reports three copies of the region in L. angustifolius, including one on NLL-09.',
      'Says that NLL-09 is found only with a wider neighborhood (neighbors, with intermediate), not at the default settings.',
      'Does not present the L. albus Lalb_Chr03 track as a well-supported copy: either does not report it as a copy, or reports that its support is weak (few or few single-copy families, a short span, or found only with loosened thresholds).',
      'Gives, for its counts, a GCV URL or the parameter values that reproduce them.',
    ],
  },
  {
    id: 'soybean-homeolog',
    url: view(),
    prompt:
      'Which other region of the soybean genome is the duplicate copy of the region around the query gene, what supports that, and when did the duplication happen?',
    premises: [
      {
        about:
          'the best-scoring other G. max gnm4 track is on Gm08, aligned largely inverted',
        async check(call) {
          const report = await call('get_microsynteny_alignment', {
            maxTracks: 100,
          });
          expect(!report.error, report.error);
          const tracks = report.clusters
            .flatMap((c) => c.tracks)
            .filter(
              (t) =>
                t.role === 'result' &&
                t.chromosome.startsWith('glyma.Wm82.gnm4.') &&
                !t.chromosome.endsWith('Gm15'),
            )
            .sort((a, b) => b.score - a.score);
          expect(tracks[0]?.chromosome.endsWith('Gm08'), 'best is Gm08');
          expect(
            tracks[0].summary.inverted > tracks[0].summary.aligned / 2,
            'Gm08 aligns mostly inverted',
          );
        },
      },
    ],
    rubric: [
      'Identifies the region on soybean chromosome Gm08 (gnm4) as the duplicate copy.',
      'Reports that the Gm08 copy aligns inverted relative to the query.',
      "Does not attribute a date, an age or a Ks value for the duplication to GCV: either says GCV cannot date it, or gives a date with a source other than GCV's tools.",
    ],
  },
  {
    id: 'lupin-gene-absence',
    url: view('Lupinus'),
    prompt:
      "Have the lupins lost the query gene's family from these regions? Answer from what GCV shows.",
    premises: [
      {
        about:
          "the query gene's family has no gene in the lupin tracks at the default settings",
        async check(call) {
          const detail = await call('get_gene_details', { gene: QUERY });
          expect(!detail.error, detail.error);
          const report = await call('get_microsynteny_alignment', {
            format: 'genes',
            maxTracks: 100,
          });
          const lupinGenes = report.clusters
            .flatMap((c) => c.tracks)
            .filter((t) => t.role === 'result' && t.genus === 'Lupinus')
            .flatMap((t) => t.genes);
          expect(lupinGenes.length > 0, 'the view has lupin tracks');
          expect(
            !lupinGenes.some((g) => g.family === detail.family),
            'no lupin track has the family',
          );
        },
      },
    ],
    rubric: [
      'Reports that the family has no gene in the lupin tracks GCV shows at these settings.',
      'Does not conclude that the family was lost from the lupin genomes on that basis alone: it says this is only not found, or names what would need checking (a wider search, the genome-wide family members, unplaced scaffolds), or reports having checked it.',
      'States the settings or gives the URL of the view it searched.',
    ],
  },
  {
    id: 'figure-two-genera',
    url: view(),
    prompt:
      'Make a publication figure of the ten best-scoring result tracks from Phaseolus and Vigna, with the Vigna tracks first, 120 mm wide.',
    premises: [
      {
        about: 'the view has more than ten Phaseolus and Vigna result tracks',
        async check(call) {
          const report = await call('get_microsynteny_alignment', {
            maxTracks: 200,
          });
          expect(!report.error, report.error);
          const scores = report.clusters
            .flatMap((c) => c.tracks)
            .filter(
              (t) => t.role === 'result' && FIGURE_GENERA.includes(t.genus),
            )
            .map((t) => t.score)
            .sort((a, b) => b - a);
          expect(scores.length > 10, `${scores.length} tracks`);
          return { best: scores.slice(0, 10) };
        },
      },
    ],
    rubric: [
      "Gives the figure's URL, or says the figure is open in the figure tab and how to download it.",
    ],
    outcome: [
      {
        about:
          'the figure shows the ten best-scoring Phaseolus and Vigna result tracks, Vigna first, 120 mm wide',
        async check(call, facts) {
          const figure = await call('read_figure');
          expect(!figure.error, figure.error);
          const results = figure.manifest.tracks.filter(
            (t) => t.role === 'result',
          );
          expect(results.length === 10, `${results.length} result tracks`);
          const genera = results.map((t) => t.genus);
          expect(
            genera.every((g) => FIGURE_GENERA.includes(g)),
            `genera ${genera.join(', ')}`,
          );
          expect(
            genera.lastIndexOf('Vigna') < genera.indexOf('Phaseolus') ||
              !genera.includes('Phaseolus'),
            `order ${genera.join(', ')}`,
          );
          const scores = results.map((t) => t.score).sort((a, b) => b - a);
          expect(
            scores.join() === facts.best.join(),
            `scores ${scores.join()} are not the best ${facts.best.join()}`,
          );
          expect(/w:120\b/.test(figure.url), 'the width is 120 mm');
        },
      },
    ],
  },
  {
    id: 'figure-png',
    url: view(),
    prompt:
      'Make a figure of the five best-scoring result tracks and save it to my computer as a PNG at 600 dpi.',
    premises: [
      {
        about: 'the view has more than five result tracks',
        async check(call) {
          const report = await call('get_microsynteny_alignment', {
            maxTracks: 200,
          });
          expect(!report.error, report.error);
          const results = report.clusters
            .flatMap((c) => c.tracks)
            .filter((t) => t.role === 'result');
          expect(results.length > 5, `${results.length} tracks`);
        },
      },
    ],
    rubric: [
      'Says the figure was saved as a PNG at 600 dpi, naming the file or its size.',
    ],
    outcome: [
      {
        about: 'the figure shows five result tracks',
        async check(call) {
          const figure = await call('read_figure');
          expect(!figure.error, figure.error);
          const results = figure.manifest.tracks.filter(
            (t) => t.role === 'result',
          );
          expect(results.length === 5, `${results.length} result tracks`);
        },
      },
    ],
  },
  {
    id: 'figure-one-family',
    url: view(),
    prompt:
      "Make a figure of the three best-scoring result tracks in which only the query gene's family is colored.",
    premises: [
      {
        about: 'the query gene has a family',
        async check(call) {
          const details = await call('get_gene_details', { gene: QUERY });
          expect(!details.error, details.error);
          expect(details.family, 'no family');
          return { family: details.family };
        },
      },
    ],
    rubric: [
      "Names the family colored, or says it is the query gene's family.",
    ],
    outcome: [
      {
        about: "the figure colors exactly the query gene's family",
        async check(call, facts) {
          const figure = await call('read_figure');
          expect(!figure.error, figure.error);
          const coloured = figure.manifest.colours
            .filter((c) => c.colour !== null)
            .map((c) => c.family);
          expect(
            coloured.length === 1 && coloured[0] === facts.family,
            `colored ${coloured.join(', ')}, not ${facts.family}`,
          );
        },
      },
    ],
  },
];
