// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, mergeAll, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService, PlotsService }
  from '@gcv/gene/services';
import { FamilyDetailComponent } from './family-detail.component';
import { GeneDetailComponent } from './gene-detail.component';
import { LegendComponent } from './legend.component';
import { MacroComponent } from './macro.component';
import { MicroComponent } from './micro.component';
import { PlotComponent } from './plot.component';
import { TrackDetailComponent } from './track-detail.component';

@Component({
  selector: 'gene',
  styleUrls: ['./gene.component.scss'],
  templateUrl: './gene.component.html',
})
export class GeneComponent implements AfterViewInit, OnDestroy {

  @ViewChild(GoldenLayoutDirective, {static: true}) goldenLayoutDirective;

  private _destroy: Subject<boolean> = new Subject();
  private _microColors = GCV.common.colors;
  private _microLegend: Observable<{name: string, id: string}[]>;

  layoutComponents = [
      {component: GeneDetailComponent, name: 'gene'},
      {component: FamilyDetailComponent, name: 'family'},
      {component: LegendComponent, name: 'legend'},
      {component: MacroComponent, name: 'macro'},
      {component: MicroComponent, name: 'micro'},
      {component: PlotComponent, name: 'plot'},
      {component: TrackDetailComponent, name: 'track'}
    ];
  layoutConfig = {
      content: [{
        type: 'row',
        content: [
          {
            type: 'column',
            content: []
          },
          {
            type: 'column',
            content: []
          }
        ],
      }]
    };

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _plotsService: PlotsService) { }

  // Angular hooks

  ngAfterViewInit(): void {
    this._initializeLegends();
    this._initializeMicroTracks();
  }

  ngOnDestroy(): void {
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _initializeLegends(): void {
    this._microLegend = this._microTracksService.allTracks
      .pipe(
        takeUntil(this._destroy),
        map((tracks) => {
          const reducer = (accumulator, track) => {
              track.families.forEach((f) => accumulator.add(f));
              return accumulator;
            };
          const familySet = tracks.reduce(reducer, new Set());
          const families = Array.from(familySet);
          const legendFamilies = families.map((f: string) => ({name: f, id: f}));
          return legendFamilies;
        })
      );
    const legend = 
      this._legendConfigFactory(this._microLegend, this._microColors);
    this.goldenLayoutDirective.addItem(legend, [0, 1]);
  }

  private _initializeMicroTracks(): void {
    this._microTracksService.clusterIDs
      .pipe(takeUntil(this._destroy))
      .subscribe((IDs) => {
        this._addMicroViewers(IDs);
      });
  }

  private _geneDetailConfigFactory(gene, family, source) {
    const id = `gene:${gene}`;
    return {
      type: 'component',
      componentName: 'gene',
      id: id,
      title: `Gene ${gene}`,
      componentState: {inputs: {gene, family, source}}
    };
  }

  private _familyDetailConfigFactory(family) {
    const id = `family:${family}`;
    return {
      type: 'component',
      componentName: 'family',
      id: id,
      title: `Family ${family}`,
      componentState: {
        inputs: {
          family: family,
          tracks: this._microTracksService.allTracks,
        },
      }
    };
  }

  private _trackDetailConfigFactory(track) {
    const first = track.genes[0];
    const last = track.genes[track.genes.length-1];
    const id = `track:${this._trackIDstring(track)}`;
    return {
      type: 'component',
      componentName: 'track',
      id: id,
      title: `Track: ${track.name}`,
      componentState: {inputs: {track}},
    };
  }

  private _legendConfigFactory(elements, colors) {
    const id = 'microlegend';
    const options = {autoResize: true};
    return  {
      type: 'component',
      componentName: 'legend',
      id: id,
      title: 'Micro Synteny Legend',
      componentState: {
        inputs: {elements: elements, colors: colors, options},
        outputs: {
          click: (family) => {
            const familyConfig = this._familyDetailConfigFactory(family);
            this.goldenLayoutDirective.stackItem(familyConfig, id);
          }
        },
      },
      isClosable: false
    };
  }

  private _trackIDstring(track: (Track | ClusterMixin)) {
    const cluster = (track as ClusterMixin).cluster;
    const selected = (track as Track);
    const name = selected.name;
    const first = selected.genes[0];
    const last = selected.genes[selected.genes.length-1];
    const source = selected.source;
    return `${cluster}:${name}:${first}:${last}:${source}`;
  }

  private _plotConfigFactory(track: (Track | ClusterMixin), query: Track) {
    const cluster = (track as ClusterMixin).cluster;
    const selected = (track as Track);
    const trackName = selected.name;
    const queryName = query.name;
    const options = {autoResize: true};
    const id = `plot:${this._trackIDstring(track)}x${this._trackIDstring(query)}`;
    return {
      type: 'component',
      componentName: 'plot',
      id: id,
      title: `${trackName} x ${queryName} (${cluster})local plot`,
      componentState: {
        inputs: {
          // NOTE: this feels awkward; is there a better way to get one plot?
          plot: this._plotsService.getLocalPlots(track).pipe(
            mergeAll(),
            filter((plot) => (plot.reference as Track).name === query.name),
          ),
          genes: this._geneService.getLocalPlotGenes(track),
          colors: this._microColors,
          options
        },
        outputs: {
          geneClick: ({gene, family, source}) => {
            const geneConfig =
              this._geneDetailConfigFactory(gene, family, source);
            this.goldenLayoutDirective.stackItem(geneConfig, id);
          }
        }
      }
    };
  }

  // stack for local and global plots
  private _plotStackConfigFactory(track: (Track | ClusterMixin)) {
    const cluster = (track as ClusterMixin).cluster;
    const selected = (track as Track);
    const name = selected.name;
    const id = `plots:${this._trackIDstring(track)}`;
    return {
      type: 'stack',
      id: id,
      title: `${name} (${cluster}) plots`,
      content: [],
    };
  }

  private _localPlots(id, track, queryTracks) {
    const plotStackConfig = this._plotStackConfigFactory(track);
    this.goldenLayoutDirective.stackItem(plotStackConfig, id);
    // NOTE: this feel awkward; do we really need to know which track are being
    // plotted ahead of time?
    queryTracks.forEach((query) => {
      const plotConfig = this._plotConfigFactory(track, query);
      this.goldenLayoutDirective.stackItem(plotConfig, plotStackConfig.id);
    });
  }

  private _microConfigFactory(clusterID: number) {
    const id = `micro${clusterID}`;
    const options = {autoResize: true};
    return  {
      type: 'component',
      componentName: 'micro',
      id: id,
      title: `Micro Synteny Cluster ${clusterID}`,
      componentState: {
        inputs: {
          queryTracks:
            this._microTracksService.getSelectedClusterTracks(clusterID),
          tracks: this._microTracksService.getCluster(clusterID),
          genes: this._geneService.getClusterGenes(clusterID),
          colors: this._microColors,
          options
        },
        outputs: {
          plotClick: ({track, queryTracks}) => {
            this._localPlots(id, track, queryTracks);
          },
          geneClick: ({gene, family, source}) => {
            const geneConfig =
              this._geneDetailConfigFactory(gene, family, source);
            this.goldenLayoutDirective.stackItem(geneConfig, id);
          },
          nameClick: ({track}) => {
            const trackConfig = this._trackDetailConfigFactory(track);
            this.goldenLayoutDirective.stackItem(trackConfig, id);
          }
        },
      },
      isClosable: false
    };
  }

  private _addMicroViewers(clusterIDs): void {
    clusterIDs.forEach((id) => {
      const config = this._microConfigFactory(id);
      this.goldenLayoutDirective.addItem(config, [0, 0]);
    });
  }

  // public
}
