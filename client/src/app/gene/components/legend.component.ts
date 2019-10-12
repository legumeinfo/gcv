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

  emitClick() {
    this.click.emit();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(elements): void {
    this._destroyViewer();
    this._viewer = new GCV.visualization.Legend(
        this.container.nativeElement,
        this.colors,
        elements,
        {autoResize: true});
  }
}
