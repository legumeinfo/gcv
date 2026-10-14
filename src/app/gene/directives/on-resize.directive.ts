// Angular
import {
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';

@Directive({
  selector: '[gcvOnResize]',
  standalone: false,
})
export class OnResizeDirective implements OnDestroy, OnInit {
  private _el = inject(ElementRef);

  @Output() gcvOnResize = new EventEmitter();

  // variables

  private _resizeObserver;

  // Angular hooks

  ngOnDestroy() {
    if (this._resizeObserver != undefined) {
      this._resizeObserver.disconnect();
    }
  }

  ngOnInit() {
    this._resizeObserver = new ResizeObserver((entries) => {
      this.gcvOnResize.emit(entries);
    });
    this._resizeObserver.observe(this._el.nativeElement);
  }
}
