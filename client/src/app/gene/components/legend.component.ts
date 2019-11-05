// Angular + dependencies
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  Output, ViewChild } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';


@Component({
  selector: 'legend',
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
export class LegendComponent implements AfterViewInit, OnDestroy {

  @Input() elements: Observable<{name: string, id: string}[]>;
  @Input() colors: any;  // D3 color function
  @Input() options: any = {};
  @Output() click = new EventEmitter();

  @ViewChild('container', {static: true}) container: ElementRef;

  private _destroy: Subject<boolean> = new Subject();
  private _viewer;

  // Angular hooks

  ngAfterViewInit() {
    // fetch own data because injected components don't have change detection
    this.elements
      .pipe(takeUntil(this._destroy))
      .subscribe((elements) => this._draw(elements));
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

  private _draw(elements): void {
    let options = {keyClick: (k) => this.emitClick(k.id)};
    options = Object.assign(options, this.options);
    this._destroyViewer();
    this._viewer = new GCV.visualization.Legend(
        this.container.nativeElement,
        this.colors,
        elements,
        options);
  }
}

export function legendConfigFactory(elements, outputs: any={}) {
  const id = 'microlegend';
  const options = {autoResize: true};
  let _outputs = {click: (id, family) => { /* no-op */ }};
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'legend',
    id: id,
    title: 'Micro Synteny Legend',
    componentState: {
      inputs: {elements: elements, colors: GCV.common.colors, options},
      outputs: {click: (family) => _outputs.click(id, family)},
    },
    isClosable: false
  };
}
