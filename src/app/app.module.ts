// Angular
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// NgRx
import { EffectsModule } from '@ngrx/effects';
import { RouterStateSerializer, StoreRouterConnectingModule }
  from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
// config
import { AppConfig } from '@gcv/core/models';
import { AppConfigService } from '@gcv/core/services';
// modules
import { CoreModule } from '@gcv/core/core.module';
// routing
import { AppRoutingModule } from '@gcv/app-routing.module';
// components
import { AppComponent } from '@gcv/core/containers';
// guards
import * as fromGuards from '@gcv/guards';
// store
import { CustomRouterStateSerializer } from '@gcv/store/utils';
import { metaReducers, reducers } from '@gcv/store/reducers';
import * as fromRouter from '@gcv/store/reducers/router.reducer';
import { RouterEffects } from '@gcv/store/effects';


@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: false,  // classes are not serializable...
        strictActionSerializability: false,  // breaks router store serializer
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
      initialState: {
        routerReducer: fromRouter.initialState,
      },
    }),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([RouterEffects]),
    CoreModule,
  ],
  providers: [
    {
      provide: AppConfig,
      deps: [HttpClient],
      useExisting: AppConfigService,
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => {
        return () => appConfigService.load();
      },
    },
    {
      provide: RouterStateSerializer,
      useClass: CustomRouterStateSerializer,
    },
    ...fromGuards.guards,
  ],
  //schemas: [NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule { }
