// Angular
import './rxjs-extensions';
import { NgModule }                         from '@angular/core';
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
import { alignedMicroTracks } from './reducers/aligned-micro-tracks.store';
import { alignmentParams }    from './reducers/alignment-params.store';
import { globalPlots }        from './reducers/global-plots.store';
import { localPlots }         from './reducers/local-plots.store';
import { macroTracks }        from './reducers/macro-tracks.store';
import { microTracks }        from './reducers/micro-tracks.store';
import { plots }              from './reducers/plots.store';
import { selectedFamily }     from './reducers/selected-family.store';
import { selectedGene }       from './reducers/selected-gene.store';
import { selectedGlobalPlot } from './reducers/selected-global-plot.store';
import { selectedLocalPlot }  from './reducers/selected-local-plot.store';
import { selectedMicroTrack } from './reducers/selected-micro-track.store';
import { ui }                 from './reducers/ui.store';
import { urlQueryParams }     from './reducers/url-query-params.store';

// App components
import { AppComponent }              from './app.component';
import { BasicComponent }            from './components/basic/basic.component';
import { BasicParamsComponent }      from './components/basic/basic-params.component';
import { FamilyDetailComponent }     from './shared/family-detail.component';
import { FooterComponent }           from './shared/footer.component';
import { GeneDetailComponent }       from './shared/gene-detail.component';
import { HeaderComponent }           from './shared/header.component';
import { HelpComponent }             from './shared/help.component';
import { InstructionsComponent }     from './components/instructions/instructions.component';
import { LeftSliderComponent }       from './shared/left-slider.component';
import { LegendComponent }           from './shared/legend.component';
import { LegendToggleComponent }     from './shared/legend-toggle.component';
import { LocalGlobalPlotsComponent } from './components/search/local-global-plots.component';
import { MacroViewerComponent }      from './components/search/macro-viewer.component';
import { MainComponent }             from './shared/main.component';
import { MainContentComponent }      from './shared/main-content.component';
import { MicroViewerComponent }      from './shared/micro-viewer.component';
import { NavComponent }              from './shared/nav.component';
import { OrderingComponent }         from './components/search/ordering.component';
import { ParametersToggleComponent } from './shared/parameters-toggle.component';
import { PlotComponent }             from './shared/plot.component';
import { PlotsComponent }            from './components/search/plots.component';
import { RegexpComponent }           from './shared/regexp.component';
import { RightSliderComponent }      from './shared/right-slider.component';
import { ScrollComponent }           from './components/search/scroll.component';
import { SearchComponent }           from './components/search/search.component';
import { SearchParamsComponent }     from './components/search/search-params.component';
import { SpinnerComponent }          from './shared/spinner.component';
import { TrackDetailComponent }      from './shared/track-detail.component';
import { ViewersComponent }          from './components/search/viewers.component';

// App services
import { AlignmentService }      from './services/alignment.service';
import { FilterService }         from './services/filter.service';
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
      alignedMicroTracks,
      alignmentParams,
      globalPlots,
      localPlots,
      macroTracks,
      microTracks,
      plots,
      selectedFamily,
      selectedGene,
      selectedGlobalPlot,
      selectedLocalPlot,
      ui,
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
    AppComponent,
    BasicComponent,
    BasicParamsComponent,
    FamilyDetailComponent,
    FooterComponent,
    GeneDetailComponent,
    HeaderComponent,
    HelpComponent,
    InstructionsComponent,
    LeftSliderComponent,
    LegendComponent,
    LegendToggleComponent,
    LocalGlobalPlotsComponent,
    MacroViewerComponent,
    MainComponent,
    MainContentComponent,
    MicroViewerComponent,
    NavComponent,
    OrderingComponent,
    ParametersToggleComponent,
    PlotComponent,
    PlotsComponent,
    RegexpComponent,
    RightSliderComponent,
    ScrollComponent,
    SearchComponent,
    SearchParamsComponent,
    SpinnerComponent,
    TrackDetailComponent,
    ViewersComponent
  ],
  providers: [
    AlignmentService,
    FilterService,
    MicroTracksService,
    PlotsService,
    UrlQueryParamsService
  ],
  bootstrap: [ AppComponent ],
})

export class AppModule { }
