// Angular
import { Injectable } from '@angular/core';
import { ComponentItemConfig, StackItemConfig } from 'golden-layout';
// app
import {
  GoldenLayoutDirective,
  LayoutComponentItem,
  TooltipFactoryDirective,
} from '@gcv/gene/directives';
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import * as fromDetails from './details';
import * as fromTooltips from './tooltips';
import * as fromViewers from './viewers';

type ClusteredTrack = Track & ClusterMixin;

// the legend column's bounds when it fits the legends: never narrower than
// MIN_LEGEND_WIDTH pixels, nor wider than its share of the initial layout
const MIN_LEGEND_WIDTH = 120;
const MAX_LEGEND_SIZE = 50;
// whitespace beside the widest legend, as a fraction of its width, so the
// labels don't run into the column's edge
const LEGEND_MARGIN = 0.25;

// Opens the gene view's panels, for the viewers' callbacks and for agents. The
// gene view provides it and attaches its layout once the layout exists.
@Injectable()
export class PanelService {
  private _layout: GoldenLayoutDirective;
  private _tooltips: TooltipFactoryDirective;
  private _tipOptions: object;
  // what each legend needs to show every key, by legend panel ID
  private _legendWidths = new Map<
    string,
    { width: number; container: HTMLElement }
  >();
  // the legend column's size, in percent, as last fitted; undefined until
  // the first fit, null once the user has resized the column
  private _fittedSize: number | null | undefined;

  attach(
    layout: GoldenLayoutDirective,
    tooltips: TooltipFactoryDirective,
    tipOptions: object,
  ): void {
    this._layout = layout;
    this._tooltips = tooltips;
    this._tipOptions = tipOptions;
  }

  get attached(): boolean {
    return this._layout !== undefined;
  }

  // replaces every panel with the legends and a micro-synteny viewer per
  // cluster
  reset(clusterIDs: number[]): void {
    this._legendWidths.clear();
    this._fittedSize = undefined;
    this._layout.reset();
    this._initializeLegends();
    this._addMicroViewers(clusterIDs);
  }

  // the open panels, with their component instances
  panels(): LayoutComponentItem[] {
    return this._layout?.componentItems() ?? [];
  }

  // brings an open panel to the front of its stack
  activate(id: string): boolean {
    return this._layout.activateItem(id);
  }

  microViewerID(clusterID: number): string {
    return fromViewers.microConfigFactory(clusterID).id;
  }

  microLegendID(): string {
    return fromViewers.microLegendConfigFactory().id;
  }

  // Each open… method opens a panel in the stack of the panel stackID, or
  // brings it to the front if it's open, and returns its ID.

  openGeneDetail(
    stackID: string,
    gene: string,
    family: string,
    source: string,
  ): string {
    const config = fromDetails.geneDetailConfigFactory(gene, family, source);
    this._stackItem(config, stackID);
    return config.id;
  }

  openTrackDetail(stackID: string, track: ClusteredTrack): string {
    const config = fromDetails.trackDetailConfigFactory(track);
    this._stackItem(config, stackID);
    return config.id;
  }

  openFamilyDetail(
    stackID: string,
    family: { id: string; name: string },
  ): string {
    const config = fromDetails.familyDetailConfigFactory(family);
    this._stackItem(config, stackID);
    return config.id;
  }

  openCircos(stackID: string, clusterID: number): string {
    const config = fromViewers.macroCircosConfigFactory(clusterID);
    this._stackItem(config, stackID);
    return config.id;
  }

  openReference(
    stackID: string,
    name: string,
    source: string,
    clusterID: number,
  ): string {
    const outputs = {
      blockOver: (e, pairwiseBlocks, block) => {
        const inputs = { pairwiseBlocks, block };
        const config = fromTooltips.macroBlockTooltipConfigFactory(
          inputs,
          this._tipOptions,
        );
        this._tooltips.componentTip(e.target, config);
      },
    };
    const config = fromViewers.macroConfigFactory(
      name,
      source,
      clusterID,
      outputs,
    );
    this._stackItem(config, stackID);
    return config.id;
  }

