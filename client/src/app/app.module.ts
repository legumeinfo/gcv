// Angular
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// NgRx
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
// config
import { AppConfig } from '@gcv/app.config';
// modules
import { CoreModule } from '@gcv/core/core.module';
// routing
import { AppRoutingModule } from '@gcv/app-routing.module';
// components
import { AppComponent } from '@gcv/core/containers';
// guards
import * as fromGuards from '@gcv/guards';
// store
import { CustomRouterStateSerializer } from '@gcv/gene/utils';
import { ROOT_REDUCERS, metaReducers } from '@gcv/reducers';
import { RouterEffects } from '@gcv/core/store';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    StoreModule.forRoot(ROOT_REDUCERS, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: false,  // classes are not serializable...
        strictActionSerializability: false,  // breaks router store serializer
      },
    }),
    // TODO: how do we give modules their own routerstore/serializer?
    StoreRouterConnectingModule.forRoot({
      serializer: CustomRouterStateSerializer,
    }),
    EffectsModule.forRoot([RouterEffects]),
    CoreModule,
  ],
  providers: [
    AppConfig,
    {
      deps: [AppConfig],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfig) => () => config.load(),
    },
    ...fromGuards.guards,
  ],
  //schemas: [NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule { }
