import { Validators } from '@angular/forms';
import { Regex }      from '../constants/regex';

export class BlockParams {

  constructor(
    public bmatched: number,
    public bintermediate: number,
    public bmask: number
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
