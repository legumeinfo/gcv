import { Validators } from '@angular/forms';
import { Regex }      from '../constants/regex';

export class BlockParams {

  constructor(
    public bmatched: number      = 20,
    public bintermediate: number = 10,
    public bmask: number         = 10
  ) { }

  formControls(): any {
    return {
      bmatched: [this.bmatched, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT)
      ])],
      bintermediate: [this.bintermediate, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT_AND_ZERO)
      ])],
      bmask: [this.bmask, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT)
      ])]
    };
  }
}
