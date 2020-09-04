// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// NgRx
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
// App
import * as fromComponents from '@gcv/search/components';
import * as fromServices from '@gcv/search/services';
import * as fromSearch from './store';
import { SearchRoutingModule } from '@gcv/search/search-routing.module';


@NgModule({
  declarations: [...fromComponents.components],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StoreModule.forFeature(fromSearch.searchFeatureKey, fromSearch.reducers),
    EffectsModule.forFeature(fromSearch.effects),
    SearchRoutingModule,
  ],
  exports: [...fromComponents.components],
  providers: [...fromServices.services],
})
export class SearchModule { }
