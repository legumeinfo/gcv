import { AbstractControl, Validators } from '@angular/forms';
import { POSITIVE_INT,
         POSITIVE_INT_AND_ZERO,
         FRACTION_TO_ONE,
         NEGATIVE_INT,
         TWO_OR_GREATER }  from '../constants/regex';

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
        Validators.pattern(FRACTION_TO_ONE)
      ])],
      kappa: [this.kappa, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT_AND_ZERO)
      ])],
      minsup: [this.minsup, Validators.compose([
        Validators.required,
        Validators.pattern(TWO_OR_GREATER)
      ])],
      minsize: [this.minsize, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])]
    };
  }
}
