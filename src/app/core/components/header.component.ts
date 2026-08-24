// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
// App
import { AppConfig, Brand } from '@gcv/core/models';


declare let bootstrap: any;


@Component({
    selector: 'gcv-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private _appConfig = inject(AppConfig);


  @ViewChild('brandText') brandText;

  brand: Brand;

  private _brandCollapse: any;

  constructor() {
    const _appConfig = this._appConfig;

    this.brand = _appConfig.brand;
  }

  ngAfterViewInit(): void {
    this._brandCollapse = new bootstrap.Collapse(this.brandText.nativeElement, {toggle: !this.brand.hide});
  }

  ngOnDestroy(): void {
    this._brandCollapse.dispose();
  }

  toggleBrand(): void {
    if (this.brand.hide) {
      this._brandCollapse.toggle();
    }
  }
}
