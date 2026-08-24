// Angular
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Observable } from 'rxjs';
// app
import { LayoutService } from '@gcv/gene/services';

@Component({
  selector: 'gcv-header-left',
  styles: [
    `
      a {
        cursor: pointer;
      }
      .btn-outline-dark:hover {
        color: #fff !important;
      }
    `,
  ],
  template: `
    <ul class="navbar-nav me-auto">
      <li>
        <a
          [class.active]="
            (visible | async) && (content | async) === 'parameters'
          "
          class="btn btn-outline-dark me-sm-2"
          role="button"
          (click)="toggleParameters()"
          >Parameters</a
        >
      </li>
      <li>
        <a
          [class.active]="(visible | async) && (content | async) === 'filters'"
          class="btn btn-outline-dark"
          role="button"
          (click)="toggleFilters()"
          >Filters</a
        >
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class HeaderLeftComponent {
  private _layoutService = inject(LayoutService);

  visible: Observable<boolean>;
  content: Observable<string>;

  constructor() {
    const _layoutService = this._layoutService;

    this.visible = _layoutService.getLeftSliderState();
    this.content = _layoutService.getLeftSliderContent();
  }

  // public

  toggleParameters(): void {
    this._layoutService.toggleLeftSliderContent('parameters');
  }

  toggleFilters(): void {
    this._layoutService.toggleLeftSliderContent('filters');
  }
}
