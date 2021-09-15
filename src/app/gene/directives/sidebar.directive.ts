// Angular
import { animate, style, AnimationBuilder, AnimationFactory, AnimationPlayer }
  from '@angular/animations';
import { Directive, ElementRef } from '@angular/core';
 
@Directive({
  selector: '[gcvSidebar]',
  exportAs: 'sidebar',
})
export class SidebarDirective {

  private _open = true;

  constructor(
    private _animationBuilder: AnimationBuilder,
    private _el: ElementRef) { }

  private _createPlayer(): AnimationPlayer {
    const width = this._el.nativeElement.scrollWidth;
    let animationFactory: AnimationFactory;
    if (this._open) {
      animationFactory = this._animationBuilder.build([
        style({width: `${width}px`}),
        animate('100ms ease-out', style({width: '0'})),
      ]);
    } else {
      animationFactory = this._animationBuilder.build([
        style({width: '0'}),
        animate('100ms ease-in', style({width: `${width}px`})),
      ]);
    }
    return animationFactory.create(this._el.nativeElement);
  }

  toggle() {
    const player = this._createPlayer();
    player.play();
    this._open = !this._open;
  }
}
