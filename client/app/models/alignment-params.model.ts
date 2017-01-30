import { AbstractControl, Validators } from '@angular/forms';
import { ALIGNMENT_ALGORITHMS }        from '../constants/alignment-algorithms';
import { POSITIVE_INT, NEGATIVE_INT }  from '../constants/regex';

export class AlignmentParams {
  private _algorithms: string = ALIGNMENT_ALGORITHMS.map(a => a.id).join('|');

  constructor(
    public algorithm: string,  // Algorithm ID
    public match: number,
    public mismatch: number,
    public gap: number,
    public score: number,
    public threshold: number
  ) { }

  formControls(): any {
    return {
      algorithm: [this.algorithm, Validators.compose([
        Validators.required,
        Validators.pattern(this._algorithms)
      ])],
      match: [this.match, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])],
      mismatch: [this.mismatch, Validators.compose([
        Validators.required,
        Validators.pattern(NEGATIVE_INT)
      ])],
      gap: [this.gap, Validators.compose([
        Validators.required,
        Validators.pattern(NEGATIVE_INT)
      ])],
      score: [this.score, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])],
      threshold: [this.threshold, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])]
    };
  }
}
