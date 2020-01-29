// Angular
import { AbstractControl, Validators } from '@angular/forms';
// app
import { LINKAGES, Regex } from '@gcv/gene/constants';
import { Params } from './params.model';


export class ClusteringParams implements Params {

  private _linkageIDs = LINKAGES.map((l) => l.id);

  constructor(
    public linkage: string = 'average',  // TODO: remove magic string
    public threshold: number = 20) {
  }

  asObject() {
    return {
      linkage: this.linkage,
      threshold: this.threshold,
    };
  }

  formControls(): any {
    return {
      linkage: [this.linkage, Validators.compose([
        Validators.required,
        this._linkageValidator,
      ])],
      threshold: [this.threshold, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT),
      ])],
    };
  }

  private _linkageValidator = (linkage: AbstractControl): {[key: string]: any} => {
    if (!linkage || !linkage.value.length) {
      return {invalidLinkage: {}};
    }
    if (this._linkageIDs.indexOf(linkage.value.id) !== -1) {
      return null;
    }
    return {invalidLinkage: {linkage: linkage.value}};
  }

}
