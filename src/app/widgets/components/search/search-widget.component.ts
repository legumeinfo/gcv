// Angular
import { Component } from '@angular/core';
import { Router } from '@angular/router';
// App
import { AbstractSearchWidgetComponent }
  from './abstract-search-widget.component';
import { AppConfig } from '@gcv/core/models';


@Component({
  selector: 'gcv-search-widget',
  styleUrls: ['./search-widget.component.scss'],
  templateUrl: './search-widget.component.html',
})
export class SearchWidgetComponent extends AbstractSearchWidgetComponent {

  helpText: string;

  constructor(protected _appConfig: AppConfig, protected router: Router) {
    super(_appConfig, router);
    this.helpText = _appConfig.miscellaneous.searchHelpText;
  }

}
