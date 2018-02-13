import { AbstractControl, Validators } from "@angular/forms";
import { Regex } from "../constants/regex";

export class ClusteringParams {

  constructor(
    public alpha: number = 0.85,
    public kappa: number = 10,
    public minsup: number = 2,
    public minsize: number = 5,
  ) { }

  formControls(): any {
    return {
      alpha: [this.alpha, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.FRACTION_TO_ONE),
      ])],
      kappa: [this.kappa, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT_AND_ZERO),
      ])],
      minsize: [this.minsize, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT),
      ])],
      minsup: [this.minsup, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.TWO_OR_GREATER),
      ])],
    };
  }
}
