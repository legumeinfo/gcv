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

// Opens the gene view's panels, for the viewers' callbacks and for agents. The
// gene view provides it and attaches its layout once the layout exists.
@Injectable()
export class PanelService {
  private _layout: GoldenLayoutDirective;
  private _tooltips: TooltipFactoryDirective;
  private _tipOptions: object;

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
    this._addItem(fromViewers.macroLegendConfigFactory(), [1]);
    const click = (id, family) => this.openFamilyDetail(id, family);
    this._addItem(fromViewers.microLegendConfigFactory({ click }), [1]);
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
