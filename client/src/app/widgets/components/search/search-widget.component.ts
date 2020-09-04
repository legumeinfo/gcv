// Angular
import { Component } from '@angular/core';
// App
import { AbstractSearchWidgetComponent }
  from './abstract-search-widget.component';
import { AppConfig } from '@gcv/app.config';


@Component({
  selector: 'gcv-search-widget',
  styleUrls: ['./search-widget.component.scss'],
  templateUrl: './search-widget.component.html',
})
export class SearchWidgetComponent extends AbstractSearchWidgetComponent {

  helpText: string = AppConfig.MISCELLANEOUS.searchHelpText;

}