  // opens a dot plot of the track against each query track (local) or query
  // chromosome (global) in a stack of its own; returns the plots' IDs
  openPlots(
    stackID: string,
    track: ClusteredTrack,
    queryTracks: ClusteredTrack[],
    type: 'local' | 'global',
  ): string[] {
    const plotStackConfig = fromViewers.plotStackConfigFactory(track);
    this._stackItem(plotStackConfig, stackID);
    const plotStackID = plotStackConfig.id;
    const outputs = {
      geneClick: (id, gene, family, source) => {
        this.openGeneDetail(id, gene, family, source);
      },
      geneOver: this._geneTooltip.bind(this),
    };
    return queryTracks.map((query) => {
      const config = fromViewers.plotConfigFactory(type, track, query, outputs);
      this._stackItem(config, plotStackID);
      return config.id;
    });
  }

  // private

  // the config factories' configs are untyped
  private _addItem(config: object, indices: number[]): void {
    this._layout.addItem(config as ComponentItemConfig, indices);
  }

  private _stackItem(config: object, stackID: string): void {
    this._layout.stackItem(
      config as ComponentItemConfig | StackItemConfig,
      stackID,
    );
  }

  private _geneTooltip(e, gene, family, source): void {
    const inputs = { gene, source };
    const config = fromTooltips.geneTooltipConfigFactory(
      inputs,
      this._tipOptions,
    );
    this._tooltips.componentTip(e.target, config);
  }

  private _initializeLegends(): void {
    const naturalWidth = this._fitLegends.bind(this);
    this._addItem(fromViewers.macroLegendConfigFactory({ naturalWidth }), [1]);
    const click = (id, family) => this.openFamilyDetail(id, family);
    this._addItem(
      fromViewers.microLegendConfigFactory({ click, naturalWidth }),
      [1],
    );
  }

  // Narrows the legend column to the widest legend, with a margin, giving
  // the micro-synteny viewers the rest of the row. Legends report their width on each draw,
  // including after the window or column resizes, so the fit follows both;
  // once the user drags the column's splitter, the fit leaves it alone.
  private _fitLegends(
    id: string,
    legend: { width: number; container: HTMLElement },
  ): void {
    this._legendWidths.set(id, legend);
    const column = this._layout.rootChildWidth(id);
    if (column === undefined || this._fittedSize === null) {
      return;
    }
    if (
      this._fittedSize !== undefined &&
      Math.abs(column.size - this._fittedSize) > 0.5
    ) {
      this._fittedSize = null;
      return;
    }
    // a legend's container is narrower than the column by its scrollbar and
    // borders; a hidden legend (behind another tab) can't be measured
    const needed = Array.from(this._legendWidths.values())
      .filter((l) => l.width > 0 && l.container.clientWidth > 0)
      .map(
        (l) =>
          l.width * (1 + LEGEND_MARGIN) +
          column.width -
          l.container.clientWidth,
      );
    if (needed.length === 0) {
      return;
    }
    const width = Math.max(MIN_LEGEND_WIDTH, ...needed);
    const maxWidth = (column.width / column.size) * MAX_LEGEND_SIZE;
    const target = Math.min(width, maxWidth);
    if (Math.abs(target - column.width) < 2) {
      this._fittedSize ??= column.size;
      return;
    }
    this._fittedSize = this._layout.setRootChildWidth(id, target) ?? null;
  }

  private _addMicroViewers(clusterIDs: number[]): void {
    const options = {
      plotClick: (e, id, track, queryTracks) => {
        const outputs = {
          localClick: () => this.openPlots(id, track, queryTracks, 'local'),
          globalClick: () => this.openPlots(id, track, queryTracks, 'global'),
        };
        const config = fromTooltips.plotTooltipConfigFactory(
          outputs,
          this._tipOptions,
        );
        this._tooltips.componentTip(e.target, config);
      },
      geneClick: (id, gene, family, source) => {
        this.openGeneDetail(id, gene, family, source);
      },
      geneOver: this._geneTooltip.bind(this),
      nameClick: (id, track) => this.openTrackDetail(id, track),
      circos: (id, clusterID) => this.openCircos(id, clusterID),
      reference: (id, name, source, clusterID) => {
        this.openReference(id, name, source, clusterID);
      },
    };
    clusterIDs.forEach((id) => {
      const config = fromViewers.microConfigFactory(id, options);
      this._addItem(config, [0, 0]);
    });
  }
}
