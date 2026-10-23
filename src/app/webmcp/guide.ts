// How to use GCV, for agents: describe_gcv returns it with what the
// configuration provides. Every tool is listed here; a unit test keeps the list
// in step with the registered tools.

export const OVERVIEW =
  'GCV (Genome Context Viewer) compares the genomic context of genes across genomes, using gene families as the unit of homology. Given query genes, it takes each with its neighboring genes (a track), clusters similar tracks, aligns each cluster into a consensus of gene families, searches the data sources for tracks of other genomes that resemble it (micro-synteny) and aligns them to the consensus. For each query chromosome it also finds the chromosome-scale synteny blocks shared with whole genomes (macro-synteny). The view and its parameters live in the URL, so every view can be shared and reproduced.';

export const WORKFLOW =
  'Find gene names with search_genes_and_regions, open the gene view on them with show_gene_contexts, then read and adjust the analysis with the gene view tools.';

export type ToolGuide = {
  group: string;
  about: string;
  tools: { name: string; use: string }[];
};

export const TOOL_GUIDE: ToolGuide[] = [
  {
    group: 'start',
    about: 'Available on every page.',
    tools: [
      {
        name: 'describe_gcv',
        use: "This guide, with the instance's data sources and parameter defaults.",
      },
      {
        name: 'search_genes_and_regions',
        use: 'Turn gene names, partial names or regions into the exact names GCV uses.',
      },
      {
        name: 'show_gene_contexts',
        use: 'Open the gene view on genes or a region; waits for the whole analysis.',
      },
    ],
  },
  {
    group: 'analysis',
    about:
      'Read and change the analysis of the open gene view; set_view_parameters is the only one that changes it.',
    tools: [
      {
        name: 'get_view_status',
        use: 'Check what loaded, the clusters, failed searches and every parameter.',
      },
      {
        name: 'set_view_parameters',
        use: 'Change the neighborhood size, search sensitivity, alignment, filters or sources; reports the result tracks the change added and removed.',
      },
      {
        name: 'get_microsynteny_alignment',
        use: 'Read which genes correspond across tracks, per track or as a table.',
      },
      {
        name: 'find_syntenic_counterparts',
        use: "Find one gene's positional counterparts in every other track.",
      },
      {
        name: 'get_macrosynteny_blocks',
        use: 'Find chromosome-scale synteny and how many times each genome covers the query.',
      },
      {
        name: 'get_family_summary',
        use: 'Count gene family copies per track and species, and tandem arrays.',
      },
      {
        name: 'get_dot_plot_pairs',
        use: "Test a track's collinearity with the query, locally or across the chromosome.",
      },
      {
        name: 'get_gene_details',
        use: "Get a gene's family, coordinates and the data source's links for it.",
      },
    ],
  },
  {
    group: 'display',
    about:
      "Change what the user sees in the open gene view, without changing the analysis or the URL; use them to show the user what you're describing.",
    tools: [
      {
        name: 'highlight_in_view',
        use: 'Fade everything but the genes or families you are discussing.',
      },
      {
        name: 'open_panel',
        use: 'Open gene, track or family details, a macro-synteny view, circos or a dot plot.',
      },
      {
        name: 'set_family_emphasis',
        use: 'Draw some families as strandless circles so the others stand out.',
      },
      {
        name: 'export_figure',
        use: "Download a panel's SVG, or a cluster's alignment as TSV, for the user.",
      },
    ],
  },
];

export const CONCEPTS = [
  'One gene view is open at a time, and the gene view tools work on it. Their results include its URL, which reproduces it.',
  'A query track is a query gene with `neighbors` genes on each side. Similar query tracks form a cluster; each cluster has its own micro-synteny viewer and a consensus sequence of gene families.',
  'Result tracks come from searching each data source for tracks similar to a cluster, and are aligned to its consensus. Genes in the same consensus column correspond positionally across genomes; a gene between two columns is an insertion with no counterpart.',
  "An alignment can be inverted relative to the consensus ('-'). The 'repeat' algorithm can align one track in several segments, revealing rearrangements; 'smith-waterman' gives each track its single best alignment.",
  'Genes of one family share a color. Families with one gene in the view are drawn white; genes without a family (orphans) are drawn white with a dashed outline.',
  'Macro-synteny blocks relate a query chromosome to the chromosomes of every genome in the selected sources.',
  "Dot plots pair same-family genes between a track and the query: 'local' against the query track, 'global' against the whole query chromosome.",
  "Tools that read the view wait for it to finish loading. A search that fails leaves the view 'partial'; get_view_status lists the issues.",
  'Large results are truncated (maxTracks, maxTargets, maxFamilies, maxPairs) and say how much was left out.',
  'A tool that fails returns {"error": message} as its result; the message says what went wrong and how to recover.',
];

