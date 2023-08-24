// Angular
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
// App
import { AppConfig, Brand } from '@gcv/core/models';


declare var bootstrap: any;


@Component({
  selector: 'gcv-header',
  styleUrls: [ './header.component.scss' ],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements AfterViewInit {

  @ViewChild('brandText') brandText;

  brand: Brand;

  private _brandCollapse: any;

  constructor(private _appConfig: AppConfig) {
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
