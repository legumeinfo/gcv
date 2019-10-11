// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { GoldenLayoutDirective } from '@gcv/gene/directives';
import { GeneService, MicroTracksService } from '@gcv/gene/services';
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

  private _legendConfigFactory(elements, colors) {
    return  {
     type: 'component',
      componentName: 'legend',
      componentState: {
        inputs: {elements: elements, colors: colors},
        outputs: {
          click: (() => {
            // TODO: this should do something more useful
            console.log('legend click');
          })
        },
      },
      isClosable: false
    };
  }

  private _microConfigFactory(clusterID: number) {
    return  {
     type: 'component',
      componentName: 'micro',
      componentState: {
        inputs: {
          tracks: this._microTracksService.getCluster(clusterID),
          genes: this._geneService.getClusterGenes(clusterID),
          colors: this._microColors
        },
        outputs: {
          plot: (() => {
            this.goldenLayoutDirective
              // TODO: this should call a plot config factory
              .addItem({type: 'component', componentName: 'plot'});
          })
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
