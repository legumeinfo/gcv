// Angular
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy,
  SimpleChanges, ViewChild } from '@angular/core';
// app
import { ConfigError, DashboardView } from '@gcv/core/models';
import { arrayIsEqual } from '@gcv/core/utils';
// dependencies
import LazyLoad from "vanilla-lazyload";


declare var bootstrap: any;


@Component({
  selector: 'gcv-screenshot',
  styleUrls: [ './screenshot.component.scss' ],
  templateUrl: './screenshot.component.html',
})
export class ScreenshotComponent
implements AfterViewInit, OnChanges, OnDestroy {

  // attributes

  private _screenshotLoader: any;
  private _modalLoader: any;
  private _modal: any;

  private _breakpoints = [  // Bootstrap .container responsive breakpoints in px
      //540,  // small; image is given own row at this size
      720,  // medium
      960,  // large
      1140,  // X-large
      1320,  // XX-large
      Infinity  // simplifies the inlineSizes algorithm
    ];

  // IO

  @Input() screenshot: DashboardView;
  @Input() alt: string;
  @ViewChild('modalElement', {static: true}) modalElement: ElementRef;
  @ViewChild('screenshotElement', {static: true}) screenshotElement: ElementRef;

  // Angular hooks

  ngAfterViewInit() {
    // setup the modal
    this._modal = new bootstrap.Modal(this.modalElement.nativeElement);
    // setup the screenshot lazy loader
    this._initImgLoader(this.screenshotElement.nativeElement);
    // setup the modal lazy loader
    this.modalElement.nativeElement.addEventListener('show.bs.modal', (e) => {
      this._initImgLoader(this.modalElement.nativeElement);
    })
    this.modalElement.nativeElement.addEventListener('hidden.bs.modal', (e) => {
      this._destroyImgLoader(this._modalLoader);
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('screenshot' in changes) {
      this._validateResponsive(changes['screenshot'].currentValue);
      this._updateImgLoader(this._screenshotLoader);
      this._updateImgLoader(this._modalLoader);
    }
  }

  ngOnDestroy() {
    this._destroyImgLoader(this._screenshotLoader);
    this._destroyImgLoader(this._modalLoader);
    this._modal.dispose();
  }

  // private

  private _initImgLoader(element: HTMLElement) {
    this._screenshotLoader = new LazyLoad({}, element.querySelectorAll('img'));
  }

  private _updateImgLoader(loader) {
    if (loader !== undefined) {
      loader.update();
    }
  }

  private _destroyImgLoader(loader) {
    if (loader !== undefined) {
      loader.destroy();
    }
  }

  private _strIsPositiveInt(str) {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n > 0;
  }

  private _responsiveToIntrinsicWidths(responsive) {
    // assumes input is validated with _validateResponsive
    return responsive.map((e) => {
      const [src, intrinsic_width] = e.split(' ');
      return Number(intrinsic_width.substring(0, intrinsic_width.length-1));
    });
  }

  private _validateResponsive(screenshot) {
    // types are validated by AppConfig so we only need to check values
    if (screenshot.responsive === undefined) {
      return;
    }
    // validate srcset values are properly formatted
    const widths = [];
    screenshot.responsive.forEach((e) => {
      const parts = e.split(' ');
      if (parts.length != 2) {
        const msg = `Responsive screenshot image should have two arguments separated by a single space '${e}'`;
        throw new ConfigError(msg);
      } else if (parts[1].length < 2) {
        const msg = `Intrinsic width too short for responsive screenshot image '${e}'`;
        throw new ConfigError(msg);
      } else if (!parts[1].endsWith('w')) {
        const msg = `Intrinsic width should end with a 'w' for responsive screenshot image '${e}'`;
        throw new ConfigError(msg);
      }
      const w = parts[1].substring(0, parts[1].length-1);
      if (!this._strIsPositiveInt(w)) {
        const msg = `Intrinsic width should should be a positive integer for responsive screenshot image '${e}'`;
        throw new ConfigError(msg);
      }
      widths.push(Number(w));
    });
    // check uniqueness and ordering of intrinsic widths
    const sortedWidths = [...new Set(widths)].sort((a: number, b: number) => a-b);
    if (!arrayIsEqual(widths, sortedWidths)) {
      const msg = `Intrinsic widths should be unique and sorted: ${screenshot.responsive}`;
      throw new ConfigError(msg);
    }
  }

  // public

  inlineSizes(responsive) {
    if (responsive === undefined) {
      return '';
    }
    const widths = this._responsiveToIntrinsicWidths(responsive);
    // dovetail iterate the widths and the breakpoints
    const sizes = [];
    let i = 0;
    let j = 0;
    let lower = this._breakpoints[j++];
    let width: number = undefined;
    while (i < widths.length && j < this._breakpoints.length) {
      const w = widths[i]*2;  // *2 because image only takes 1/2 of horizontal space
      const upper = this._breakpoints[j];
      // image is too small
      if (w < lower) {
        i += 1;
      // image is large enough
      } else if (lower <= w && w < upper) {
        if (width === undefined) {
          width = widths[i];
        }
        i += 1;
      // image is too large
      } else {
        if (width !== undefined) {
          const size = `(max-width: ${upper}px) ${width}px`;
          sizes.push(size);
          width = undefined;
        }
        lower = upper;
        j += 1;
      }
    }
    // none of the widths were large enough so take the biggest
    if (i == widths.length && width === undefined) {
      sizes.push(`${widths[i-1]}px`);
    // all widths iterated and we need to add the largest we'll need
    } else if (i == widths.length && width !== undefined) {
      sizes.push(`${width}px`);
    }
    return sizes.join(', ');
  }

  modalSizes(responsive) {
    if (responsive === undefined) {
      return '';
    }
    // modal scales continuously so we use intrinsic widths as breakpoints
    // TODO: should probably consider size too...
    const widths = this._responsiveToIntrinsicWidths(responsive);
    const sizes = widths
      .slice(0, widths.length-1)
      .map((w) => `(max-width: ${w}px) ${w}px`);
    sizes.push(`${widths[widths.length-1]}px`);
    return sizes.join(', ');
  }

  toggleModal(event): void {
    this._modal.show();
  }

}
