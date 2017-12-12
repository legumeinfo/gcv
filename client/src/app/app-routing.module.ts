// Angular
import { NgModule }                     from '@angular/core';
import { RouterModule, Router, Routes } from '@angular/router';
import { Store }                        from '@ngrx/store';

// app
import { AppStore }              from './models/app-store.model';
import { MultiComponent }        from './components/multi/multi.component';
import { DefaultQueryParams }    from './constants/default-parameters';
import { InstructionsComponent } from './components/instructions/instructions.component';
import { SearchComponent }       from './components/search/search.component';
import { StoreActions }          from './constants/store-actions';

const routes: Routes = [
  {path: '', redirectTo: '/instructions', pathMatch: 'full'},
  {path: 'multi/:genes', component: MultiComponent},
  {
    path: 'basic/:genes', 
    redirectTo: 'multi/:genes',
    pathMatch: 'full'
  },
  {path: 'instructions', component: InstructionsComponent},
  {
    path: 'search/:gene',
    redirectTo: '/search/' + DefaultQueryParams.DEFAULT_SOURCE + '/:gene',
    pathMatch: 'full'
  },
  {path: 'search/:source/:gene', component: SearchComponent}
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, {useHash: true}) ],
  exports: [ RouterModule ]
})

export class AppRoutingModule {
  constructor(private router: Router, private store: Store<AppStore>) {
    router.events.subscribe((navState) => {
      let currentPath = router.url.split('/')[1],
          nextPath    = navState.url.split('/')[1];
      if (currentPath != nextPath) {
        this.store.dispatch({type: StoreActions.RESET});
      }
    });
  }
}
