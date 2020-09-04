// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { saveFile } from '@gcv/core/utils';
import { MicroTracksService } from '@gcv/gene/services';
import { getMacroColors } from '@gcv/gene/utils';
import { macroLegendShim } from './macro-legend.shim';


@Component({
  selector: 'gcv-macro-legend',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <gcv-context-menu (saveImage)="saveImage()"></gcv-context-menu>
    <div (gcvOnResize)="draw()" class="viewer" #container></div>
  `,
})
export class MacroLegendComponent implements AfterViewInit, OnDestroy {

  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  draw = () => { /* no-op */ };

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  constructor(private _microTracksService: MicroTracksService) { }

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    const selectedTracks = this._microTracksService.getSelectedTracks();
    const tracks = this._microTracksService.getAllTracks();
    combineLatest(selectedTracks, tracks)
      .pipe(takeUntil(this._destroy))
      .subscribe(([queries, tracks]) => {
        this._preDraw(queries, tracks);
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
      saveFile('macro-legend', this._viewer.xml(), 'image/svg+xml', 'svg');
    }
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
      this._viewer = undefined;
    }
  }

  private _preDraw(queries, tracks): void {
    const {data, highlight} = macroLegendShim(queries, tracks);
    let colors = getMacroColors(queries);
    if (colors === undefined) {
      colors = (organism) => '#000000';
    }
    let options = {highlight, selector: 'organism'};
    options = Object.assign(options, this.options, {autoResize: false});
    this.draw = this._draw.bind(this, colors, data, options);
  }

  private _draw(colors, data, options) {
    this._destroyViewer();
    const dim = Math.min(
        this.container.nativeElement.clientWidth,
        this.container.nativeElement.clientHeight
      );
    if (dim > 0) {
      this._viewer = new GCV.visualization.Legend(
          this.container.nativeElement,
          colors,
          data,
          options);
    }
  }
}
