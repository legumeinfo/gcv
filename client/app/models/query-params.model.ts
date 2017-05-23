import { AbstractControl, Validators } from '@angular/forms';
import { POSITIVE_INT }                from '../constants/regex';
import { AppConfig }                   from '../app.config';

export class QueryParams {
  private _sourceIDs: string[] = AppConfig.SERVERS.map(s => s.id);

  private _sourcesValidator = (sources: AbstractControl): {[key: string]: any} => {
    if (!sources || !sources.value.length) return {invalidSources: {}};
    if (sources.value.every(s => this._sourceIDs.indexOf(s.id))) return null;
    return {invalidSources: {sources: sources.value}};
  };

  constructor(
    public neighbors: number,
    public sources: string[],  // Server IDs
    public matched?: number,
    public intermediate?: number
  ) { }

  formControls(): any {
    let controls: any = {
      neighbors: [this.neighbors, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])],
      sources: [this.sources, Validators.compose([
        Validators.required,
        this._sourcesValidator
      ])]
    };
    if (this.matched !== undefined) {
      controls.matched = [this.matched, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])];
    }
    if (this.intermediate !== undefined) {
      controls.intermediate = [this.intermediate, Validators.compose([
        Validators.required,
        Validators.pattern(POSITIVE_INT)
      ])];
    }
    return controls;
  }
}
