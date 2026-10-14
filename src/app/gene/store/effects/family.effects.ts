// Angular
import { Injectable, inject } from '@angular/core';
// store
import { createEffect } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as familyActions from '@gcv/gene/store/actions/family.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
// app

@Injectable()
export class FamilyEffects {
  private _store = inject<Store<fromRoot.State>>(Store);

  // clear the store every time the set of selected genes changes
  clear = createEffect(() => {
    return this._store
      .select(fromGene.getSelectedGeneIDs)
      .pipe(map((...args) => familyActions.Clear()));
  });
}
