// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// App
import * as fromComponents from '@gcv/search/components';
import { SearchRoutingModule } from '@gcv/search/search-routing.module';


@NgModule({
  declarations: [...fromComponents.components],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchRoutingModule,
  ],
  exports: [...fromComponents.components],
})
export class SearchModule { }
