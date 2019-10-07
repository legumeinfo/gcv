// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// App
import { GeneComponent } from '@gcv/gene/components';

export const routes: Routes = [
  {
    path: ':source/:gene',
    component: GeneComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeneRoutingModule {}
