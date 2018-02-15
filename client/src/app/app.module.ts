// Angular
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppConfig } from "./app.config";

// App routing
import { AppRoutingModule } from "./app-routing.module";

// components
import { AppComponent } from "./app.component";
import { InstructionsComponent } from "./components/instructions/instructions.component";
import { MultiParamsComponent } from "./components/multi/multi-params.component";
import { MultiComponent } from "./components/multi/multi.component";
import { GeneSearchComponent } from "./components/search/gene-search.component";
import { ScrollComponent } from "./components/search/scroll.component";
import { SearchParamsComponent } from "./components/search/search-params.component";
import { SearchComponent } from "./components/search/search.component";
import { ContextMenuComponent } from "./components/shared/context-menu.component";
import { FamilyDetailComponent } from "./components/shared/family-detail.component";
import { GeneDetailComponent } from "./components/shared/gene-detail.component";
import { HeaderComponent } from "./components/shared/header.component";
import { HelpComponent } from "./components/shared/help.component";
import { LeftSliderComponent } from "./components/shared/left-slider.component";
import { MainContentComponent } from "./components/shared/main-content.component";
import { MainComponent } from "./components/shared/main.component";
import { NavComponent } from "./components/shared/nav.component";
import { OrderingComponent } from "./components/shared/ordering.component";
import { RegexpComponent } from "./components/shared/regexp.component";
import { SpinnerComponent } from "./components/shared/spinner.component";
import { ToggleButtonComponent } from "./components/shared/toggle-button.component";
import { TrackDetailComponent } from "./components/shared/track-detail.component";
import { LegendViewerComponent } from "./components/viewers/legend.component";
import { MacroViewerComponent } from "./components/viewers/macro.component";
import { MicroViewerComponent } from "./components/viewers/micro.component";
import { PlotViewerComponent } from "./components/viewers/plot.component";

// services
import { AlertsService } from "./services/alerts.service";
import { AlignmentService } from "./services/alignment.service";
import { ClusteringService } from "./services/clustering.service";
import { DetailsService } from "./services/details.service";
import { FilterService } from "./services/filter.service";
import { MacroTracksService } from "./services/macro-tracks.service";
import { MicroTracksService } from "./services/micro-tracks.service";
import { PlotsService } from "./services/plots.service";
import { UrlService } from "./services/url.service";

// ngrx store
import { RouterStateSerializer, StoreRouterConnectingModule } from "@ngrx/router-store";
import { StoreModule } from "@ngrx/store";
import { metaReducers, reducers } from "./reducers";
import { CustomRouterStateSerializer } from "./utils/custom-router-state-serializer.util";

@NgModule({
  bootstrap:    [ AppComponent ],
  declarations: [
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
    ToggleButtonComponent,
  ],
  imports:      [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    ReactiveFormsModule,
    StoreModule.forRoot(reducers, {metaReducers}),
    StoreRouterConnectingModule.forRoot({stateKey: "router"}),
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
    AlertsService,
    AlignmentService,
    ClusteringService,
    DetailsService,
    FilterService,
    MacroTracksService,
    MicroTracksService,
    PlotsService,
    UrlService,
  ],
})
export class AppModule { }
