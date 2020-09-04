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
    loadChildren: () => import('@gcv/instructions/instructions.module').then(m => m.InstructionsModule),
  },
  {
    path: 'gene',
    loadChildren: () => import('@gcv/gene/gene.module').then(m => m.GeneModule),
  },
  {
    path: 'search',
    loadChildren: () => import('@gcv/search/search.module').then(m => m.SearchModule),
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
