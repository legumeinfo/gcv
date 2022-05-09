// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone,
  OnDestroy, Output, ViewChild } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';
import { AlignmentMixin, ClusterMixin } from '@gcv/gene/models/mixins';
import { FamilyService, GeneService, MicroTracksService }
  from '@gcv/gene/services';
import { microLegendShim } from './micro-legend.shim';


@Component({
  selector: 'gcv-micro-legend',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()"></gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
})
export class MicroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  draw = () => { /* no-op */ };

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _familyService: FamilyService,
              private _geneService: GeneService,
              private _microTracksService: MicroTracksService,
              private _zone: NgZone) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    const queryGenes = this._geneService.getQueryGenes();
    const tracks = this._microTracksService.getAllTracks();
    const omittedFamilies = this._familyService.getOmittedFamilies();
    combineLatest(tracks, queryGenes, omittedFamilies)
      .pipe(takeUntil(this._destroy))
      .subscribe(([tracks, queryGenes, omittedFamilies]) => {
        this._preDraw(tracks, queryGenes, omittedFamilies);
        this.draw();
      });
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
      saveFile('micro-legend', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _preDraw(tracks, queryGenes, omittedFamilies): void {
    const {data, singletons, orphans} = microLegendShim(tracks);
    orphans['checkbox'] = (omittedFamilies.indexOf(orphans.id) === -1);
    let options = {
        blank: singletons,
        blankDashed: orphans,
        checkboxCallback: (id, checked) => {
          this._zone.run(() => {
            if (checked) {
              this._familyService.includeFamilies([id]);
            } else {
              this._familyService.omitFamilies([id]);
            }
          });
        },
        highlight: queryGenes.map((g) => g.family),
        keyClick: (k) => this.emitClick(k),
        selector: 'family',
        membersSelector: 'genes',
      };
    options = Object.assign(options, this.options, {autoResize: false});
    this.draw = this._draw.bind(this, data, options);
  }

  private _draw(data, options) {
    let tempViewer: any;
    const dim = Math.min(
        this.container.nativeElement.clientWidth,
        this.container.nativeElement.clientHeight
      );
    // draw the new viewer before destroying the old to preserve scroll position
    if (dim > 0) {
      tempViewer = new GCV.visualization.Legend(
          this.container.nativeElement,
          GCV.common.colors,
          data,
          options);
    }
    this._destroyViewer();
    this._viewer = tempViewer;
  }
}
