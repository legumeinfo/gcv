// Angular + dependencies
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild }
  from '@angular/core';
// app
import { GCV } from '@gcv-assets/js/gcv';


@Component({
  selector: 'macro',
  styleUrls: ['../golden-viewer.scss'],
  template: `
    <context-menu></context-menu>
    <div class="viewer" #container></div>
  `,
})
export class MacroComponent implements AfterViewInit, OnDestroy {

  @ViewChild('container', {static: true}) container: ElementRef;

  private _viewer;

  // Angular hooks

  ngAfterViewInit() {
    //const viewer = new GCV.visualization.Micro(this.container.nativeElement);
    this.container.nativeElement.innerHTML = 'macro-synteny viewer';
  }

  ngOnDestroy() {
    this._destroyViewer();
  }

  // private

  private _destroyViewer(): void {
    if (this._viewer !== undefined) {
      this._viewer.destroy();
    }
  }

  private _draw(data): void {
    this._destroyViewer();
    let options = {};
    this._viewer = new GCV.visualization.Macro(
      this.container.nativeElement,
      data,
      options);
  }
}
