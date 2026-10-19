// WebMCP tools that change what the user sees in the gene view without
// changing its analysis: highlighting, panels, family emphasis and downloads.
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
// store
import * as fromFamily from '@gcv/gene/store/selectors/family';
// app
import { saveFile } from '@gcv/core/utils';
import {
  GcvWebMcpTools,
  WebMcpToolError,
  defineGcvWebMcpTool,
  waitFor,
} from '@gcv/core/webmcp/webmcp';
import { PanelService } from '@gcv/gene/components/panel.service';
import { FamilyService } from '@gcv/gene/services';
import { clusterAlignmentTsv } from './alignment.report';
import {
  SETTLE_TIMEOUT_MS,
  ViewContext,
  alignments,
  settledView,
  viewContext,
  viewTracks,
} from './gene-view.context';
import { AgentHighlight } from './highlight';
import { matchGeneName, resolveTrack } from './lookup';
import { AlignedTrack } from './view-state';

// the panel types as agents know them, by layout component type
const PANEL_TYPES: Record<string, string> = {
  micro: 'microsynteny',
  microlegend: 'microsynteny-legend',
  macro: 'macrosynteny',
  macrolegend: 'macrosynteny-legend',
  macrocircos: 'circos',
  plot: 'dot-plot',
  gene: 'gene',
  track: 'track',
  family: 'family',
};

function panelList(panels: PanelService) {
  return panels.panels().map(({ id, componentType, title, instance }) => ({
    id,
    type: PANEL_TYPES[componentType] ?? componentType,
    title,
    exportable: typeof instance?.saveImage === 'function',
  }));
}

function attachedPanels(panels: PanelService): PanelService {
  if (!panels.attached) {
    throw new WebMcpToolError(
      'The gene view has not finished opening; try again shortly.',
    );
  }
  return panels;
}

// the cluster the agent names, or the view's only cluster
function chooseCluster(tracks: AlignedTrack[], cluster?: number): number {
  const clusters = Array.from(new Set(tracks.map((t) => t.cluster)));
  if (cluster === undefined && clusters.length === 1) {
    return clusters[0];
  }
  if (cluster === undefined || !clusters.includes(cluster)) {
    throw new WebMcpToolError(
      `${cluster === undefined ? 'Name a cluster' : `No cluster ${cluster}`}; the view has clusters ${clusters.join(', ')}.`,
    );
  }
  return cluster;
}

// the full name of a gene in the tracks, or an error naming the candidates
function resolveGene(tracks: AlignedTrack[], gene: string): string {
  const matches = matchGeneName(
    tracks.flatMap((t) => t.genes),
    gene,
  );
  if (matches.length !== 1) {
    throw new WebMcpToolError(
      matches.length > 1
        ? `${gene} is ambiguous in this view: ${matches.join(', ')}. Pass the full name.`
        : `${gene} is not in the current view.`,
    );
  }
  return matches[0];
}

const viewFamilies = (tracks: AlignedTrack[]) =>
  new Set(tracks.flatMap((t) => t.families));

