// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { GeneService, MicroTracksService } from '@gcv/gene/services';


@Component({
  selector: 'micro-legend',
  styleUrls: ['./golden-content.scss'],
  template: `
    <context-menu (saveImage)="saveImage()"></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MicroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _geneService: GeneService,
              private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    const queryGenes = this._geneService.getQueryGenes();
    const tracks = this._microTracksService.getAllTracks();
    combineLatest(tracks, queryGenes)
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

  saveImage(): void {
    if (this._viewer !== undefined) {
      saveFile('micro-synteny', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
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
        GCV.common.colors,
        data,
        options);
  }
}


export const microLegendLayoutComponent = 
  {component: MicroLegendComponent, name: 'microlegend'};


export function microLegendConfigFactory(outputs: any={}) {
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
      inputs: {options},
      outputs: {click: (family) => _outputs.click(id, family)},
    },
    isClosable: false
  };
}
