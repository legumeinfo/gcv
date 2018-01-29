import { AbstractControl, Validators } from '@angular/forms';
import { Regex }                       from '../constants/regex';
import { AppConfig }                   from '../app.config';

export class QueryParams {
  private _sourceIDs: string[] = AppConfig.SERVERS.map(s => s.id);

  private _sourcesValidator = (sources: AbstractControl): {[key: string]: any} => {
    if (!sources || !sources.value.length) return {invalidSources: {}};
    if (sources.value.every(s => this._sourceIDs.indexOf(s.id))) return null;
    return {invalidSources: {sources: sources.value}};
  };

  constructor(
    public neighbors: number    = 10,
    public sources: string[]    = ['lis'],  // Server IDs
    public matched: number      = 4,
    public intermediate: number = 5
  ) { }

  formControls(): any {
    return {
      neighbors: [this.neighbors, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT)
      ])],
      sources: [this.sources, Validators.compose([
        Validators.required,
        this._sourcesValidator
      ])],
      matched: [this.matched, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT)
      ])],
      intermediate: [this.intermediate, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT_AND_ZERO)
      ])],
    };
  }
}
