// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { Track } from '@gcv/gene/models';
import { GeneService, MicroTracksService } from '@gcv/gene/services';
import { FamilyDetailComponent } from './family-detail.component';
import { LegendComponent } from './legend.component';
import { MacroComponent } from './macro.component';
import { MicroComponent } from './micro.component';
import { PlotComponent } from './plot.component';

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
      {component: FamilyDetailComponent, name: 'family'},
      {component: LegendComponent, name: 'legend'},
      {component: MacroComponent, name: 'macro'},
      {component: MicroComponent, name: 'micro'},
      {component: PlotComponent, name: 'plot'}
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
              private _microTracksService: MicroTracksService) { }

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

  private _plotConfigFactory(clusterID: number, track: Track) {
    const name = track.name;
    const first = track.genes[0];
    const last = track.genes[track.genes.length-1];
    const id = `micro${clusterID}plot${name}:${first}:${last}`;
    return {
      type: 'component',
      componentName: 'plot',
      id: id,
      title: `${name} (${clusterID}) plot`,
    };
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
          tracks: this._microTracksService.getCluster(clusterID),
          genes: this._geneService.getClusterGenes(clusterID),
          colors: this._microColors,
          options
        },
        outputs: {
          plotClick: (track) => {
            const plotConfig = this._plotConfigFactory(clusterID, track);
            this.goldenLayoutDirective.stackItem(plotConfig, id);
          },
          geneClick: (name) => {
            console.log(name);
          },
          nameClick: (track) => {
            console.log(track);
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
