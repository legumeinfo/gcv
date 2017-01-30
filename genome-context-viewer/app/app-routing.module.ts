// Angular
import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// app
import { BasicComponent }        from './components/basic/basic.component';
import { DEFAULT_SOURCE }        from './constants/default-parameters';
import { InstructionsComponent } from './components/instructions/instructions.component';
import { SearchComponent }       from './components/search/search.component';

const routes: Routes = [
  {path: '', redirectTo: '/instructions', pathMatch: 'full'},
  {path: 'basic/:genes',  component: BasicComponent},
  {path: 'instructions', component: InstructionsComponent},
  {
    path: 'search/:gene',
    redirectTo: '/search/' + DEFAULT_SOURCE + '/:gene',
    pathMatch: 'full'
  },
  {path: 'search/:source/:gene', component: SearchComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, {useHash: true}) ],
  exports: [ RouterModule ]
})

export class AppRoutingModule {}
