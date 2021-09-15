// Angular
import { Directive, ElementRef, Input, OnInit } from '@angular/core';

 
@Directive({
  selector: '[gcvLazyLoad]'
})
export class LazyLoad implements OnInit {

  @Input('gcvLazyLoad') src: string;

  constructor(private _el: ElementRef) { }

  ngOnInit() {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const lazyImage: any = entry.target;
          lazyImage.src = this.src;
          //lazyImage.srcset = this.srcset;
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImageObserver.observe(this._el.nativeElement);
  }

}
