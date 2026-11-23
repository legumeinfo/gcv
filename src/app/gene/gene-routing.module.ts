// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// App
import { QueryParamsGuard } from '@gcv/core/guards';
import {
  GeneComponent,
  HeaderCenterComponent,
  HeaderLeftComponent,
  HeaderRightComponent,
} from '@gcv/gene/components';
import {
  figureParamMembers,
  figureParamParsers,
  figureParamValidators,
  paramMembers,
  paramParsers,
  paramValidators,
} from '@gcv/gene/models/params';
import * as fromParams from '@gcv/gene/store/selectors/params';

export const routes: Routes = [
  {
    canActivate: [QueryParamsGuard],
    path: '',
    component: GeneComponent,
    data: {
      paramMembers: [...paramMembers, ...figureParamMembers],
      paramParsers: { ...paramParsers, ...figureParamParsers },
      paramValidators: { ...paramValidators, ...figureParamValidators },
      // fills only missing or invalid analysis parameters, so fig stays out
      // of the URL while no figure is open
      paramsSelector: fromParams.getParams,
    },
  },
  {
    path: '',
    component: HeaderLeftComponent,
    outlet: 'header-left',
  },
  {
    path: '',
    component: HeaderCenterComponent,
    outlet: 'header-center',
  },
  {
    path: '',
    component: HeaderRightComponent,
    outlet: 'header-right',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneRoutingModule {}
