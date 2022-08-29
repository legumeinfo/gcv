// Angular
import { Component } from '@angular/core';
// App
import { AbstractSearchWidgetComponent }
  from './abstract-search-widget.component';
import { AppConfig } from '@gcv/core/models';


@Component({
  selector: 'gcv-search-widget',
  templateUrl: './search-widget.component.html',
})
export class SearchWidgetComponent extends AbstractSearchWidgetComponent {

  helpText: string = AppConfig.miscellaneous.searchHelpText;

}
