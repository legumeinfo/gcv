// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// App
import * as fromComponents from '@gcv/search/components';
import { SearchRoutingModule } from '@gcv/search/search-routing.module';


@NgModule({
  declarations: [
    ...fromComponents.components,
  ],
  imports: [
    CommonModule,
    SearchRoutingModule,
  ]
})
export class SearchModule { }
