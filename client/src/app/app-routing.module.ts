// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/instructions',
  },
  {
    path: 'instructions',
    loadChildren: '@gcv/instructions/instructions.module#InstructionsModule',
  },
  {
    path: 'gene',
    loadChildren: '@gcv/gene/gene.module#GeneModule',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
