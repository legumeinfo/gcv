import { AbstractControl, Validators } from '@angular/forms';
import { Regex }                       from '../constants/regex';

export class ClusteringParams {

  constructor(
    public alpha: number,
    public kappa: number,
    public minsup: number,
    public minsize: number,
  ) { }

  formControls(): any {
    return {
      alpha: [this.alpha, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.FRACTION_TO_ONE)
      ])],
      kappa: [this.kappa, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT_AND_ZERO)
      ])],
      minsup: [this.minsup, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.TWO_OR_GREATER)
      ])],
      minsize: [this.minsize, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT)
      ])]
    };
  }
}
