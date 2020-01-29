// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// App
import { GeneComponent, HeaderLeftComponent, HeaderRightComponent }
  from '@gcv/gene/components';
import { QueryParamsGuard } from '@gcv/gene/guards';

export const routes: Routes = [
  {
    canActivate: [QueryParamsGuard],
    path: '',
    component: GeneComponent,
  },
  {
    path: '',
    component: HeaderLeftComponent,
    outlet: 'header-left'
  },
  {
    path: '',
    component: HeaderRightComponent,
    outlet: 'header-right'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneRoutingModule {}
