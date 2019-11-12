// Angular
import { Validators } from '@angular/forms';
import { Regex } from '@gcv/gene/constants';
// App
import { regexpOr } from '@gcv/gene/utils/regexp-or.util';

export class QueryParams {

  constructor(
    public neighbors: number = 10,
    public matched: number = 4,
    public intermediate: number = 5,
  ) { }

  formControls(): any {
    return {
      intermediate: [this.intermediate, Validators.compose([
        Validators.required,
        Validators.pattern(
          regexpOr(Regex.FRACTION_TO_ONE, Regex.POSITIVE_INT_AND_ZERO)),
      ])],
      matched: [this.matched, Validators.compose([
        Validators.required,
        Validators.pattern(
          regexpOr(Regex.FRACTION_TO_ONE, Regex.POSITIVE_INT)),
      ])],
      neighbors: [this.neighbors, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT),
      ])],
    };
  }
}
