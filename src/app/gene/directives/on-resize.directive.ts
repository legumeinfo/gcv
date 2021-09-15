// Angular
import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output }
  from '@angular/core';
// dependencies
import ResizeObserver from "resize-observer-polyfill";


@Directive({
  selector: '[gcvOnResize]'
})
export class OnResizeDirective implements OnDestroy, OnInit {

  @Output() gcvOnResize = new EventEmitter();

  // variables

  private _resizeObserver;

  constructor(private _el: ElementRef) { }

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
