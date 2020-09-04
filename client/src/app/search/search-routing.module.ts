// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// App
import { QueryParamsGuard } from '@gcv/core/guards';
import { SearchComponent } from '@gcv/search/components';
import { paramMembers, paramParsers, paramValidators }
  from '@gcv/search/models/params';
import * as fromParams from '@gcv/search/store/selectors/params';

export const routes: Routes = [
  {
    canActivate: [QueryParamsGuard],
    path: '',
    component: SearchComponent,
    data: {
      paramMembers,
      paramParsers,
      paramValidators,
      paramsSelector: fromParams.getParams,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SearchRoutingModule {}