function highlightInView(highlight: AgentHighlight) {
  return defineGcvWebMcpTool({
    name: 'highlight_in_view',
    title: 'Highlight genes in the view',
    description:
      "Points the user at genes or gene families in the gene view's viewers, as hovering over them would: everything else fades. Use it to show the user what you are describing. A new highlight replaces the previous one; it ends when the user moves the pointer off something in the view or a viewer redraws. Returns which genes and families the viewers now mark.",
    inputSchema: {
      type: 'object',
      properties: {
        genes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Gene names; unprefixed names work when unambiguous.',
        },
        families: {
          type: 'array',
          items: { type: 'string' },
          description: 'Gene family IDs.',
        },
        clear: {
          type: 'boolean',
          description: 'Remove the highlight instead.',
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async ({ genes = [], families = [], clear }, { signal }) => {
      const context = viewContext();
      if (clear) {
        highlight.clear();
        return { cleared: true };
      }
      if (genes.length === 0 && families.length === 0) {
        throw new WebMcpToolError('Name genes or families to highlight.');
      }
      await settledView(context, signal);
      // the viewers redraw as gene positions load, which ends a highlight
      const clusters = await alignments(context, signal);
      const names = clusters.flatMap((c) =>
        c.tracks.flatMap((t) => t.genes.map((g) => g.name)),
      );
      const resolved: string[] = [];
      const notInView: string[] = [];
      const ambiguous: Record<string, string[]> = {};
      genes.forEach((gene) => {
        const matches = matchGeneName(names, gene);
        if (matches.length === 1) {
          resolved.push(matches[0]);
        } else if (matches.length > 1) {
          ambiguous[gene] = matches;
        } else {
          notInView.push(gene);
        }
      });
      const present = new Set(
        clusters.flatMap((c) =>
          c.tracks.flatMap((t) => t.genes.map((g) => g.family)),
        ),
      );
      const knownFamilies = families.filter((f) => f !== '' && present.has(f));
      notInView.push(...families.filter((f) => !knownFamilies.includes(f)));
      highlight.show({ genes: resolved, families: knownFamilies });
      // what the viewers mark now, which is what the user sees
      const marked = Array.from(
        context.document.querySelectorAll('.GCV.hovering .active'),
      );
      const markedValues = (attribute: string) =>
        new Set(marked.map((e) => e.getAttribute(attribute)));
      const markedGenes = markedValues('data-gene');
      const markedFamilies = markedValues('data-family');
      return {
        highlighted: {
          genes: resolved.filter((g) => markedGenes.has(g)),
          families: knownFamilies.filter((f) => markedFamilies.has(f)),
        },
        notDrawn: [
          ...resolved.filter((g) => !markedGenes.has(g)),
          ...knownFamilies.filter((f) => !markedFamilies.has(f)),
        ],
        notInView,
        ambiguous,
      };
    },
  });
}

const openPanel = defineGcvWebMcpTool({
  name: 'open_panel',
  title: 'Open a gene view panel',
  description:
    "Opens a panel in the gene view for the user, or brings it to the front if it is open: 'gene' (a gene's details and links), 'track' (a micro-synteny track's genes and region links), 'family' (a family's genes in the view and phylogram links), 'macrosynteny' (the macro-synteny blocks of a query chromosome against every genome), 'circos' (a cluster's query chromosomes and their blocks), or 'dot-plot' (a track against each query track, 'local', or each query chromosome, 'global'). Name tracks by chromosome, adding cluster, a gene on the track, or source when needed. Returns the opened panels and every open panel; export_figure saves a panel's figure.",
  inputSchema: {
    type: 'object',
    properties: {
      panel: {
        type: 'string',
        enum: ['gene', 'track', 'family', 'macrosynteny', 'circos', 'dot-plot'],
      },
      gene: {
        type: 'string',
        description:
          "For 'gene': the gene. For 'track' and 'dot-plot': a gene on the track.",
      },
      chromosome: {
        type: 'string',
        description:
          "For 'track', 'dot-plot' and 'macrosynteny' (a query chromosome): the track's chromosome.",
      },
      cluster: {
        type: 'integer',
        minimum: 0,
        description:
          "For 'circos', and to choose among tracks (default: the only cluster).",
      },
      source: { type: 'string' },
      family: {
        type: 'string',
        description: "For 'family': the family ID.",
      },
      plotType: {
        type: 'string',
        enum: ['local', 'global'],
        description: "For 'dot-plot' (default 'local').",
      },
    },
    required: ['panel'],
    additionalProperties: false,
  },
  execute: async (
    { panel, gene, chromosome, cluster, source, family, plotType = 'local' },
    { signal },
  ) => {
    const context = viewContext();
    const panels = inject(PanelService);
    await settledView(context, signal);
    attachedPanels(panels);
    const { queryTracks, tracks: allTracks } = await viewTracks(context);
    const tracks = allTracks.filter(
      (t) => source === undefined || t.source === source,
    );
    const requireArg = (value: unknown, name: string) => {
      if (value === undefined) {
        throw new WebMcpToolError(`'${panel}' needs ${name}.`);
      }
    };
    const track = (candidates: AlignedTrack[]) => {
      requireArg(chromosome, 'chromosome');
      return resolveTrack(candidates, { chromosome, cluster, gene, source });
    };
    const before = new Set(panels.panels().map((p) => p.id));
    let ids: string[];
    switch (panel) {
      case 'gene': {
        requireArg(gene, 'gene');
        const name = resolveGene(tracks, gene);
        const holder = tracks.find((t) => t.genes.includes(name));
        const i = holder.genes.indexOf(name);
        const stack = panels.microViewerID(holder.cluster);
        ids = [
          panels.openGeneDetail(stack, name, holder.families[i], holder.source),
        ];
        break;
      }
      case 'track': {
        const t = track(tracks);
        ids = [panels.openTrackDetail(panels.microViewerID(t.cluster), t)];
        break;
      }
      case 'family': {
        requireArg(family, 'family');
        if (family === '' || !viewFamilies(tracks).has(family)) {
          throw new WebMcpToolError(
            `No gene of family ${family} is in the view.`,
          );
        }
        const stack = panels.microLegendID();
        ids = [panels.openFamilyDetail(stack, { id: family, name: family })];
        break;
      }
      case 'macrosynteny': {
        const t = track(queryTracks);
        const stack = panels.microViewerID(t.cluster);
        ids = [panels.openReference(stack, t.name, t.source, t.cluster)];
        break;
      }
      case 'circos': {
        const c = chooseCluster(allTracks, cluster);
        ids = [panels.openCircos(panels.microViewerID(c), c)];
        break;
      }
      case 'dot-plot': {
        const t = track(tracks);
        const stack = panels.microViewerID(t.cluster);
        const references = queryTracks.filter((q) => q.cluster === t.cluster);
        ids = panels.openPlots(stack, t, references, plotType);
        break;
      }
    }
    const open = panelList(panels);
    const missing = ids.filter((id) => !open.some((p) => p.id === id));
    if (missing.length > 0) {
      throw new WebMcpToolError(
        `The view did not open ${missing.join(', ')}; its viewer may have closed.`,
      );
    }
    return {
      opened: ids.map((id) => ({ id, alreadyOpen: before.has(id) })),
      panels: open,
    };
  },
});

const setFamilyEmphasis = defineGcvWebMcpTool({
  name: 'set_family_emphasis',
  title: 'De-emphasize gene families',
  description:
    "De-emphasizes gene families in the micro-synteny viewers: their genes are drawn as plain circles, without the arrows that show strand, so the remaining families' order and orientation stand out. Use the family ID '' for genes without a family (orphans), as the legend's checkbox does. The setting is not part of the URL, so a shared link doesn't keep it, and it resets when the query genes change.",
  inputSchema: {
    type: 'object',
    properties: {
      deemphasize: {
        type: 'array',
        items: { type: 'string' },
        description: 'Family IDs to draw as circles.',
      },
      restore: {
        type: 'array',
        items: { type: 'string' },
        description: 'Family IDs to draw normally again.',
      },
      restoreAll: {
        type: 'boolean',
        description: 'Draw every family normally.',
      },
    },
    additionalProperties: false,
  },
  execute: async (
    { deemphasize = [], restore = [], restoreAll },
    { signal },
  ) => {
    const context = viewContext();
    const familyService = inject(FamilyService);
    await settledView(context, signal);
    const { tracks } = await viewTracks(context);
    const present = viewFamilies(tracks);
    const unknown = deemphasize.filter((f) => !present.has(f));
    if (unknown.length > 0) {
      throw new WebMcpToolError(
        `No family changed. Not in the view: ${unknown.join(', ')}.`,
      );
    }
    const omitted$ = context.store.select(fromFamily.selectOmittedFamilies);
    const current = await firstValueFrom(omitted$);
    const include = restoreAll ? current : restore;
    familyService.includeFamilies(include);
    familyService.omitFamilies(deemphasize);
    const expected = new Set(
      [...current, ...deemphasize].filter(
        (f) => !include.includes(f) || deemphasize.includes(f),
      ),
    );
    const applied = await waitFor(
      omitted$,
      (omitted) =>
        omitted.length === expected.size &&
        omitted.every((f) => expected.has(f)),
      { signal, timeoutMs: SETTLE_TIMEOUT_MS },
    );
    return {
      deemphasized: applied.value ?? (await firstValueFrom(omitted$)),
    };
  },
});

// waits until a panel's viewer has drawn and saved, for at most two seconds
async function saveDrawn(
  instance: { saveImage(): boolean },
  signal: AbortSignal,
): Promise<boolean> {
  for (let i = 0; i < 20; i++) {
    if (instance.saveImage()) {
      return true;
    }
    signal.throwIfAborted();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

async function exportTsv(
  context: ViewContext,
  signal: AbortSignal,
  cluster?: number,
) {
  const { tracks } = await viewTracks(context);
  const c = chooseCluster(tracks, cluster);
  const [alignment] = await alignments(context, signal, c);
  const tsv = clusterAlignmentTsv(alignment);
  saveFile(
    `micro-synteny-alignment-cluster${c}-`,
    tsv,
    'text/tab-separated-values',
    'tsv',
  );
  return {
    downloaded: 'tsv',
    cluster: c,
    tracks: alignment.tracks.length,
    columns: tsv.split('\n')[0].split('\t').length,
  };
}

const exportFigure = defineGcvWebMcpTool({
  name: 'export_figure',
  title: 'Download a figure',
  description:
    "Downloads a figure from the gene view to the user's computer, as the panel's 'Save image' menu does: 'svg' saves a panel's drawing (a micro-synteny viewer, legend, macro-synteny viewer, circos or dot plot), with styles inlined for publication; 'tsv' saves a cluster's whole micro-synteny alignment, one row per track and one column per consensus position (the format of get_microsynteny_alignment). Name the panel by its ID from open_panel, or give a cluster for its micro-synteny viewer. Ask the user before downloading files they didn't request.",
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['svg', 'tsv'],
        description: "Default 'svg'.",
      },
      panel: {
        type: 'string',
        description: "For 'svg': the panel ID (e.g. 'micro0').",
      },
      cluster: {
        type: 'integer',
        minimum: 0,
        description:
          "For 'tsv', or 'svg' without a panel: the cluster (default: the only cluster).",
      },
    },
    additionalProperties: false,
  },
  execute: async ({ format = 'svg', panel, cluster }, { signal }) => {
    const context = viewContext();
    const panels = inject(PanelService);
    await settledView(context, signal);
    attachedPanels(panels);
    if (format === 'tsv') {
      return exportTsv(context, signal, cluster);
    }
    let id = panel;
    if (id === undefined) {
      const { tracks } = await viewTracks(context);
      id = panels.microViewerID(chooseCluster(tracks, cluster));
    }
    const target = panels.panels().find((p) => p.id === id);
    if (typeof target?.instance?.saveImage !== 'function') {
      const exportable = panelList(panels).filter((p) => p.exportable);
      throw new WebMcpToolError(
        `${target === undefined ? `No open panel ${id}` : `Panel ${id} has no figure`}; panels with figures: ${JSON.stringify(exportable.map(({ id, title }) => ({ id, title })))}. open_panel opens others.`,
      );
    }
    // a panel behind another tab isn't drawn until it is in front
    panels.activate(id);
    if (!(await saveDrawn(target.instance, signal))) {
      throw new WebMcpToolError(
        `Panel ${id} has not drawn; it may be too small to draw in. Try again once it has.`,
      );
    }
    return {
      downloaded: 'svg',
      panel: id,
      title: target.title,
    };
  },
});

export function displayWebMcpTools(highlight: AgentHighlight): GcvWebMcpTools {
  return [
    highlightInView(highlight),
    openPanel,
    setFamilyEmphasis,
    exportFigure,
  ];
}
