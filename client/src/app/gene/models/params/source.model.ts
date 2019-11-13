// Angular
import { AbstractControl, Validators } from '@angular/forms';
// App
import { AppConfig } from '@gcv/app.config';
import { Params } from './params.model';


export class SourceParams implements Params {

  private _sourceIDs: string[] = AppConfig.SERVERS.map((s) => s.id);

  constructor(public sources: string[] = AppConfig.SERVERS.map((s) => s.id)) { }

  formControls(): any {
    return {
      sources: [this.sources, Validators.compose([
        Validators.required,
        this._sourcesValidator,
      ])],
    };
  }

  private _sourcesValidator = (sources: AbstractControl): {[key: string]: any} => {
    if (!sources || !sources.value.length) {
      return {invalidSources: {}};
    }
    if (sources.value.every((s) => this._sourceIDs.indexOf(s.id))) {
      return null;
    }
    return {invalidSources: {sources: sources.value}};
  }

}