export const RECIPES = [
  {
    question:
      'Which genes in other genomes correspond to my gene (syntenic orthologs or paralogs)?',
    steps:
      'search_genes_and_regions → show_gene_contexts → find_syntenic_counterparts. A counterpart with sameFamily true and a collinear context is strong evidence of orthology or of a duplicate from a whole-genome duplication; get_gene_details gives its coordinates and links.',
  },
  {
    question:
      'Is this region conserved, inverted or rearranged across species?',
    steps:
      "get_microsynteny_alignment (summary): compare familyMatches, inverted, segments and consensusCoverage across tracks. For one track, get_dot_plot_pairs gives rankCorrelation: near 1 collinear, near -1 inverted. The 'repeat' algorithm splits rearranged tracks into segments.",
  },
  {
    question:
      'Has the region been duplicated (whole-genome or segmental duplication)?',
    steps:
      "Several result tracks from one genome in a cluster suggest duplicates. get_macrosynteny_blocks reports, per species, how many query genes its blocks cover and how many blocks cover each on average (meanDepth). In another genome a depth near 2 suggests the region was duplicated there; in the query's own genome, the query region matching itself adds 1. Fractionation after a polyploidy leaves old copies sharing few genes, so at the default settings these counts are a lower bound: widen neighbors and intermediate, as for a region the view misses, before concluding how many copies a genome has.",
  },
  {
    question: 'Has a gene family expanded, contracted or formed tandem arrays?',
    steps:
      "get_family_summary: compare each family's bySpecies counts with the species' track counts, and read tandemArrays; pass family for its genes per track.",
  },
  {
    question:
      'The view misses a region you expect (e.g. a copy that other synteny data reports).',
    steps:
      "set_view_parameters, widening the search before lowering the evidence it requires. Expect misses after a polyploidy (a whole-genome duplication or triplication in the query's or the result's lineage): fractionation, the loss of duplicate genes from one copy or the other, leaves each copy sharing fewer genes, farther apart. Raise neighbors first, so the query track brings enough families to reach matched despite the genes the result's copy lost, and intermediate, so the search bridges the genes the query's copy lost. Lower matched or score only if that fails, and treat tracks found only then as candidates, not findings. Change one thing at a time, counting neighbors with intermediate as one: set_view_parameters reports the result tracks each change added and removed. The tool waits for the new analysis.",
  },
  {
    question: 'Is a result track real synteny or a chance match?',
    steps:
      'Weigh what supports it. Strong: it survives a wider window (neighbors) at strict matched and score; it shares many families in collinear order over a long span (get_microsynteny_alignment summary, get_dot_plot_pairs rankCorrelation); a macro-synteny block on its chromosome spans it (get_macrosynteny_blocks). Weak: it appears only with loosened matched or score; it rests on a few genes, or mostly on large or tandem families (get_family_summary), whose members turn up in many places, so sharing them proves little.',
  },
  {
    question: 'The view shows too much.',
    steps:
      "set_view_parameters: restrict genomes with regexp (e.g. 'Glycine'), change sources, or raise matched or score.",
  },
  {
    question: 'Show the user what you found.',
    steps:
      'highlight_in_view to point at genes or families, open_panel for details, macro-synteny, circos or dot plots, and export_figure to download an SVG or the alignment TSV.',
  },
];

export const SEEING_THE_VIEW = [
  "The viewers are SVG in the page. If you can take browser screenshots, call highlight_in_view or open_panel first so the screenshot shows what you're discussing.",
  "A screenshot shows only the visible part of a viewer, and a viewer behind another tab is not drawn. export_figure brings a panel to the front and downloads its full drawing as SVG, with styles inlined, to the user's computer; ask the user before downloading.",
  'In the DOM, micro-synteny genes carry data-gene and data-family attributes and tracks carry data-chromosome; macro-synteny blocks carry data-locus, data-reference-locus and data-orientation.',
];
