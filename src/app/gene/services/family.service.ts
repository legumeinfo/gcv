// Angular
import { Injectable } from '@angular/core';
// store
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as familyActions from '@gcv/gene/store/actions/family.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromFamily from '@gcv/gene/store/selectors/family';


@Injectable()
export class FamilyService {

  constructor(private _store: Store<fromRoot.State>) { }

  omitFamilies(families: string[]): void {
    this._store.dispatch(familyActions.OmitFamilies({families}));
  }

  includeFamilies(families: string[]): void {
    this._store.dispatch(familyActions.IncludeFamilies({families}));
  }

  getOmittedFamilies(): Observable<string[]> {
    return this._store.select(fromFamily.getOmittedFamilies);
  }

}
