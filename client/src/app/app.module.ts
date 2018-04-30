// Angular
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppConfig } from "./app.config";
// routing
import { AppRoutingModule } from "./app-routing.module";
// components
import * as fromComponents from "./components";
import { AlertComponent } from "./components";
// services
import * as fromServices from "./services";
// route guards
import * as fromGuards from "./guards";
// ngrx store
import { RouterStateSerializer, StoreRouterConnectingModule } from "@ngrx/router-store";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { metaReducers, reducers } from "./reducers";
import { effects } from "./effects";
import { CustomRouterStateSerializer } from "./utils/custom-router-state-serializer.util";

@NgModule({
  bootstrap: [ fromComponents.AppComponent ],
  declarations: [ ...fromComponents.components ],
  entryComponents: [ AlertComponent ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    StoreModule.forRoot(reducers, {metaReducers}),
    StoreRouterConnectingModule.forRoot({stateKey: "router"}),
    EffectsModule.forRoot(effects),
  ],
  providers: [
    AppConfig,
    {
      deps: [ AppConfig ],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfig) => () => config.load(),
    },
    {
      provide: RouterStateSerializer,
      useClass: CustomRouterStateSerializer,
    },
    ...fromServices.services,
    ...fromGuards.guards
  ],
})
export class AppModule { }
