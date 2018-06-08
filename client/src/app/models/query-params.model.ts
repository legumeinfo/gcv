// Angular
import { AbstractControl, Validators } from "@angular/forms";
import { Regex } from "../constants";
// App
import { AppConfig } from "../app.config";

export class QueryParams {
  private sourceIDs: string[] = AppConfig.SERVERS.map((s) => s.id);

  constructor(
    public neighbors: number = 10,
    public sources: string[] = AppConfig.SERVERS.map((s) => s.id),
    public matched: number = 4,
    public intermediate: number = 5,
  ) { }

  formControls(): any {
    return {
      intermediate: [this.intermediate, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT_AND_ZERO),
      ])],
      matched: [this.matched, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT),
      ])],
      neighbors: [this.neighbors, Validators.compose([
        Validators.required,
        Validators.pattern(Regex.POSITIVE_INT),
      ])],
      sources: [this.sources, Validators.compose([
        Validators.required,
        this.sourcesValidator,
      ])],
    };
  }

  private sourcesValidator = (sources: AbstractControl): {[key: string]: any} => {
    if (!sources || !sources.value.length) {
      return {invalidSources: {}};
    }
    if (sources.value.every((s) => this.sourceIDs.indexOf(s.id))) {
      return null;
    }
    return {invalidSources: {sources: sources.value}};
  }
}
