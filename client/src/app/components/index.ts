import { AppComponent } from "./app.component";
import * as fromInstructions from "./instructions";
import * as fromMulti from "./multi";
import * as fromSearch from "./search";
import * as fromShared from "./shared";
import * as fromViewers from "./viewers";

export const components: any[] = [
  AppComponent,
  ...fromInstructions.components,
  ...fromMulti.components,
  ...fromSearch.components,
  ...fromShared.components,
  ...fromViewers.components,
];

export * from "./app.component";
export * from "./instructions";
export * from "./multi";
export * from "./search";
export * from "./shared";
export * from "./viewers";
