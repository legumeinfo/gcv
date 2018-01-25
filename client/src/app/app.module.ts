// Angular
import './rxjs-extensions';
import { AppConfig }                        from './app.config';
import { APP_INITIALIZER, NgModule }        from '@angular/core';
import { BrowserModule }                    from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule }                       from '@angular/http';

// App routing
import { AppRoutingModule } from './app-routing.module';

// Ngrx
import { StoreDevtoolsModule }                  from '@ngrx/store-devtools';
import { StoreLogMonitorModule, useLogMonitor } from '@ngrx/store-log-monitor';
import { StoreModule }                          from '@ngrx/store';

// reducers
import { alignmentParams }    from './reducers/alignment-params.store';
import { clusteringParams }   from './reducers/clustering-params.store';
import { globalPlots }        from './reducers/global-plots.store';
import { localPlots }         from './reducers/local-plots.store';
import { macroTracks }        from './reducers/macro-tracks.store';
import { microTracks }        from './reducers/micro-tracks.store';
import { orderFilter }        from './filters/order.filter';
import { regexpFilter }       from './filters/regexp.filter';
import { selectedPlot }       from './reducers/selected-plot.store';
import { urlQueryParams }     from './reducers/url-query-params.store';

// App components
import { AppComponent }          from './app.component';
import { MultiComponent }        from './components/multi/multi.component';
import { MultiParamsComponent }  from './components/multi/multi-params.component';
import { ContextMenuComponent }  from './components/shared/context-menu.component';
import { FamilyDetailComponent } from './components/shared/family-detail.component';
import { GeneDetailComponent }   from './components/shared/gene-detail.component';
import { GeneSearchComponent }   from './components/search/gene-search.component';
import { HeaderComponent }       from './components/shared/header.component';
import { HelpComponent }         from './components/shared/help.component';
import { InstructionsComponent } from './components/instructions/instructions.component';
import { LeftSliderComponent }   from './components/shared/left-slider.component';
import { LegendViewerComponent } from './components/viewers/legend.component';
import { MacroViewerComponent }  from './components/viewers/macro.component';
import { MainComponent }         from './components/shared/main.component';
import { MainContentComponent }  from './components/shared/main-content.component';
import { MicroViewerComponent }  from './components/viewers/micro.component';
import { NavComponent }          from './components/shared/nav.component';
import { OrderingComponent }     from './components/shared/ordering.component';
import { PlotViewerComponent }   from './components/viewers/plot.component';
import { RegexpComponent }       from './components/shared/regexp.component';
import { ScrollComponent }       from './components/search/scroll.component';
import { SearchComponent }       from './components/search/search.component';
import { SearchParamsComponent } from './components/search/search-params.component';
import { SpinnerComponent }      from './components/shared/spinner.component';
import { TrackDetailComponent }  from './components/shared/track-detail.component';
import { ToggleButtonComponent } from './components/shared/toggle-button.component';

// App services
import { AlertsService }         from './services/alerts.service';
import { AlignmentService }      from './services/alignment.service';
import { ClusteringService }     from './services/clustering.service';
import { DetailsService }        from './services/details.service';
import { FilterService }         from './services/filter.service';
import { MacroTracksService }    from './services/macro-tracks.service';
import { MicroTracksService }    from './services/micro-tracks.service';
import { PlotsService }          from './services/plots.service';
import { UrlQueryParamsService } from './services/url-query-params.service';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    ReactiveFormsModule,
    StoreModule.provideStore({
      alignmentParams,
      clusteringParams,
      globalPlots,
      localPlots,
      macroTracks,
      microTracks,
      orderFilter,
      regexpFilter,
      selectedPlot,
      urlQueryParams
    }),
    StoreDevtoolsModule.instrumentStore({
      monitor: useLogMonitor({
        visible: false,
        position: 'right'
      })
    }),
    StoreLogMonitorModule
  ],
  declarations: [
    // App components
    AppComponent,
    MultiComponent,
    MultiParamsComponent,
    ContextMenuComponent,
    FamilyDetailComponent,
    GeneDetailComponent,
    GeneSearchComponent,
    HeaderComponent,
    HelpComponent,
    InstructionsComponent,
    LeftSliderComponent,
    LegendViewerComponent,
    MacroViewerComponent,
    MainComponent,
    MainContentComponent,
    MicroViewerComponent,
    NavComponent,
    OrderingComponent,
    PlotViewerComponent,
    RegexpComponent,
    ScrollComponent,
    SearchComponent,
    SearchParamsComponent,
    SpinnerComponent,
    TrackDetailComponent,
    ToggleButtonComponent
  ],
  providers: [
    // Load site specific configuration
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: (config: AppConfig) => () => config.load(),
      deps: [AppConfig], multi: true
    },
    // App services
    AlertsService,
    AlignmentService,
    ClusteringService,
    DetailsService,
    FilterService,
    MacroTracksService,
    MicroTracksService,
    PlotsService,
    UrlQueryParamsService
  ],
  bootstrap: [ AppComponent ],
})

export class AppModule { }
