// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService } from '@gcv/gene/services';


@Component({
  selector: 'micro-legend',
  styles: [`
    div {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
    }
  `],
  template: '<div #container></div>',
})
export class MicroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() queryGenes: Observable<Gene[]>;
  @Input() tracks: Observable<(Track | ClusterMixin | AlignmentMixin)[]>;
  @Input() colors: any;  // D3 color function
  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    combineLatest(this.tracks, this.queryGenes)
      .pipe(takeUntil(this._destroy))
      .subscribe(([tracks, queryGenes]) => this._draw(tracks, queryGenes));
  }

  ngOnDestroy() {
    this._destroy.next(true);
    this._destroy.complete();
    this._destroyViewer();
  }

  // public

  emitClick(key) {
    this.click.emit(key);
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  // convert track and gene data into a visualization friendly format
  private _shim(tracks) {
    const reducer = (accumulator, track) => {
        track.families.forEach((f) => {
          if (f != '') {
            if (!(f in accumulator)) {
              accumulator[f] = 0;
            }
            accumulator[f] += 1;
          }
        });
        return accumulator;
      };
    const familySizes = tracks.reduce(reducer, {});
    const singletonIDs =
      Object.keys(familySizes).filter((f) => familySizes[f] == 1);
    const singletons = {
        name: 'Singletons',
        id: ['singleton'].concat(singletonIDs).join(','),
      };
    const many = Object.keys(familySizes).filter((f) => familySizes[f] > 1);
    const data = many.map((f: string) => ({name: f, id: f}));
    return {data, singletons};
  }

  private _draw(tracks, queryGenes): void {
    const {data, singletons} = this._shim(tracks);
    let options = {
        blank: singletons,
        blankDashed: {name: "Orphans", id: ''},
        highlight: queryGenes.map((g) => g.family),
        keyClick: (k) => this.emitClick(k.id),
      };
    options = Object.assign(options, this.options);
    this._destroyViewer();
    this._viewer = new GCV.visualization.Legend(
        this.container.nativeElement,
        this.colors,
        data,
        options);
  }
}

export function microLegendConfigFactory(
  geneService: GeneService,
  microTracksService: MicroTracksService,
  outputs: any={})
{
  const id = 'microlegend';
  const options = {autoResize: true};
  let _outputs = {click: (id, family) => { /* no-op */ }};
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'microlegend',
    id: id,
    title: 'Micro Synteny Legend',
    componentState: {
      inputs: {
        queryGenes: geneService.getQueryGenes(),
        tracks: microTracksService.allTracks,
        colors: GCV.common.colors,
        options
      },
      outputs: {click: (family) => _outputs.click(id, family)},
    },
    isClosable: false
  };
}