// Angular
import { Injectable } from '@angular/core';
// store
import { createEffect } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as familyActions from '@gcv/gene/store/actions/family.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromFamily from '@gcv/gene/store/selectors/family/';
import * as fromGene from '@gcv/gene/store/selectors/gene/';
// app
import { Gene, Track } from '@gcv/gene/models';
import { GeneService } from '@gcv/gene/services';


@Injectable()
export class FamilyEffects {

  constructor(private store: Store<fromRoot.State>) { }

  // clear the store every time the set of selected genes changes
  clear = createEffect(() => this.store.select(fromGene.getSelectedGeneIDs).pipe(
    map((...args) => familyActions.Clear()),
  ));

}
