// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// app
import { LegacyMultiRouteGuard, LegacySearchRouteGuard } from '@gcv/guards';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/instructions',
  },
  // modules
  {
    path: 'instructions',
    loadChildren: '@gcv/instructions/instructions.module#InstructionsModule',
  },
  {
    path: 'gene',
    loadChildren: '@gcv/gene/gene.module#GeneModule',
  },
  // legacy URLs
  {
    canActivate: [LegacySearchRouteGuard],
    path: 'search/:gene',
    children: [],
  },
  {
    canActivate: [LegacySearchRouteGuard],
    path: 'search/:source/:gene',
    children: [],
  },
  {
    canActivate: [LegacyMultiRouteGuard],
    path: 'basic/:genes',
    children: [],
  },
  {
    canActivate: [LegacyMultiRouteGuard],
    path: 'multi/:genes',
    children: [],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
